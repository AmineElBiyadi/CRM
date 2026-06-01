package com.smartestatehub.ai.controller;

import com.smartestatehub.ai.service.InteractionSummaryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * Gère les endpoints liés aux résumés d'interactions générés par l'IA.
 */
@RestController
@RequestMapping("/api/ai/summary")
@RequiredArgsConstructor
public class InteractionSummaryController {

    private final InteractionSummaryService interactionSummaryService;

    /**
     * Force la mise à jour du résumé IA des interactions pour un dossier spécifique.
     */
    @PostMapping("/{dealId}/refresh")
    public ResponseEntity<String> refreshSummary(@PathVariable UUID dealId) {
        try {
            interactionSummaryService.updateSummary(dealId);
            return ResponseEntity.ok("Le résumé IA a été mis à jour avec succès.");
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Erreur: " + e.getMessage());
        }
    }
}
