package com.smartestatehub.crm.dto;

public record AdminAnalyticsTopAgentDto(
        String name,
        long closedCount,
        double conversionRatePercent,
        long activeClients,
        double performanceScore,
        int progressPercent,
        String periodLabel,
        String selectionReason
) {}
