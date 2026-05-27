package com.smartestatehub.notification.listener;

import com.smartestatehub.crm.event.ClientConfirmedEvent;
import com.smartestatehub.crm.event.DossierConfirmedEvent;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class NotificationEventListener {

    @EventListener
    public void handleClientConfirmed(ClientConfirmedEvent event) {
        log.info("Client confirmed: {}", event.getClient().getEmail());
        // TODO: Call n8n webhook to create portal credentials and send welcome email
    }

    @EventListener
    public void handleDossierConfirmed(DossierConfirmedEvent event) {
        log.info("Dossier confirmed for client: {}", event.getFolder().getClient().getEmail());
        // TODO: Call n8n webhook for any post-dossier-confirmation logic (e.g. portal update)
    }
}
