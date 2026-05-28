package com.smartestatehub.crm.dto;

import com.smartestatehub.crm.model.MeetingStatus;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class UpdateMeetingStatusRequest {
    private MeetingStatus newStatus;
    private LocalDateTime newScheduledAt; // Required for RESCHEDULED status
}
