package com.smartestatehub.notification.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class SendEmailRequest {
    private UUID dealId;
    private String clientEmail;
    private String subject;
    private String body;
}
