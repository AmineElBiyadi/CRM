package com.smartestatehub.notification.dto;

import com.smartestatehub.notification.model.SenderType;
import lombok.Data;

@Data
public class SystemNotificationRequest {
    private String title;
    private String message;
    private SenderType senderType;
    private String receiverEmail;
}
