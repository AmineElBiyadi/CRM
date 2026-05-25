package com.smartestatehub.crm.dto;

import com.smartestatehub.crm.model.MeetingType;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class CreateMeetingRequest {
    private UUID idDeal;
    private MeetingType type;
    private LocalDateTime scheduledAt;
    private String notes;
    private String propertyAddress; // Optional: only for PROPERTY_VISIT or CONTRACT_SIGNING
}
