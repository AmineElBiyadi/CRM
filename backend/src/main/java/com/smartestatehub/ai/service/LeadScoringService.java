package com.smartestatehub.ai.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class LeadScoringService {

    private final ChatClient chatClient;

    @Value("${app.ai.model-smart}")
    private String smartModel;

    /**
     * Calcule le score de lead pour un dossier donné.
     * Utilise le modèle gpt-oss-120b pour un meilleur raisonnement.
     */
    public void calculateScore(UUID dealId) {
        log.info("Calcul du score de lead IA pour le deal {} en utilisant {}", dealId, smartModel);
        // La logique de récupération des données et appel LLM (120b) sera implémentée ici
    }
}
