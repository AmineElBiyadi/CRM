package com.smartestatehub.ai.listener;

import com.smartestatehub.ai.service.InteractionSummaryService;
import com.smartestatehub.ai.service.LeadScoringService;
import com.smartestatehub.crm.event.InteractionCreatedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

/**
 * Écoute les événements liés aux interactions pour déclencher les traitements IA.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class InteractionEventListener {

    private final InteractionSummaryService summaryService;
    private final LeadScoringService leadScoringService;

    /**
     * Réagit à la création d'une interaction pour mettre à jour les analyses IA.
     * Le traitement est asynchrone pour ne pas bloquer l'agent dans le CRM.
     */
    @Async
    @EventListener
    public void handleInteractionCreated(InteractionCreatedEvent event) {
        var interaction = event.getInteraction();
        var dealId = interaction.getDeal().getIdDeal();

        log.info("Nouvelle interaction détectée pour le deal {}. Déclenchement des analyses IA...", dealId);

        try {
            // 1. Mettre à jour le résumé des interactions
            summaryService.updateSummary(dealId);
            
            // 2. Recalculer le score du lead basé sur cette nouvelle interaction
            leadScoringService.calculateScore(dealId);
            
            log.info("Analyses IA terminées avec succès pour le deal {}.", dealId);
        } catch (Exception e) {
            log.error("Erreur lors du traitement IA de l'interaction pour le deal {}: {}", dealId, e.getMessage());
        }
    }
}
