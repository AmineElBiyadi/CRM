package com.smartestatehub.ai.dto;

import lombok.Data;
import java.util.UUID;

@Data
public class DocumentQueryRequest {
    private UUID dealId;
    private String query;
}
