package com.smartestatehub.ai.service;

import com.smartestatehub.crm.model.Deal;
import com.smartestatehub.crm.model.DealStage;
import com.smartestatehub.crm.model.DealStageUpdate;
import com.smartestatehub.crm.model.Interaction;
import com.smartestatehub.crm.repository.DealRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.openai.OpenAiChatOptions;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.UUID;
import java.util.stream.Collectors;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.Data;

@Service
@RequiredArgsConstructor
@Slf4j
public class StageSuggestionService {

    private final ChatClient chatClient;
    private final DealRepository dealRepository;
    private final ObjectMapper objectMapper;

    @Value("${app.ai.model-fast}")
    private String fastModel;

    private static final String SYSTEM_PROMPT = """
        You are an expert real estate CRM pipeline analyst.
        Your job is to analyze a client deal and suggest the most appropriate pipeline stage update.

        ## PIPELINE STAGES (in order)
        COLD → WARM → HOT → NEGOTIATION → CLOSED → LOST

        ## IMPORTANT RULES
        - You can ONLY suggest moving FORWARD in the pipeline (COLD → WARM → HOT etc.)
        - NEVER suggest going backward (ex: HOT → WARM) — that is a human decision only
        - NEVER suggest CLOSED or LOST — those are human decisions only
        - If the current stage is already correct, set suggestedStage to null
        - Only suggest a change if you have strong signals to justify it

        ## STAGE DEFINITIONS
        - COLD       : New lead, little or no engagement, no clear intent
        - WARM       : Some engagement, confirmed interest, responsive to contact
        - HOT        : Strong engagement, meetings held, clear budget and project defined
        - NEGOTIATION: Active offer or contract discussion in progress

        ## SIGNALS FOR EACH TRANSITION
        COLD → WARM: At least 2 real interactions. Positive response. Basic profile available.
        WARM → HOT: At least one VISIT or MEETING completed. Budget defined. Frequency increasing.
        HOT → NEGOTIATION: Offer made or discussed. Contract mentioned. Ready to commit.

        ## FACTORS BASED ON
        - Interaction frequency : number of interactions per week
        - Recency : days since last interaction
        - Document activity : number of documents uploaded by client
        - Interaction quality : VISIT and MEETING weigh more than EMAIL or NOTE

        ## OUTPUT FORMAT
        You MUST respond with a valid JSON object only. No markdown.
        {{
          "suggestedStage": "<WARM | HOT | NEGOTIATION | null>",
          "reason": "<1-2 sentences in French explaining why this stage change is suggested>"
        }}
        """;

    @Transactional
    public void suggestStageUpdate(UUID dealId) {
        log.info("IA (StageSuggestion): Analyse du deal {}", dealId);

        Deal deal = dealRepository.findById(dealId)
                .orElseThrow(() -> new RuntimeException("Deal not found: " + dealId));

        String userPrompt = constructUserPrompt(deal);

        try {
            String response = chatClient.prompt()
                    .options(OpenAiChatOptions.builder()
                            .withModel(fastModel)
                            .withTemperature(0.1f) // Low temperature for consistent JSON
                            .build())
                    .system(SYSTEM_PROMPT)
                    .user(userPrompt)
                    .call()
                    .content();

            AiSuggestion suggestion = objectMapper.readValue(response, AiSuggestion.class);

            if (suggestion.getSuggestedStage() != null && !suggestion.getSuggestedStage().equals("null")) {
                DealStage newStage = DealStage.valueOf(suggestion.getSuggestedStage());
                // Sécurité : Ne suggérer que si différent de l'actuel
                if (newStage != deal.getStage()) {
                    deal.setAiStageSuggestion(newStage);
                    deal.setAiStageSuggestionReason(suggestion.getReason());
                    dealRepository.save(deal);
                    log.info("IA (StageSuggestion): Nouvelle suggestion pour {}: {}", dealId, newStage);
                }
            } else {
                // Si l'IA dit null, on nettoie une éventuelle ancienne suggestion devenue obsolète
                deal.setAiStageSuggestion(null);
                deal.setAiStageSuggestionReason(null);
                dealRepository.save(deal);
            }

        } catch (Exception e) {
            log.error("IA (StageSuggestion): Erreur pour le deal {}: {}", dealId, e.getMessage());
        }
    }

    private String constructUserPrompt(Deal deal) {
        long daysSinceCreated = ChronoUnit.DAYS.between(deal.getCreatedAt(), LocalDateTime.now());
        long daysSinceLastInteraction = deal.getLastInteractionAt() != null 
                ? ChronoUnit.DAYS.between(deal.getLastInteractionAt(), LocalDateTime.now()) 
                : daysSinceCreated;

        String interactionsHistory = deal.getInteractions().stream()
                .sorted(Comparator.comparing(Interaction::getOccurredAt).reversed())
                .limit(10)
                .map(it -> String.format("- [%s] %s: %s", it.getOccurredAt().toLocalDate(), it.getType(), it.getDescription()))
                .collect(Collectors.joining("\n"));

        String stageHistory = deal.getStageUpdates().stream()
                .sorted(Comparator.comparing(DealStageUpdate::getChangedAt).reversed())
                .map(su -> String.format("- %s -> %s (%s)", su.getFromStage(), su.getToStage(), su.getChangedAt().toLocalDate()))
                .collect(Collectors.joining("\n"));

        return String.format("""
                Analyze this deal and suggest a pipeline stage update if appropriate:

                CURRENT STAGE: %s
                DEAL CREATED: %s (%d days ago)
                LAST INTERACTION: %s (%d days ago)
                DOCUMENTS UPLOADED: %d

                STAGE HISTORY:
                %s

                INTERACTIONS HISTORY (Last 10):
                %s

                Should the stage be updated? If yes, suggest the next stage.
                """,
                deal.getStage(),
                deal.getCreatedAt().toLocalDate(), daysSinceCreated,
                deal.getLastInteractionAt() != null ? deal.getLastInteractionAt().toLocalDate() : "None", daysSinceLastInteraction,
                deal.getDocuments() != null ? deal.getDocuments().size() : 0,
                stageHistory.isEmpty() ? "None" : stageHistory,
                interactionsHistory.isEmpty() ? "None" : interactionsHistory);
    }

    @Data
    private static class AiSuggestion {
        private String suggestedStage;
        private String reason;
    }
}
