package com.smartestatehub.crm.dto;

import java.util.UUID;

public record ColdLeadDto(
    String clientName,
    String clientEmail,
    String agentEmail,
    UUID agentId,
    UUID folderId,
    long inactivityDays
) {}
