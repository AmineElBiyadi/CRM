package com.smartestatehub.crm.dto;

public record AgentKpiDto(
    long activeClients,
    long weekMeetings,
    long pendingContracts,
    int avgLeadScore,
    int monthlyScore,
    long totalClosings
) {}
