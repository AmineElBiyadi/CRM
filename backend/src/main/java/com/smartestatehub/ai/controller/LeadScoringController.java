package com.smartestatehub.ai.controller;

import com.smartestatehub.ai.service.LeadScoringService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * Gère les endpoints liés au scoring des leads par l'IA.
 */
@RestController
@RequestMapping("/api/ai/scoring")
@RequiredArgsConstructor
public class LeadScoringController {

    private final LeadScoringService leadScoringService;

    /**
     * Force le recalcul du score IA pour un dossier spécifique.
     */
    @PostMapping("/{dealId}/refresh")
    public ResponseEntity<String> refreshLeadScore(@PathVariable UUID dealId) {
        try {
            leadScoringService.calculateScore(dealId);
            return ResponseEntity.ok("Le score IA a été recalculé avec succès.");
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Erreur: " + e.getMessage());
        }
    }

    /**
     * Récupère le statut actuel du scoring pour un deal.
     */
    @GetMapping("/{dealId}/status")
    public ResponseEntity<String> getScoringStatus(@PathVariable UUID dealId) {
        return ResponseEntity.ok("Scoring IA opérationnel pour le deal " + dealId);
    }
}
