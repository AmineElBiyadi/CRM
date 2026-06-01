package com.smartestatehub.ai.controller;

import com.smartestatehub.ai.dto.DocumentQueryRequest;
import com.smartestatehub.ai.service.DocumentRagService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiController {

    private final DocumentRagService documentRagService;

    /**
     * Endpoint pour poser une question sur les documents d'un deal spécifique.
     */
    @PostMapping("/chat")
    public ResponseEntity<Map<String, String>> chatWithDocuments(@RequestBody DocumentQueryRequest request) {
        String answer = documentRagService.askQuestion(request);
        return ResponseEntity.ok(Map.of("answer", answer));
    }

    /**
     * Endpoint manuel (pour test) pour lancer l'indexation d'un document.
     * En production, cela sera déclenché par un événement après l'upload.
     */
    @PostMapping("/index/{documentId}")
    public ResponseEntity<String> indexDocument(@PathVariable UUID documentId) {
        documentRagService.processDocument(documentId);
        return ResponseEntity.ok("Indexation lancée en arrière-plan...");
    }
}
