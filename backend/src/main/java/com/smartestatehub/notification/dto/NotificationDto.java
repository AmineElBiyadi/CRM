        package com.smartestatehub.notification.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record NotificationDto(
        UUID id,
        String title,
        String message,
        boolean read,
        LocalDateTime createdAt,
        String senderName
) {}
