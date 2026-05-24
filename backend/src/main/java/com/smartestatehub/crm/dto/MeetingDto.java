package com.smartestatehub.crm.dto;

import java.util.UUID;

public record MeetingDto(
    UUID idMeeting,
    String scheduledAt,      // Format "HH:mm" ou ISO-8601
    String clientFullName,   // Client's complete name
    String type,             // Libellé en français (ex: "Visite", "Appel")
    String status            // PENDING | DONE
) {}
