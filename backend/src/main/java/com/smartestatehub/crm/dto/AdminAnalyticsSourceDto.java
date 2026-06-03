package com.smartestatehub.crm.dto;

public record AdminAnalyticsSourceDto(
        String label,
        int percent,
        String colorKey
) {}
