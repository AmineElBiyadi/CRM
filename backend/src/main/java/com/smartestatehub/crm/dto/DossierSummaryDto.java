package com.smartestatehub.crm.dto;

import com.smartestatehub.crm.model.ClientType;
import com.smartestatehub.crm.model.DealStage;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class DossierSummaryDto {
    private UUID idDeal;
    private String clientFullName;
    private ClientType clientType;
    private DealStage stage;
    private Integer aiLeadScore;
    private Boolean isUrgent;
    private LocalDateTime lastInteractionAt;
    private String aiRecommendedAction;
}
