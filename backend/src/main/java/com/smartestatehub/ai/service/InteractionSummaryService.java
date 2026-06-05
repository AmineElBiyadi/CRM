package com.smartestatehub.ai.service;

import com.smartestatehub.crm.model.Deal;
import com.smartestatehub.crm.model.Interaction;
import com.smartestatehub.crm.repository.DealRepository;
import com.smartestatehub.crm.repository.InteractionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.openai.OpenAiChatOptions;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class InteractionSummaryService {

    private final ChatClient chatClient;
    private final InteractionRepository interactionRepository;
    private final DealRepository dealRepository;

    @Value("${app.ai.model-fast}")
    private String fastModel;

    private static final String SYSTEM_PROMPT = """
        Tu es un assistant expert en immobilier. Ta tâche est de rédiger un résumé CONCIS et PROFESSIONNEL
        des dernières interactions avec un client.
        
        Consignes :
        - Maximum 3 phrases.
        - Utilise un ton factuel et efficace.
        - Souligne les points clés (budget, zone, objections, prochaines étapes).
        - Si aucune interaction n'est fournie, réponds "Aucune interaction enregistrée pour le moment."
        - Réponds uniquement avec le texte du résumé, sans préambule.
        """;

    /**
     * Met à jour le résumé des interactions pour un dossier donné.
     * Utilise le modèle gpt-oss-20b par défaut (rapide).
     */
    @Transactional
    public void updateSummary(UUID dealId) {
        log.info("Mise à jour du résumé IA pour le deal {}", dealId);

        Deal deal = dealRepository.findById(dealId)
                .orElseThrow(() -> new RuntimeException("Deal not found: " + dealId));

        if (deal.getClientFolder() == null || deal.getClientFolder().getClient() == null) {
            deal.setAiSummary("Impossible de générer un résumé : données client manquantes.");
            dealRepository.save(deal);
            return;
        }

        List<Interaction> interactions = interactionRepository.findByDeal_IdDeal(dealId);
        
        if (interactions.isEmpty()) {
            deal.setAiSummary("Aucune interaction enregistrée pour le moment.");
            dealRepository.save(deal);
            return;
        }

        // Préparer le contexte des interactions
        String history = interactions.stream()
                .sorted(Comparator.comparing(Interaction::getOccurredAt))
                .map(it -> String.format("[%s] %s: %s", 
                        it.getOccurredAt().toLocalDate(), 
                        it.getType(), 
                        it.getDescription()))
                .collect(Collectors.joining("\n"));

        String userContext = String.format("Client: %s %s\nÉtape actuelle: %s\n\nHistorique des interactions :\n%s",
                deal.getClientFolder().getClient().getFirstName(),
                deal.getClientFolder().getClient().getLastName(),
                deal.getStage(),
                history);

        try {
            String summary = chatClient.prompt()
                    .options(OpenAiChatOptions.builder()
                            .withModel(fastModel)
                            .withTemperature(0.5f)
                            .build())
                    .system(SYSTEM_PROMPT)
                    .user(userContext)
                    .call()
                    .content();

            if (summary != null && !summary.isBlank()) {
                deal.setAiSummary(summary.trim());
                dealRepository.save(deal);
                log.info("Résumé IA mis à jour pour le deal {}", dealId);
            }
        } catch (Exception e) {
            log.error("Erreur lors de la génération du résumé IA pour le deal {}: {}", dealId, e.getMessage());
            // On ne bloque pas le flux principal en cas d'erreur IA
        }
    }
}
