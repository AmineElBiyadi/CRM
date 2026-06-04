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
import com.smartestatehub.crm.model.Deal;
import com.smartestatehub.crm.model.Client;
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
import java.util.UUID;
import java.util.stream.Collectors;

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
            String text = extractTextFromUrl(document.getFilePath());
            
            // 3. Chunking simple (par 1000 caractères avec chevauchement)
            List<String> chunks = splitIntoChunks(text, 1000, 200);

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

        String structuredData = String.format(
            "DONNÉES DU CLIENT :\n" +
            "- Nom : %s %s\n" +
            "- Statut dossier : %s\n" +
            "- Type : %s\n" +
            "- Budget max : %s\n" +
            "- RDV : %s\n" +
            "- Contrats : %s\n",
            clientData.getProfile().getFirstName(), clientData.getProfile().getLastName(),
            deal.getStage(), deal.getClientFolder().getClientType(),
            deal.getClientFolder().getBuyerFolder() != null ? deal.getClientFolder().getBuyerFolder().getBudgetMax() : "N/A",
            rdvInfo.isEmpty() ? "Aucun" : rdvInfo,
            contratInfo.isEmpty() ? "Aucun" : contratInfo
        );

        // 2. Vectoriser la question (input_type="query")
        List<Double> queryVector = getEmbedding(request.getQuery(), "query");
        String vectorString = queryVector.toString();

        // 3. Recherche de similarité dans pgvector (Documents PDF)
        List<DocumentEmbedding> similarChunks = embeddingRepository.findSimilarChunks(
                request.getDealId(), 
                vectorString, 
                5
        );
        log.info("RAG: {} chunks similaires trouvés pour le deal {}", similarChunks.size(), request.getDealId());

        // 4. Construction du contexte hybride
        String documentContext = similarChunks.stream()
                .map(DocumentEmbedding::getChunkText)
                .collect(Collectors.joining("\n---\n"));

        String finalContext = structuredData + "\nCONTENU DES DOCUMENTS PDF :\n" + documentContext;
        log.debug("RAG: Contexte final généré (longueur: {})", finalContext.length());

        List<String> sources = similarChunks.stream()
                .map(chunk -> {
                    String type = chunk.getDocument().getDocumentType() != null ? chunk.getDocument().getDocumentType().name() : "DOCUMENT";
                    return type;
                })
                .distinct()
                .collect(Collectors.toList());
        
        // Ajouter "Données du dossier" comme source
        sources.add(0, "Données du dossier");

        // 5. Appel au LLM (GPT-OSS-20B via NVIDIA NIM)
        try {
            log.info("RAG: Envoi de la requête au LLM...");
            String answer = chatClient.prompt()
                    .system(s -> s.text("Tu es un assistant immobilier expert. Utilise les DONNÉES DU CLIENT et le CONTENU DES DOCUMENTS pour répondre précisément. \n\nCONTEXTE COMPLET :\n" + finalContext))
                    .user(request.getQuery())
                    .call()
                    .content();
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
                .map(c -> String.format("- Contrat %s : Statut %s, Prix %s MAD", c.getIdContract(), c.getStatus(), c.getAgreedPrice()))
                .collect(Collectors.joining("\n"));

        String structuredContext = String.format(
            "VUE D'ENSEMBLE DU CLIENT :\n" +
            "Nom : %s %s\n" +
            "Email : %s\n" +
            "%s\n" +
            "\nDOSSIERS ACTIFS :\n%s\n" +
            "\nRENDEZ-VOUS :\n%s\n" +
            "\nCONTRATS :\n%s\n",
            clientData.getProfile().getFirstName(), clientData.getProfile().getLastName(),
            clientData.getProfile().getEmail(),
            agentPrincipal,
            dossiersInfo.isEmpty() ? "Aucun dossier" : dossiersInfo,
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
                .system("Tu es MURSHID, l'Assistant Intelligent Expert de SmartEstateHub. Ton rôle est d'aider le client à naviguer dans son espace et de répondre à TOUTES ses questions en utilisant les données fournies.\n\n" +
                        "INSTRUCTIONS PRIORITAIRES :\n" +
                        "1. Utilise d'abord la 'VUE D'ENSEMBLE DU CLIENT' pour répondre aux questions factuelles (ex: nombre de dossiers, dates de rendez-vous, montants des contrats, nom/téléphone de l'agent).\n" +
                        "2. Utilise le 'CONTENU DES DOCUMENTS PDF' pour les questions précises sur les clauses ou détails techniques.\n" +
                        "3. Tu as accès à l'HISTORIQUE de la conversation pour comprendre le contexte des questions précédentes (ex: si l'utilisateur dit 'c'est son nom !', réfère-toi au nom de l'agent mentionné juste avant).\n" +
                        "4. Sois concis, chaleureux et professionnel. Si une information est manquante, suggère de contacter l'agent responsable.\n\n" +
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
        try (InputStream in = new URL(fileUrl).openStream();
             PDDocument document = PDDocument.load(in)) {
            PDFTextStripper stripper = new PDFTextStripper();
            return stripper.getText(document);
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
