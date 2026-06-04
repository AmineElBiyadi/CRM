package com.smartestatehub.ai.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartestatehub.ai.dto.PropertyRecommendationResult;
import com.smartestatehub.crm.dto.PropertyDto;
import com.smartestatehub.crm.external.PropertyApiClient;
import com.smartestatehub.crm.model.BuyerFolder;
import com.smartestatehub.crm.model.Deal;
import com.smartestatehub.crm.repository.DealRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class PropertyRecommendationService {

    private final DealRepository dealRepository;
    private final PropertyApiClient propertyApiClient;
    private final ChatClient chatClient;
    private final ObjectMapper objectMapper;

    private static final String SYSTEM_PROMPT = """
        You are a real estate recommendation expert working for a French-speaking real estate agency.
        Your job is to analyze a list of available properties and select the TOP 3 best matches for a specific buyer profile.

        ## IMPORTANT
        - All data is already converted and clean (m², readable property types)
        - Write justifications in French for the agent
        - Be specific in justifications: mention exact figures (size, price, beds) to explain the match

        ## OUTPUT FORMAT
        Return ONLY a valid JSON array with exactly 3 objects. No text before or after.
        [
          {{
            "rank": 1,
            "propertyId": "<id>",
            "title": "<address>, <city>",
            "type": "<type>",
            "beds": <number>,
            "baths": <number>,
            "sizeM2": <number>,
            "price": <number>,
            "imageUrl": "<url>",
            "listingUrl": "<url>",
            "justification": "<2-3 sentences explaining why this property matches the client profile>"
          }}
        ]
        """;

    public List<PropertyRecommendationResult> getRecommendations(UUID dealId) {
        log.info("Génération de recommandations IA pour le deal: {}", dealId);

        // 1. Récupérer le dossier Buyer
        Deal deal = dealRepository.findById(dealId)
                .orElseThrow(() -> new IllegalArgumentException("Deal non trouvé: " + dealId));

        BuyerFolder buyer = deal.getClientFolder().getBuyerFolder();
        if (buyer == null) {
            log.warn("Le deal {} n'est pas un dossier acheteur (BUYER).", dealId);
            return Collections.emptyList();
        }

        // 2. Extraire les préférences pour RapidAPI
        String city = buyer.getPreferredArea();
        String propertyType = (buyer.getPropertyType() != null) ? buyer.getPropertyType().getSpecificType() : "Any";
        Double minPrice = buyer.getBudgetMin();
        Double maxPrice = buyer.getBudgetMax();

        // 3. Appel RapidAPI
        PropertyDto.SearchResponse searchResponse = propertyApiClient.searchProperties(
                city, propertyType, minPrice, maxPrice, null, null, 1
        );

        List<PropertyDto.ExternalResult> properties = searchResponse.getResults();
        if (properties.isEmpty()) {
            log.warn("Aucune propriété trouvée via RapidAPI pour le profil du client.");
            return Collections.emptyList();
        }

        // 4. Préparer le prompt utilisateur
        String userPrompt = buildUserPrompt(buyer, properties);

        // 5. Appel LLM (NVIDIA NIM)
        try {
            String aiResponse = chatClient.prompt()
                    .system(SYSTEM_PROMPT)
                    .user(userPrompt)
                    .call()
                    .content();

            // Nettoyage de la réponse au cas où (parfois le LLM ajoute des ```json ... ```)
            if (aiResponse != null && aiResponse.contains("```json")) {
                aiResponse = aiResponse.substring(aiResponse.indexOf("```json") + 7);
                aiResponse = aiResponse.substring(0, aiResponse.lastIndexOf("```"));
            }

            return objectMapper.readValue(aiResponse, new TypeReference<List<PropertyRecommendationResult>>() {});

        } catch (Exception e) {
            log.error("Erreur lors de l'appel LLM ou du parsing de la réponse: {}", e.getMessage(), e);
            return Collections.emptyList();
        }
    }

    private String buildUserPrompt(BuyerFolder buyer, List<PropertyDto.ExternalResult> properties) {
        StringBuilder sb = new StringBuilder();
        sb.append("Analyze these properties and select the TOP 3 best matches for this buyer.\n\n");
        
        sb.append("BUYER PROFILE:\n");
        sb.append("- Budget: ").append(buyer.getBudgetMin()).append(" - ").append(buyer.getBudgetMax()).append("\n");
        sb.append("- Preferred area: ").append(buyer.getPreferredArea()).append("\n");
        sb.append("- Preferred size: ").append(buyer.getPreferredSizeM2()).append(" m²\n");
        sb.append("- Property type: ").append(buyer.getPropertyType() != null ? buyer.getPropertyType().getSpecificType() : "Any").append("\n\n");

        sb.append("AVAILABLE PROPERTIES (").append(properties.size()).append(" listings):\n");
        for (PropertyDto.ExternalResult p : properties) {
            sb.append("---\n");
            sb.append("ID: ").append(p.getExternalId()).append("\n");
            sb.append("Address: ").append(p.getAddress()).append(", ").append(p.getCity()).append("\n");
            sb.append("Type: ").append(p.getTitle()).append("\n"); // Title often contains the type in ExternalResult
            sb.append("Beds: ").append(p.getNumRooms()).append("\n");
            sb.append("Size: ").append(p.getSurfaceM2()).append(" m²\n");
            sb.append("Price: $").append(p.getPrice()).append("\n");
            sb.append("Image: ").append(!p.getImageUrls().isEmpty() ? p.getImageUrls().get(0) : "N/A").append("\n");
            sb.append("Link: ").append(p.getListingUrl()).append("\n");
        }

        sb.append("\nSelect the 3 properties that best match the buyer profile.\n");
        sb.append("Rank them from best (#1) to least best (#3) match.");
        
        return sb.toString();
    }
}
