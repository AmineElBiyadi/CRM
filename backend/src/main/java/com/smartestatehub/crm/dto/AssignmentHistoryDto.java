package com.smartestatehub.crm.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AssignmentHistoryDto {
    private UUID idAssignment;
    private UUID agentId;
    private String agentName;
    private LocalDateTime assignedAt;
    private LocalDateTime unassignedAt;
    private String reason;
}
