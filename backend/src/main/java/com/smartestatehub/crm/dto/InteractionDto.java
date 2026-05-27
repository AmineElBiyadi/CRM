package com.smartestatehub.crm.dto;
import com.smartestatehub.crm.model.InteractionType;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InteractionDto {
    private UUID idInteraction;
    private InteractionType type;
    private String description;
    private LocalDateTime occurredAt;
    private Integer durationMinutes;
    private String agentName;
}
