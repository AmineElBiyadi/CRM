package com.smartestatehub.ai.listener;

import com.smartestatehub.crm.event.InteractionCreatedEvent;
import com.smartestatehub.crm.event.DossierConfirmedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

/**
 * Gère les automatisations externes (n8n, Webhooks, Zapier, etc.).
 * Dédié au développeur travaillant sur les flux de travail externes.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class AutomationEventListener {

    @Async
    @EventListener
    public void onInteractionCreated(InteractionCreatedEvent event) {
        log.info("Automation: Envoi vers n8n pour l'interaction {}", event.getInteraction().getIdInteraction());
        // TODO: Appeler le webhook n8n configuré dans application.yml
    }

    @Async
    @EventListener
    public void onDossierConfirmed(DossierConfirmedEvent event) {
        log.info("Automation: Déclenchement workflow n8n pour dossier {}", event.getFolder().getIdProfile());
    }
}
