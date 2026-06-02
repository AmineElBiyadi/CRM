package com.smartestatehub.ai.controller;

import com.smartestatehub.ai.dto.ChatResponse;
import com.smartestatehub.ai.dto.DocumentQueryRequest;
import com.smartestatehub.ai.service.DocumentRagService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

/**
 * Contrôleur dédié au Pipeline RAG (Retrieval-Augmented Generation).
 * Gère l'indexation des documents et les questions-réponses basées sur le contexte.
 */
@RestController
@RequestMapping("/api/rag")
@RequiredArgsConstructor
@CrossOrigin(origins = "*") // Permettre les appels depuis le frontend
public class DocumentRagController {

    private final DocumentRagService documentRagService;

    /**
     * Endpoint pour poser une question sur les documents d'un dossier spécifique.
     */
    @PostMapping("/chat")
    public ResponseEntity<ChatResponse> chatWithDocuments(@RequestBody DocumentQueryRequest request) {
        ChatResponse response = documentRagService.askQuestion(request);
        return ResponseEntity.ok(response);
    }

    /**
     * Endpoint pour forcer l'indexation d'un document spécifique.
     */
    @PostMapping("/index/{documentId}")
    public ResponseEntity<String> indexDocument(@PathVariable UUID documentId) {
        documentRagService.processDocument(documentId);
        return ResponseEntity.ok("Indexation RAG lancée pour le document : " + documentId);
    }
}
