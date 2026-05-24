package com.smartestatehub.crm.dto;

import java.util.UUID;

public record DealPriorityDto(
    UUID idDeal,
    UUID idClientFolder,
    String clientFullName,
    String clientPhone,
    String clientEmail,
    String stage,
    Integer aiLeadScore,
    String aiRecommendedAction,
    String lastInteractionAt
) {}
