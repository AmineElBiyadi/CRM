package com.smartestatehub.crm.dto;

import java.util.UUID;

public record AdminAgentPerfDto(
        UUID id,
        String name,
        long activeClients,
        long closedThisMonth,
        String lastActivity,
        boolean active
) {}
