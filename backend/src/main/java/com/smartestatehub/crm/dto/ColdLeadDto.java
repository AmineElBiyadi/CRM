package com.smartestatehub.crm.dto;

import java.util.UUID;

public record ColdLeadDto(
    String clientName,
    String clientEmail,
    String agentName,
    String agentEmail,
    UUID agentId,
    UUID folderId,
    SearchCriteriaDto searchCriteria,
    String lastContact,
    long inactivityDays
) {
    public record SearchCriteriaDto(
        String type,
        String city,
        String budgetMax
    ) {}
}
