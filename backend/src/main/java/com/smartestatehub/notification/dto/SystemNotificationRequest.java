package com.smartestatehub.notification.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.smartestatehub.notification.model.SenderType;
import lombok.Data;
import java.util.UUID;

@Data
public class SystemNotificationRequest {
    private String title;
    private String message;
    private SenderType senderType;

    @JsonAlias({"agentEmail", "email"})
    private String receiverEmail;

    @JsonAlias({"agentId", "userId"})
    private UUID receiverId;
}
