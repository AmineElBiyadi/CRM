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
    
    // Specifics
    private Double budgetMin;
    private Double budgetMax;
    private String preferredArea;
    private Double preferredSizeM2;
    private Integer preferredFloor;
    private String propertyType;
    
    private String assignedAgentName;
    private LocalDateTime lastInteractionAt;
}
