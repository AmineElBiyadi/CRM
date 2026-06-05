package com.smartestatehub.ai.dto;

import lombok.Data;
import java.util.UUID;
import java.util.List;

@Data
public class DocumentQueryRequest {
    private UUID dealId;
    private String query;
    private List<ChatMessage> history;

    @Data
    public static class ChatMessage {
        private String role; // "user" ou "assistant"
        private String content;
    }
}
