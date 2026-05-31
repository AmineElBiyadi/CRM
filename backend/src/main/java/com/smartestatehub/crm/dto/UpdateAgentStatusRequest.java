package com.smartestatehub.crm.dto;

import jakarta.validation.constraints.NotNull;

public record UpdateAgentStatusRequest(
        @NotNull Boolean active
) {
}
