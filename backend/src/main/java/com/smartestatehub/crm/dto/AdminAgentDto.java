package com.smartestatehub.crm.dto;

import java.util.UUID;

public record AdminAgentDto(
        UUID id,
        String firstName,
        String lastName,
        String name,
        String email,
        String phone,
        boolean active,
        long activeClients,
        long closedThisMonth,
        String lastActivity
) {
}
