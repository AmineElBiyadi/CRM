package com.smartestatehub.crm.dto;

import java.util.List;
import java.util.Map;

public record AdminAgentDetailDto(
        AdminAgentDto agent,
        Map<String, Long> stageCounts,
        List<AdminAgentDossierDto> dossiers,
        double conversionRatePercent
) {
}
