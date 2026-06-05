package com.smartestatehub.crm.dto;

import jakarta.validation.constraints.NotNull;
import java.util.Map;
import java.util.UUID;

public record UpdateAgentStatusRequest(
        @NotNull Boolean active,
        UUID fallbackAgentId,
        Map<UUID, UUID> dealTransfers
) {
}
