package com.smartestatehub.crm.dto;

import lombok.*;
import java.util.List;
import java.util.UUID;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClientPortalDataDto {
    private ClientProfile profile;
    private List<DossierDetailDto> dossiers;
    private List<InteractionDto> interactions;
    private List<MeetingDto> meetings;
    private List<DocumentDto> documents;
    private List<ContractDto.Response> contracts;
    private List<TimelineEvent> timeline;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ClientProfile {
        private UUID idClient;
        private String firstName;
        private String lastName;
        private String email;
        private String phone;
        private String status;
        private String source;
        private String assignedAgentName;
        private java.time.LocalDateTime createdAt;
        private java.time.LocalDateTime updatedAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TimelineEvent {
        private String type; // INTERACTION, MEETING, DOCUMENT, CONTRACT, STAGE_UPDATE
        private String title;
        private String description;
        private String date; // ISO String
        private String agentName;
        private String status;
    }
}
