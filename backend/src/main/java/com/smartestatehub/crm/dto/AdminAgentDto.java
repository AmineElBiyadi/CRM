package com.smartestatehub.crm.dto;

import java.util.UUID;

public record AdminAgentDto(
        UUID id,
        String name,
        String email,
        String phone,
        boolean active,
        long activeClients,
        long closedThisMonth,
        String lastActivity
) {
}
