package com.smartestatehub.ai.listener;

import com.smartestatehub.crm.event.ClientConfirmedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

/**
 * Gère les traitements IA liés aux profils clients.
 * Dédié au développeur travaillant sur l'enrichissement des données clients.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class ClientAiListener {

    @Async
    @EventListener
    public void handleClientConfirmed(ClientConfirmedEvent event) {
        var client = event.getClient();
        log.info("IA (Client): Analyse du nouveau client {}.", client.getIdClient());
        // Logique future : Analyse du profil, KYC, etc.
    }
}
