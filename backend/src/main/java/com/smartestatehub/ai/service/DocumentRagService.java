package com.smartestatehub.ai.service;

import com.smartestatehub.ai.dto.ChatResponse;
import com.smartestatehub.ai.dto.DocumentQueryRequest;
import com.smartestatehub.ai.dto.ClientQueryRequest;
import com.smartestatehub.ai.model.DocumentEmbedding;
import com.smartestatehub.ai.repository.DocumentEmbeddingRepository;
import com.smartestatehub.crm.model.Document;
import com.smartestatehub.crm.repository.DocumentRepository;
import com.smartestatehub.crm.service.ClientPortalService;
import com.smartestatehub.crm.dto.ClientPortalDataDto;
import com.smartestatehub.crm.repository.DealRepository;
import com.smartestatehub.crm.repository.ClientRepository;
import com.smartestatehub.crm.repository.ContractRepository;
import com.smartestatehub.crm.model.Deal;
import com.smartestatehub.crm.model.Client;
import com.smartestatehub.crm.model.Contract;
import com.smartestatehub.crm.service.CloudinaryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.client.RestClient;
import java.util.Map;
import java.util.Collections;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.embedding.EmbeddingModel;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.InputStream;
import java.net.URL;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.*;
import java.util.stream.Collectors;
import java.io.File;

@Service
@RequiredArgsConstructor
@Slf4j
public class DocumentRagService {

    private final DocumentRepository documentRepository;
    private final DocumentEmbeddingRepository embeddingRepository;
    private final EmbeddingModel embeddingModel;
    private final ChatClient chatClient;
    private final ClientPortalService clientPortalService;
    private final DealRepository dealRepository;
    private final ClientRepository clientRepository;
    private final ContractRepository contractRepository;
    private final CloudinaryService cloudinaryService;

    @Value("${spring.ai.openai.api-key}")
    private String apiKey;

    @Value("${spring.ai.openai.base-url}")
    private String baseUrl;

    @Value("${spring.ai.openai.embedding.options.model:nvidia/llama-nemotron-embed-1b-v2}")
    private String embeddingModelName;

    private RestClient restClient;

    private void initRestClient() {
        if (restClient == null) {
            log.info("RAG: Initialisation du RestClient avec BaseURL: {} (API Key: {}***)", 
                baseUrl, 
                (apiKey != null && apiKey.length() > 5) ? apiKey.substring(0, 5) : "NULL");
            restClient = RestClient.builder()
                    .baseUrl(baseUrl + "/v1")
                    .defaultHeader("Authorization", "Bearer " + apiKey)
                    .defaultHeader("Content-Type", "application/json")
                    .build();
        }
    }

    private List<Double> getEmbedding(String text, String inputType) {
        initRestClient();
        
        log.debug("Génération d'embedding (type: {}) via RestClient manuel", inputType);
        
        Map<String, Object> body = Map.of(
            "input", Collections.singletonList(text),
            "model", embeddingModelName,
            "input_type", inputType,
            "encoding_format", "float"
        );

        try {
            Map result = restClient.post()
                    .uri("/embeddings")
                    .body(body)
                    .retrieve()
                    .body(Map.class);

            if (result != null && result.containsKey("data")) {
                List<Map<String, Object>> data = (List<Map<String, Object>>) result.get("data");
                if (!data.isEmpty()) {
                    return (List<Double>) data.get(0).get("embedding");
                }
            }
            throw new RuntimeException("Format de réponse d'embedding invalide ou vide");
        } catch (Exception e) {
            log.error("Erreur lors de l'appel manuel à l'embedding NVIDIA NIM. Text: {}, Type: {}", text.substring(0, Math.min(20, text.length())), inputType, e);
            throw e;
        }
    }

    /**
     * Processus asynchrone pour indexer un document :
     * 1. Télécharger le PDF depuis Cloudinary
     * 2. Extraire le texte
     * 3. Découper en morceaux (chunking)
     * 4. Générer les embeddings via NVIDIA NIM
     * 5. Sauvegarder dans pgvector
     */
    @Async
    @Transactional
    public void processDocument(UUID documentId) {
        try {
            Document document = documentRepository.findById(documentId)
                    .orElseThrow(() -> new RuntimeException("Document non trouvé"));

            if (document.getFilePath() == null) return;

            log.info("Début de l'indexation RAG pour le document : {}", documentId);

            // 1 & 2. Extraction
            String text = null;
            if (document.getLocalFilePath() != null) {
                log.info("RAG: Utilisation du fichier LOCAL pour l'extraction : {}", document.getLocalFilePath());
                try {
                    text = extractTextFromLocalFile(document.getLocalFilePath());
                } catch (Exception e) {
                    log.error("RAG: Échec extraction locale pour {}, fallback sur Cloudinary. Erreur: {}", documentId, e.getMessage());
                }
            }

            if (text == null && document.getFilePath() != null) {
                log.info("RAG: Tentative d'extraction depuis Cloudinary URL: {}", document.getFilePath());
                text = extractTextFromUrl(document.getFilePath());
            }
            
            if (text == null || text.trim().isEmpty()) {
                log.warn("RAG: Le texte extrait est VIDE pour le document {}. L'indexation sera vide.", documentId);
                document.setIsEmbedded(false);
                documentRepository.save(document);
                return;
            }
            log.info("RAG: Texte extrait avec succès ({} caractères)", text.length());
            
            // 3. Chunking simple (par 1000 caractères avec chevauchement)
            List<String> chunks = splitIntoChunks(text, 1000, 200);
            log.info("RAG: Découpage en {} chunks terminé", chunks.size());

            // 4 & 5. Embeddings et Sauvegarde
            for (int i = 0; i < chunks.size(); i++) {
                String chunkText = chunks.get(i);
                
                // Appel API NVIDIA manuel pour inclure input_type="passage"
                List<Double> vector = getEmbedding(chunkText, "passage");
                
                // Conversion List<Double> en double[] pour l'entité
                double[] doubleVector = vector.stream().mapToDouble(Double::doubleValue).toArray();

                DocumentEmbedding embeddingEntity = DocumentEmbedding.builder()
                        .id(UUID.randomUUID().toString())
                        .document(document)
                        .chunkIndex(i)
                        .chunkText(chunkText)
                        .embedding(doubleVector)
                        .build();

                embeddingRepository.save(embeddingEntity);
            }

            document.setIsEmbedded(true);
            documentRepository.save(document);
            log.info("Indexation terminée avec succès : {} chunks créés", chunks.size());

        } catch (Exception e) {
            log.error("Erreur lors du traitement RAG du document {}", documentId, e);
        }
    }

    @Async
    @Transactional
    public void auditContract(Contract contract) {
        if (contract.getPdfUrl() == null) return;
        
        log.info("IA (Audit): Début de l'audit pour le contrat {}", contract.getIdContract());
        
        try {
            // 1. Extraire le texte du PDF
            String contractText = null;
            // Note: Pour les contrats, on pourrait aussi ajouter localFilePath plus tard. 
            // Pour l'instant on garde la logique Cloudinary ou on tente de voir si le contrat est lié à un Document local.
            contractText = extractTextFromUrl(contract.getPdfUrl());
            
            // 2. Préparer le prompt d'audit
            String systemPrompt = "Tu es un expert juridique immobilier. Analyse le texte du contrat suivant et fournis un résumé des risques et points de vigilance.\n" +
                    "Concentre-toi sur :\n" +
                    "- Les clauses suspensives\n" +
                    "- Les pénalités de retard\n" +
                    "- Les conditions de résiliation\n" +
                    "- Tout point inhabituel ou risqué pour le client.\n\n" +
                    "Réponds de manière structurée et concise en français.";
            
            // 3. Appeler le LLM
            String auditResult = chatClient.prompt()
                    .system(systemPrompt)
                    .user(contractText)
                    .call()
                    .content();
            
            // 4. Sauvegarder le résultat
            contract.setAiRiskSummary(auditResult);
            contractRepository.save(contract);
            
            log.info("IA (Audit): Audit terminé avec succès pour le contrat {}", contract.getIdContract());
            
        } catch (Exception e) {
            log.error("IA (Audit): Erreur lors de l'audit du contrat {}", contract.getIdContract(), e);
        }
    }

    /**
     * Recherche les informations pertinentes et génère une réponse via GPT-OSS-20B
     */
    public ChatResponse askQuestion(DocumentQueryRequest request) {
        log.info("Question reçue pour le deal {} : {}", request.getDealId(), request.getQuery());

        // 1. Récupérer les données structurées du client (Dossier, RDV, Finances)
        Deal deal = dealRepository.findById(request.getDealId())
                .orElseThrow(() -> new RuntimeException("Dossier non trouvé"));
        UUID clientId = deal.getClientFolder().getClient().getIdClient();
        ClientPortalDataDto clientData = clientPortalService.getFullClientPortalData(clientId);

        String rdvInfo = clientData.getMeetings().stream()
                .map(m -> m.getType() + " prévu le " + m.getScheduledAt())
                .collect(Collectors.joining(", "));

        String contratInfo = clientData.getContracts().stream()
                .map(c -> "Contrat " + c.getStatus() + " (Prix: " + c.getAgreedPrice() + ")")
                .collect(Collectors.joining(", "));

        String docsListInfo = clientData.getDocuments().stream()
                .filter(d -> d.getDealId().equals(request.getDealId())) // Uniquement les docs de ce dossier
                .map(d -> String.format("- %s (ID: %s, Uploadé le: %s)", d.getDocumentType(), d.getIdDocument(), d.getCreatedAt()))
                .collect(Collectors.joining("\n"));

        log.info("RAG Agent: {} documents trouvés pour le dossier {}", 
            clientData.getDocuments().stream().filter(d -> d.getDealId().equals(request.getDealId())).count(), 
            request.getDealId());

        // 3. Synthèse des données pour l'AGENT (parle du client à la 3ème personne)
        String structuredContext = String.format(
            "DOSSIER À ANALYSER POUR L'AGENT :\n" +
            "Client concerné : %s %s\n" +
            "Email du client : %s\n" +
            "Statut du dossier : %s\n" +
            "Budget du client : %s\n" +
            "\nDOCUMENTS RÉELLEMENT DÉPOSÉS DANS CE DOSSIER :\n%s\n" +
            "\nRDV : %s\n" +
            "\nCONTRATS : %s\n",
            clientData.getProfile().getFirstName(), clientData.getProfile().getLastName(),
            clientData.getProfile().getEmail(),
            deal.getStage(),
            deal.getClientFolder().getBuyerFolder() != null ? deal.getClientFolder().getBuyerFolder().getBudgetMax() : "N/A",
            docsListInfo.isEmpty() ? "Aucun document n'a été uploadé pour le moment." : docsListInfo,
            rdvInfo.isEmpty() ? "Aucun" : rdvInfo,
            contratInfo.isEmpty() ? "Aucun" : contratInfo
        );

        // 4. Recherche de similarité (RAG)
        List<Double> queryVector = getEmbedding(request.getQuery(), "query");
        List<DocumentEmbedding> similarChunks = embeddingRepository.findSimilarChunks(
                request.getDealId(), 
                queryVector.toString(), 
                5
        );
        log.info("RAG: {} chunks pertinents trouvés pour la question.", similarChunks.size());
        if (!similarChunks.isEmpty()) {
            log.debug("RAG: Premier chunk trouvé: {}", similarChunks.get(0).getChunkText().substring(0, Math.min(50, similarChunks.get(0).getChunkText().length())));
        }

        String documentContext = similarChunks.stream()
                .map(chunk -> String.format("[Document: %s, Uploadé le: %s]\nContenu: %s", 
                    chunk.getDocument().getDocumentType() != null ? chunk.getDocument().getDocumentType().name() : "Inconnu",
                    chunk.getDocument().getCreatedAt() != null ? chunk.getDocument().getCreatedAt() : "Date inconnue",
                    chunk.getChunkText()))
                .collect(Collectors.joining("\n---\n"));

        String finalContext = structuredContext + "\nEXTRAITS RÉELS DES DOCUMENTS PDF DÉPOSÉS :\n" + documentContext;

        List<String> sources = similarChunks.stream()
                .map(chunk -> chunk.getDocument().getDocumentType() != null ? chunk.getDocument().getDocumentType().name() : "DOCUMENT")
                .distinct()
                .collect(Collectors.toList());

        // 5. Appel au LLM (Prompt spécifique pour l'AGENT)
        try {
            log.info("RAG: Envoi de la requête au LLM pour l'AGENT...");
            String systemMessage = "Tu es un assistant immobilier intégré dans une plateforme CRM.\n\n" +
                    "RÈGLES DE FORMATAGE :\n" +
                    "- Utilise toujours des retours à la ligne clairs entre les sections\n" +
                    "- Utilise des listes numérotées pour les étapes séquentielles\n" +
                    "- Utilise des puces pour les éléments non séquentiels\n" +
                    "- Ajoute une ligne vide entre chaque élément de liste\n" +
                    "- Ne retourne jamais un bloc de texte continu sans séparations\n\n" +
                    "RÈGLES DE LONGUEUR :\n" +
                    "- Adapte la longueur de la réponse à la complexité de la question\n" +
                    "- Question courte et directe = réponse courte et directe (3 à 5 lignes max)\n" +
                    "- Demande d'analyse complète = réponse structurée avec sections claires\n" +
                    "- Ne rajoute jamais de contexte non demandé\n" +
                    "- Ne commence jamais par 'En tant qu'expert...' ou des formules creuses\n" +
                    "- Va directement au fait\n\n" +
                    "RÈGLES DE PRÉCISION SUR LES DOCUMENTS :\n" +
                    "- Mentionne uniquement les documents explicitement présents dans le contexte fourni\n" +
                    "- Si un document n'est pas dans le contexte, dis-le clairement en une ligne\n" +
                    "- N'invente jamais des noms de documents qui ne sont pas dans les chunks récupérés\n" +
                    "- Si on demande combien de documents manquent, base-toi uniquement sur ce que le contexte montre réellement, pas sur des connaissances générales en immobilier\n\n" +
                    "CONSCIENCE DU CONTEXTE :\n" +
                    "- Le contexte fourni contient des données réelles du dossier client\n" +
                    "- Base chaque réponse strictement sur ce contexte\n" +
                    "- Si le contexte est insuffisant pour répondre, dis-le clairement en une ligne\n\n" +
                    "CONTEXTE DU DOSSIER CLIENT :\n" + finalContext;

            var promptSpec = chatClient.prompt()
                    .system(systemMessage);

            // Ajout de l'historique
            if (request.getHistory() != null && !request.getHistory().isEmpty()) {
                for (DocumentQueryRequest.ChatMessage msg : request.getHistory()) {
                    if ("user".equalsIgnoreCase(msg.getRole())) {
                        promptSpec.user(msg.getContent());
                    }
                }
            }

            String answer = promptSpec.user(request.getQuery()).call().content();
            log.info("RAG: Réponse du LLM reçue (longueur: {})", answer != null ? answer.length() : 0);
            return ChatResponse.builder()
                    .answer(answer)
                    .sources(sources)
                    .build();
        } catch (Exception e) {
            log.error("RAG: Erreur lors de l'appel au ChatClient LLM", e);
            throw e;
        }
    }

    /**
     * Recherche globale pour un client sur TOUS ses dossiers et documents.
     */
    public ChatResponse askGlobalQuestion(String email, ClientQueryRequest request) {
        log.info("Question globale reçue pour le client {} : {}", email, request.getQuery());

        // 1. Identifier le client
        Client client = clientRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Client non trouvé : " + email));
        
        // 2. Récupérer toutes les données du portail pour ce client
        ClientPortalDataDto clientData = clientPortalService.getFullClientPortalData(client.getIdClient());

        // 3. Synthèse des dossiers et agents
        String dossiersInfo = clientData.getDossiers().stream()
                .map(d -> String.format("- Dossier %s (%s) : %s. Agent responsable : %s (%s)", 
                    d.getIdProfile(), d.getClientType(), d.getStage(), 
                    d.getAssignedAgentName() != null ? d.getAssignedAgentName() : "Non assigné",
                    d.getAssignedAgentPhone() != null ? d.getAssignedAgentPhone() : "Pas de téléphone"))
                .collect(Collectors.joining("\n"));

        String agentPrincipal = String.format("Agent principal : %s (Tél: %s)", 
            clientData.getProfile().getAssignedAgentName(), 
            clientData.getProfile().getAssignedAgentPhone() != null ? clientData.getProfile().getAssignedAgentPhone() : "Non renseigné");

        String rdvInfo = clientData.getMeetings().stream()
                .map(m -> String.format("- %s prévu le %s (Statut: %s)", m.getType(), m.getScheduledAt(), m.getStatus()))
                .collect(Collectors.joining("\n"));

        String contratsInfo = clientData.getContracts().stream()
                .map(c -> String.format("- Contrat %s : Statut %s, Prix %s $", c.getIdContract(), c.getStatus(), c.getAgreedPrice()))
                .collect(Collectors.joining("\n"));

        String docsInfo = clientData.getDocuments().stream()
                .map(d -> String.format("- %s (ID: %s, Dossier: %s, Uploadé le: %s)", d.getDocumentType(), d.getIdDocument(), d.getDealId(), d.getCreatedAt()))
                .collect(Collectors.joining("\n"));

        log.info("RAG Global: {} documents trouvés pour le client {}", clientData.getDocuments().size(), email);

        String structuredContext = String.format(
            "VUE D'ENSEMBLE DU CLIENT :\n" +
            "Nom : %s %s\n" +
            "Email : %s\n" +
            "%s\n" +
            "\nDOSSIERS ACTIFS :\n%s\n" +
            "\nDOCUMENTS RÉELLEMENT DÉPOSÉS :\n%s\n" +
            "\nRENDEZ-VOUS :\n%s\n" +
            "\nCONTRATS :\n%s\n",
            clientData.getProfile().getFirstName(), clientData.getProfile().getLastName(),
            clientData.getProfile().getEmail(),
            agentPrincipal,
            dossiersInfo.isEmpty() ? "Aucun dossier" : dossiersInfo,
            docsInfo.isEmpty() ? "Aucun document n'a été déposé pour le moment." : docsInfo,
            rdvInfo.isEmpty() ? "Aucun rendez-vous" : rdvInfo,
            contratsInfo.isEmpty() ? "Aucun contrat" : contratsInfo
        );

        // 4. Recherche de similarité dans TOUS les documents du client
        List<Double> queryVector = getEmbedding(request.getQuery(), "query");
        List<DocumentEmbedding> similarChunks = embeddingRepository.findSimilarChunksForClient(
                client.getIdClient(), 
                queryVector.toString(), 
                7 
        );

        String documentContext = similarChunks.stream()
                .map(chunk -> String.format("[Doc: %s] %s", 
                    chunk.getDocument().getDocumentType() != null ? chunk.getDocument().getDocumentType().name() : "Autre", 
                    chunk.getChunkText()))
                .collect(Collectors.joining("\n---\n"));

        String finalContext = structuredContext + "\nCONTENU PERTINENT DES DOCUMENTS PDF :\n" + documentContext;

        List<String> sources = similarChunks.stream()
                .map(chunk -> chunk.getDocument().getDocumentType() != null ? chunk.getDocument().getDocumentType().name() : "DOCUMENT")
                .distinct()
                .collect(Collectors.toList());
        sources.add(0, "Données du compte");

        // 5. Préparation de l'appel LLM avec historique
        var promptSpec = chatClient.prompt()
                .system("Tu es un assistant immobilier intégré dans une plateforme CRM.\n\n" +
                        "RÈGLES DE FORMATAGE :\n" +
                        "- Utilise toujours des retours à la ligne clairs entre les sections\n" +
                        "- Utilise des listes numérotées pour les étapes séquentielles\n" +
                        "- Utilise des puces pour les éléments non séquentiels\n" +
                        "- Ajoute une ligne vide entre chaque élément de liste\n" +
                        "- Ne retourne jamais un bloc de texte continu sans séparations\n\n" +
                        "RÈGLES DE LONGUEUR :\n" +
                        "- Adapte la longueur de la réponse à la complexité de la question\n" +
                        "- Question courte et directe = réponse courte et directe (3 à 5 lignes max)\n" +
                        "- Demande d'analyse complète = réponse structurée avec sections claires\n" +
                        "- Ne rajoute jamais de contexte non demandé\n" +
                        "- Ne commence jamais par 'En tant qu'expert...' ou des formules creuses\n" +
                        "- Va directement au fait\n\n" +
                        "RÈGLES DE PRÉCISION SUR LES DOCUMENTS :\n" +
                        "- Mentionne uniquement les documents explicitement présents dans le contexte fourni\n" +
                        "- Si un document n'est pas dans le contexte, dis-le clairement en une ligne\n" +
                        "- N'invente jamais des noms de documents qui ne sont pas dans les chunks récupérés\n" +
                        "- Si on demande combien de documents manquent, base-toi uniquement sur ce que le contexte montre réellement, pas sur des connaissances générales en immobilier\n\n" +
                        "CONSCIENCE DU CONTEXTE :\n" +
                        "- Le contexte fourni contient des données réelles du dossier client\n" +
                        "- Base chaque réponse strictement sur ce contexte\n" +
                        "- Si le contexte est insuffisant pour répondre, dis-le clairement en une ligne\n\n" +
                        "CONTEXTE DU CLIENT :\n" + finalContext);

        // Ajout de l'historique au prompt
        if (request.getHistory() != null && !request.getHistory().isEmpty()) {
            for (ClientQueryRequest.ChatMessage msg : request.getHistory()) {
                if ("user".equalsIgnoreCase(msg.getRole())) {
                    promptSpec.user(msg.getContent());
                } else {
                    // Pour le message de l'assistant dans l'historique, Spring AI ChatClient 
                    // ne supporte pas directement l'injection de réponses passées via l'API fluide simple
                    // On peut simuler cela en concaténant dans le prompt ou via une approche plus complexe
                    // Pour rester simple, on va inclure l'historique textuellement si besoin ou utiliser les messages système
                }
            }
        }

        String answer = promptSpec.user(request.getQuery()).call().content();

        return ChatResponse.builder()
                .answer(answer)
                .sources(sources)
                .build();
    }

    private String extractTextFromUrl(String fileUrl) throws Exception {
        List<String> candidates = cloudinaryService.generateCandidateUrls(fileUrl);
        log.info("RAG: Tentative de téléchargement avec {} stratégies pour : {}", candidates.size(), fileUrl);
        
        Exception lastException = null;
        for (int i = 0; i < candidates.size(); i++) {
            String candidateUrl = candidates.get(i);
            try {
                log.info("RAG: Stratégie {}/{} - URL: {}", (i + 1), candidates.size(), candidateUrl);
                return downloadAndExtract(candidateUrl);
            } catch (Exception e) {
                log.warn("RAG: Échec stratégie {} : {}", (i + 1), e.getMessage());
                lastException = e;
            }
        }
        
        log.error("RAG: Toutes les stratégies de téléchargement ont échoué pour {}", fileUrl);
        throw (lastException != null) ? lastException : new IOException("Toutes les stratégies ont échoué");
    }

    private String downloadAndExtract(String urlStr) throws Exception {
        HttpClient client = HttpClient.newBuilder()
                .followRedirects(HttpClient.Redirect.ALWAYS)
                .connectTimeout(Duration.ofSeconds(10))
                .build();

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(urlStr))
                .header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
                .header("Accept", "application/pdf, */*")
                .timeout(Duration.ofSeconds(20))
                .build();

        HttpResponse<InputStream> response = client.send(request, HttpResponse.BodyHandlers.ofInputStream());

        if (response.statusCode() != 200) {
            log.error("RAG: Échec du téléchargement (HTTP {}). URL: {}", response.statusCode(), urlStr);
            throw new IOException("Impossible de télécharger le document: HTTP " + response.statusCode());
        }

        try (InputStream in = response.body();
             PDDocument document = PDDocument.load(in)) {
            PDFTextStripper stripper = new PDFTextStripper();
            String text = stripper.getText(document);
            log.debug("RAG: Extraction terminée. Taille: {} caractères.", (text != null ? text.length() : 0));
            return text;
        } catch (Exception e) {
            log.error("RAG: Erreur lors du parsing PDFBox pour {}", urlStr, e);
            throw e;
        }
    }

    private String extractTextFromLocalFile(String localPath) throws Exception {
        File file = new File(localPath);
        if (!file.exists()) {
            throw new IOException("Le fichier local n'existe pas : " + localPath);
        }

        try (PDDocument document = PDDocument.load(file)) {
            PDFTextStripper stripper = new PDFTextStripper();
            String text = stripper.getText(document);
            log.debug("RAG: Extraction locale terminée. Taille: {} caractères.", (text != null ? text.length() : 0));
            return text;
        } catch (Exception e) {
            log.error("RAG: Erreur PDFBox (local) pour {}", localPath, e);
            throw e;
        }
    }

    private List<String> splitIntoChunks(String text, int size, int overlap) {
        List<String> chunks = new ArrayList<>();
        if (text == null || text.isEmpty()) return chunks;

        int start = 0;
        while (start < text.length()) {
            int end = Math.min(start + size, text.length());
            chunks.add(text.substring(start, end));
            start += (size - overlap);
            if (start >= text.length()) break;
        }
        return chunks;
    }
}
