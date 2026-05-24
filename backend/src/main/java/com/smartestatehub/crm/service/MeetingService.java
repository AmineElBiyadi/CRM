package com.smartestatehub.crm.service;

import com.smartestatehub.crm.dto.MeetingDto;
import com.smartestatehub.crm.model.Meeting;
import com.smartestatehub.crm.model.MeetingType;
import com.smartestatehub.crm.repository.MeetingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MeetingService {

    private final MeetingRepository meetingRepository;

    @Transactional(readOnly = true)
    public List<MeetingDto> getTodayMeetings(UUID agentId) {
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        LocalDateTime endOfDay = startOfDay.plusDays(1);
        List<Meeting> meetings = meetingRepository.findTodayMeetingsByAgent(agentId, startOfDay, endOfDay);
        return meetings.stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public MeetingDto toggleMeetingStatus(UUID meetingId, UUID agentId) {
        Meeting meeting = meetingRepository.findById(meetingId)
                .orElseThrow(() -> new IllegalArgumentException("Réunion introuvable avec l'ID : " + meetingId));

        if (meeting.getDeal() == null ||
            meeting.getDeal().getClientFolder() == null ||
            meeting.getDeal().getClientFolder().getAssignedAgent() == null ||
            !meeting.getDeal().getClientFolder().getAssignedAgent().getIdUser().equals(agentId)) {
            throw new SecurityException("Vous n'êtes pas autorisé à modifier cette réunion.");
        }

        String currentStatus = meeting.getStatus();
        if ("DONE".equalsIgnoreCase(currentStatus)) {
            meeting.setStatus("PENDING");
        } else {
            meeting.setStatus("DONE");
        }

        Meeting saved = meetingRepository.save(meeting);
        return mapToDto(saved);
    }

    public MeetingDto mapToDto(Meeting meeting) {
        String clientName = "Client inconnu";
        if (meeting.getDeal() != null &&
            meeting.getDeal().getClientFolder() != null &&
            meeting.getDeal().getClientFolder().getClient() != null) {
            var client = meeting.getDeal().getClientFolder().getClient();
            clientName = client.getFirstName() + " " + client.getLastName();
        }

        String formattedTime = "";
        if (meeting.getScheduledAt() != null) {
            formattedTime = meeting.getScheduledAt().format(DateTimeFormatter.ofPattern("HH:mm"));
        }

        String frenchType = mapTypeToFrench(meeting.getType());
        String status = meeting.getStatus() != null ? meeting.getStatus().toUpperCase() : "PENDING";

        return new MeetingDto(
            meeting.getIdMeeting(),
            formattedTime,
            clientName,
            frenchType,
            status
        );
    }

    private String mapTypeToFrench(MeetingType type) {
        if (type == null) return "Rendez-vous";
        return switch (type) {
            case PROPERTY_VISIT -> "Visite";
            case PHONE_CALL -> "Appel";
            case OFFICE_APPOINTMENT -> "RDV Agence";
            case CONTRACT_SIGNING -> "Signature";
        };
    }
}
