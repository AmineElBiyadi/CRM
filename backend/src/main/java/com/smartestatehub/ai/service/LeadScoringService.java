package com.smartestatehub.ai.service;
import com.smartestatehub.ai.dto.LeadScoreResult;
import com.smartestatehub.crm.model.ClientType;
import com.smartestatehub.crm.model.Deal;
import com.smartestatehub.crm.model.Interaction;
import com.smartestatehub.crm.model.Meeting;
import com.smartestatehub.crm.repository.DealRepository;
import com.smartestatehub.crm.repository.InteractionRepository;
import com.smartestatehub.crm.repository.MeetingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.openai.OpenAiChatOptions;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class LeadScoringService {

    private final ChatClient chatClient;
    private final DealRepository dealRepository;
    private final InteractionRepository interactionRepository;
    private final MeetingRepository meetingRepository;

    @Value("${app.ai.model-smart}")
    private String smartModel;

    private static final String SYSTEM_PROMPT = """
        You are an expert real estate CRM lead scoring assistant.
        Your job is to analyze a client deal based on agent-logged interaction data and return a structured score.
        
        ## IMPORTANT CONTEXT
        All interaction descriptions are written by the AGENT, not the client.
        The agent logs what the client said, their needs, constraints, and behavior during each contact.
        Read these descriptions carefully - they contain critical signals about urgency and intent.
        
        ## SCORING SCALE
        - 0-20  : New lead, no or very few interactions, no clear profile
        - 21-40 : Some interactions but low engagement, incomplete profile
        - 41-60 : Moderate engagement, confirmed interest, basic profile complete
        - 61-80 : Strong engagement, meetings held, clear budget and preferences
        - 81-100: Active negotiation, very high closing probability, all documents present
        
        ## FACTORS THAT INCREASE THE SCORE
        - High interaction frequency (more than 2 per week)
        - Recent last interaction (less than 5 days ago)
        - Meetings accepted and held
        - Stage is WARM, HOT, or NEGOTIATION
        - Budget clearly defined (budgetMin and budgetMax present)
        - Preferred area and property type specified
        - Documents uploaded by client
        - Multiple interaction types (calls + visits + emails)
        
        ## FACTORS THAT DECREASE THE SCORE
        - Inactivity for more than 10 days
        - Stage stuck at COLD for a long time
        - No meetings scheduled or held
        - Incomplete buyer profile (no budget, no preferences)
        - Only internal notes, no real client contact
        - Single interaction type only
        
        ## INTERACTION TYPE WEIGHTS
        - VISIT   : highest value (client physically engaged)
        - MEETING : highest value (face-to-face commitment)
        - CALL    : high value
        - EMAIL   : medium value
        - NOTE    : low value (internal only, not client contact)
        - SYSTEM  : ignore (automated entry, not a real interaction)
        
        ## URGENCY DETECTION
        Set isUrgent to true if you detect ANY of these signals in interaction descriptions:
        - Explicit time constraint mentioned by client (ex: "avant la rentrée", "sous 15 jours", "muté", "divorce", "expulsion")
        - Imminent decisive action (offer made, contract signing scheduled tomorrow)
        - Stage is NEGOTIATION or HOT with recent activity (last interaction less than 3 days)
        - Score >= 85 AND last interaction less than 3 days ago
        
        Set isUrgent to false if:
        - Client explicitly not in a hurry
        - Project is long-term ("l'année prochaine", "on verra")
        - No time signals detected anywhere in descriptions
        
        ## OUTPUT FORMAT
        You MUST respond with a valid JSON object.
        The JSON must contain the keys "score" (integer 0-100), "explanation" (2-3 sentences in French explaining why this score was given - text in French), "recommendedAction" (one concrete action the agent should take next- text in French), and "isUrgent" (boolean).
        No text before or after the JSON.
        """;

    /**
     * Calcule le score de lead pour un dossier donné.
     * Utilise le modèle gpt-oss-120b pour un meilleur raisonnement.
     */
    @Transactional
    public void calculateScore(UUID dealId) {
        log.info("Calcul du score de lead IA pour le deal {} en utilisant {}", dealId, smartModel);

        Deal deal = dealRepository.findById(dealId)
                .orElseThrow(() -> new RuntimeException("Deal not found"));

        // 1. Récupérer l'historique des interactions
        List<Interaction> interactions = interactionRepository.findByDeal_IdDeal(dealId);
        String interactionHistory = interactions.stream()
                .map(i -> String.format("- [%s] TYPE: %s, DURATION: %s min : %s", 
                    i.getOccurredAt(), 
                    i.getType(), 
                    i.getDurationMinutes() != null ? i.getDurationMinutes() : "N/A",
                    i.getDescription()))
                .collect(Collectors.joining("\n"));

        // 2. Récupérer l'historique des rendez-vous
        List<Meeting> meetings = meetingRepository.findByDeal_IdDeal(dealId);
        String meetingHistory = meetings.stream()
                .map(m -> String.format("- [%s] TYPE: %s, NOTES: %s (Status: %s)", 
                    m.getScheduledAt(), 
                    m.getType(), 
                    m.getNotesLogged(), 
                    m.getStatus()))
                .collect(Collectors.joining("\n"));

        // 3. Documents
        int docCount = deal.getDocuments() != null ? deal.getDocuments().size() : 0;

        // 4. Récupérer les détails du profil (Acheteur ou Vendeur)
        StringBuilder profileContext = new StringBuilder();
        var folder = deal.getClientFolder();
        profileContext.append(String.format("- Type de projet : %s\n", folder.getClientType()));
        
        if (folder.getClientType() == ClientType.BUYER && folder.getBuyerFolder() != null) {
            var bf = folder.getBuyerFolder();
            profileContext.append("  CRITÈRES DE RECHERCHE :\n");
            profileContext.append(String.format("  - Budget : %s - %s\n", 
                bf.getBudgetMin() != null ? bf.getBudgetMin() : "Non spécifié", 
                bf.getBudgetMax() != null ? bf.getBudgetMax() : "Non spécifié"));
            profileContext.append(String.format("  - Zone préférée : %s\n", bf.getPreferredArea() != null ? bf.getPreferredArea() : "Non spécifiée"));
            profileContext.append(String.format("  - Taille souhaitée : %s m2\n", bf.getPreferredSizeM2() != null ? bf.getPreferredSizeM2() : "Non spécifiée"));
        } else if (folder.getClientType() == ClientType.SELLER && folder.getSellerFolder() != null) {
            var sf = folder.getSellerFolder();
            profileContext.append("  BIENS À VENDRE :\n");
            if (sf.getProperties() != null && !sf.getProperties().isEmpty()) {
                for (var p : sf.getProperties()) {
                    profileContext.append(String.format("  - %s (%s) : %s €, %s m2\n", 
                        p.getTitle(), p.getCity(), p.getPrice(), p.getSurfaceM2()));
                }
            } else {
                profileContext.append("  - Aucun bien enregistré pour le moment.\n");
            }
        }

        String lastInteractionStr = deal.getLastInteractionAt() != null ? deal.getLastInteractionAt().toString() : "No interaction yet";

        String userContext = String.format("""
            DOSSIER CLIENT :
            - Client : %s %s
            - Étape actuelle : %s
            - Date d'aujourd'hui : %s
            - Dernière interaction : %s
            - Nombre de documents uploadés : %d
            %s
            
            HISTORIQUE DES RENDEZ-VOUS :
            %s
            
            HISTORIQUE DES INTERACTIONS :
            %s
            
            Analyse ces données et fournis le score du lead selon les règles définies (notamment l'inactivité par rapport à la date d'aujourd'hui).
            """, 
            deal.getClientFolder().getClient().getFirstName(),
            deal.getClientFolder().getClient().getLastName(),
            deal.getStage(),
            java.time.LocalDateTime.now(),
            lastInteractionStr,
            docCount,
            profileContext.toString(),
            meetingHistory.isEmpty() ? "Aucun rendez-vous." : meetingHistory,
            interactionHistory.isEmpty() ? "Aucune interaction." : interactionHistory
        );

        try {
            LeadScoreResult result = chatClient.prompt()
                    .options(OpenAiChatOptions.builder()
                            .withModel(smartModel)
                            .withTemperature(0.3f)
                            .build())
                    .system(SYSTEM_PROMPT)
                    .user(userContext)
                    .call()
                    .entity(LeadScoreResult.class);

            if (result != null) {
                deal.setAiLeadScore(result.getScore());
                deal.setAiScoreExplanation(result.getExplanation());
                deal.setAiRecommendedAction(result.getRecommendedAction());
                deal.setIsUrgent(result.getIsUrgent());
                
                dealRepository.save(deal);
                log.info("Score IA mis à jour pour le deal {}: {}/100", dealId, result.getScore());
            }
        } catch (Exception e) {
            log.error("Erreur lors de l'appel IA pour le scoring du deal {}: {}", dealId, e.getMessage());
            throw e;
        }
    }
}
