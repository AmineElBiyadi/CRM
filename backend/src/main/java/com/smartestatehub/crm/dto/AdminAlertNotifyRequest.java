package com.smartestatehub.crm.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record AdminAlertNotifyRequest(
        @NotNull UUID agentId,
        @NotBlank String clientName,
        @NotBlank String reason,
        String alertType,
        String alertId
) {}
