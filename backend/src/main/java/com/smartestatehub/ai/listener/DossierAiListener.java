package com.smartestatehub.ai.listener;

import com.smartestatehub.ai.service.LeadScoringService;
import com.smartestatehub.crm.event.DossierConfirmedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

/**
 * Gère les traitements IA lors de la confirmation d'un dossier.
 * Dédié au développeur travaillant sur l'initialisation des dossiers.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DossierAiListener {

    private final LeadScoringService leadScoringService;

    @Async
    @EventListener
    public void handleDossierConfirmed(DossierConfirmedEvent event) {
        var folder = event.getFolder();
        log.info("IA (Dossier): Initialisation pour le dossier {}.", folder.getIdProfile());
        
        if (folder.getDeals() != null) {
            folder.getDeals().forEach(deal -> {
                try {
                    leadScoringService.calculateScore(deal.getIdDeal());
                } catch (Exception e) {
                    log.error("IA (Dossier): Erreur scoring deal {}: {}", deal.getIdDeal(), e.getMessage());
                }
            });
        }
    }
}
