package com.smartestatehub.crm.dto;

import java.util.List;

public record AdminDashboardDto(
        String adminFirstName,
        String periodLabel,
        int periodWeekNumber,
        String periodStart,
        String periodEnd,
        int weekOffset,
        AdminKpiDto kpis,
        List<AdminPipelineStageDto> pipeline,
        long totalDossiers,
        List<AdminAgentPerfDto> agents,
        List<AdminAlertDto> alerts
) {}
