package com.smartestatehub.ai.service;

import com.smartestatehub.ai.dto.DocumentQueryRequest;
import com.smartestatehub.ai.model.DocumentEmbedding;
import com.smartestatehub.ai.repository.DocumentEmbeddingRepository;
import com.smartestatehub.crm.model.Document;
import com.smartestatehub.crm.repository.DocumentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.embedding.EmbeddingModel;
import org.springframework.ai.embedding.EmbeddingResponse;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.InputStream;
import java.net.URL;
import java.util.ArrayList;
import java.util.Arrays;
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
                
                // Appel API NVIDIA via Spring AI (renvoie une List<Double> dans cette version)
                List<Double> vector = embeddingModel.embed(chunkText);
                
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
    public String askQuestion(DocumentQueryRequest request) {
        log.info("Question reçue pour le deal {} : {}", request.getDealId(), request.getQuery());

        // 1. Vectoriser la question
        List<Double> queryVector = embeddingModel.embed(request.getQuery());
        String vectorString = queryVector.toString();

        // 2. Recherche de similarité dans pgvector
        List<DocumentEmbedding> similarChunks = embeddingRepository.findSimilarChunks(
                request.getDealId(), 
                vectorString, 
                5
        );

        // 3. Construction du contexte
        String context = similarChunks.stream()
                .map(DocumentEmbedding::getChunkText)
                .collect(Collectors.joining("\n---\n"));

        // 4. Appel au LLM (GPT-OSS-20B via NVIDIA NIM)
        return chatClient.prompt()
                .system(s -> s.text("Tu es un assistant immobilier expert. Utilise UNIQUEMENT le contexte suivant pour répondre. Si l'info n'y est pas, dis que tu ne sais pas. \n\nCONTEXTE :\n" + context))
                .user(request.getQuery())
                .call()
                .content();
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
