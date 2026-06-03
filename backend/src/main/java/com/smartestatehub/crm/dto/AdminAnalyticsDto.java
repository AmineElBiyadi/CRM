package com.smartestatehub.crm.dto;

import java.util.List;

public record AdminAnalyticsDto(
        List<AdminAnalyticsMonthDto> conversionSeries,
        String conversionPeriodType,
        int conversionYear,
        Integer conversionMonth,
        String conversionTitle,
        List<Integer> availableYears,
        List<AdminAnalyticsFunnelDto> funnel,
        long averageDaysToClose,
        List<AdminAnalyticsSourceDto> acquisitionSources,
        AdminAnalyticsTopAgentDto topAgent
) {}
