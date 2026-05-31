package com.smartestatehub.crm.dto;

import com.smartestatehub.crm.model.InteractionType;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class CreateInteractionRequest {
    private UUID idDeal;
    private InteractionType type;
    private String description;
    private LocalDateTime occurredAt;
    private Integer durationMinutes;
}
