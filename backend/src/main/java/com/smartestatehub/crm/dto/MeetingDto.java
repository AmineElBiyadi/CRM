package com.smartestatehub.crm.dto;

import java.util.UUID;

public record MeetingDto(
    UUID idMeeting,
    UUID idDeal,
    String scheduledAt,      // ISO-8601 full datetime
    String clientFullName,
    String type,             // Libellé en français
    String status,           // PENDING | COMPLETED | CANCELLED
    String notes,
    String propertyAddress
) {}
