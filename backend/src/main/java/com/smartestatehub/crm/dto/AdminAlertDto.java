package com.smartestatehub.crm.dto;

import java.util.UUID;

public record AdminAlertDto(
        String alertId,
        UUID agentId,
        String clientName,
        String agentName,
        String reason,
        String tone,
        String alertType
) {}
