package com.smartestatehub.crm.dto;

import com.smartestatehub.crm.model.ClientType;
import com.smartestatehub.crm.model.DealStage;

import java.time.LocalDateTime;
import java.util.UUID;

public record AdminAgentDossierDto(
        UUID idDeal,
        UUID idProfile,
        String clientName,
        ClientType clientType,
        DealStage stage,
        Integer aiLeadScore,
        Boolean urgent,
        LocalDateTime lastInteractionAt,
        LocalDateTime createdAt
) {
}
