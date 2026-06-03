package com.smartestatehub.crm.dto;

import lombok.*;
import java.util.UUID;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MeetingDto {
    private UUID idMeeting;
    private UUID idDeal;
    private String scheduledAt;
    private String clientFullName;
    private String type;
    private String status;
    private String notesLogged;
    private String propertyAddress;
    private Boolean reminder1hSent;
    private Boolean reminder24hSent;
}
