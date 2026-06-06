package com.smartestatehub.crm.dto;

import com.smartestatehub.crm.model.ClientType;
import com.smartestatehub.crm.model.DealStage;
import lombok.*;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DossierDetailDto {
    private UUID idDeal;
    private UUID idProfile;
    private UUID idClient;
    private String clientName;
    private String clientEmail;
    private String clientPhone;
    private String clientSource;
    private ClientType clientType;
    
    private DealStage stage;
    private Integer aiLeadScore;
    private String aiScoreExplanation;
    private String aiRecommendedAction;
    private String aiSummary;
    private DealStage aiStageSuggestion;
    private String aiStageSuggestionReason;
    private Boolean isUrgent;
    
    // Buyer Specifics
    private Double budgetMin;
    private Double budgetMax;
    private String preferredArea;
    private Double preferredSizeM2;
    private Integer preferredFloor;
    private String propertyType;

    // Seller Specifics (Mapping to Property fields)
    private String propertyTitle;
    private String address;
    private String city;
    private Double askingPrice;
    private Double propertySurfaceM2;
    private Integer numRooms;
    private Integer propertyFloor;
    private List<String> propertyImageUrls;
    
    private UUID assignedAgentId;
    private String assignedAgentName;
    private String assignedAgentPhone;
    private LocalDateTime lastInteractionAt;

    // Computed fields for client portal
    private String visitStatus; // "VISITED" | "VISIT_PLANNED" | "PROPOSED"
    private String clientFriendlyAction; // Mapped from aiRecommendedAction
    private String status;
    private LocalDateTime createdAt;

    // Collections for detail view
    private List<PropertyDto.Response> properties;
    private List<OfferDetailDto> offers;
    private List<MeetingDto> meetings;
    private List<ContractDto.Response> contracts;
    private List<DocumentDto> documents;
    private java.util.List<AssignmentHistoryDto> assignmentHistory;
}
