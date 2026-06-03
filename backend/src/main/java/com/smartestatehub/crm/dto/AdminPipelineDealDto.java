package com.smartestatehub.crm.dto;

import com.smartestatehub.crm.model.ClientType;
import com.smartestatehub.crm.model.DealStage;

import java.util.UUID;

public record AdminPipelineDealDto(
        UUID idDeal,
        UUID idProfile,
        String clientName,
        ClientType clientType,
        DealStage stage,
        String stageKey,
        Integer aiLeadScore,
        boolean urgent,
        String lastInteraction,
        UUID agentId,
        String agentName
) {}
