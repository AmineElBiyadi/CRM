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
 * Gère les traitements IA liés aux interactions.
 * Dédié au développeur travaillant sur le résumé et le scoring temps réel.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class InteractionAiListener {

    private final InteractionSummaryService summaryService;
    private final LeadScoringService leadScoringService;

    @Async
    @EventListener
    public void handleInteractionCreated(InteractionCreatedEvent event) {
        var interaction = event.getInteraction();
        var dealId = interaction.getDeal().getIdDeal();
        log.info("IA (Interaction): Analyse du deal {} suite à une nouvelle interaction.", dealId);
        
        try {
            summaryService.updateSummary(dealId);
            leadScoringService.calculateScore(dealId);
        } catch (Exception e) {
            log.error("IA (Interaction): Erreur pour le deal {}: {}", dealId, e.getMessage());
        }
    }
}
