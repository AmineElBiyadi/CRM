package com.smartestatehub.crm.dto;

import com.smartestatehub.crm.model.ClientType;
import com.smartestatehub.crm.model.DealStage;
import lombok.*;
import java.time.LocalDateTime;
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
    private java.util.List<String> propertyImageUrls;
    
    private UUID assignedAgentId;
    private String assignedAgentName;
    private LocalDateTime lastInteractionAt;
    private java.util.List<AssignmentHistoryDto> assignmentHistory;
}
