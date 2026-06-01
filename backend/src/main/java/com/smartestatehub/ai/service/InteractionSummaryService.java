package com.smartestatehub.ai.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class InteractionSummaryService {

    private final ChatClient chatClient;

    /**
     * Met à jour le résumé des interactions pour un dossier donné.
     * Utilise le modèle gpt-oss-20b par défaut (rapide).
     */
    public void updateSummary(UUID dealId) {
        log.info("Mise à jour du résumé IA pour le deal {}", dealId);
        // La logique RAG et appel LLM sera implémentée ici
    }
}
