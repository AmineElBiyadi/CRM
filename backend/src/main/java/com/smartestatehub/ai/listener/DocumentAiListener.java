package com.smartestatehub.ai.listener;

import com.smartestatehub.ai.service.DocumentRagService;
import com.smartestatehub.crm.event.DocumentUploadedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

/**
 * Écoute les téléchargements de documents pour lancer l'indexation RAG.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DocumentAiListener {

    private final DocumentRagService documentRagService;

    @Async
    @EventListener
    public void handleDocumentUploaded(DocumentUploadedEvent event) {
        var document = event.getDocument();
        log.info("IA (RAG): Nouveau document détecté pour indexation: {}", document.getIdDocument());
        
        try {
            documentRagService.processDocument(document.getIdDocument());
        } catch (Exception e) {
            log.error("IA (RAG): Erreur lors de l'indexation du document {}: {}", 
                    document.getIdDocument(), e.getMessage());
        }
    }
}
