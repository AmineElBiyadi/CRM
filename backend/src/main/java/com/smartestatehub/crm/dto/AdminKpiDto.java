package com.smartestatehub.crm.dto;

public record AdminKpiDto(
        long activeDossiers,
        long closedThisMonth,
        long coldLeads,
        double conversionRatePercent,
        String activeDossiersTrend,
        String closedThisMonthTrend,
        String coldLeadsTrend,
        String conversionTrend,
        boolean activeDossiersUp,
        boolean closedThisMonthUp,
        boolean coldLeadsUp,
        boolean conversionUp
) {}
