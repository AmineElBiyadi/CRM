package com.smartestatehub.crm.service;

import com.smartestatehub.crm.dto.CreateMeetingRequest;
import com.smartestatehub.crm.dto.MeetingDto;
import com.smartestatehub.crm.dto.UpdateMeetingStatusRequest;
import com.smartestatehub.crm.model.Deal;
import com.smartestatehub.crm.model.Meeting;
import com.smartestatehub.crm.model.MeetingStatus;
import com.smartestatehub.crm.model.MeetingType;
import com.smartestatehub.crm.repository.DealRepository;
import com.smartestatehub.crm.repository.MeetingRepository;
import com.smartestatehub.shared.events.MeetingCompletedEvent;
import com.smartestatehub.shared.events.MeetingScheduledEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
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
    private final DealRepository dealRepository;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional(readOnly = true)
    public List<MeetingDto> getTodayMeetings(UUID agentId) {
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        LocalDateTime endOfDay = startOfDay.plusDays(1);
        return meetingRepository.findTodayMeetingsByAgent(agentId, startOfDay, endOfDay)
                .stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<MeetingDto> getMonthMeetings(UUID agentId, int year, int month) {
        LocalDateTime monthStart = LocalDate.of(year, month, 1).atStartOfDay();
        LocalDateTime monthEnd = monthStart.plusMonths(1);
        return meetingRepository.findMonthMeetingsByAgent(agentId, monthStart, monthEnd)
                .stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<MeetingDto> getWeekMeetings(UUID agentId) {
        LocalDateTime weekStart = LocalDate.now().with(DayOfWeek.MONDAY).atStartOfDay();
        LocalDateTime weekEnd = weekStart.plusDays(7);
        return meetingRepository.findWeekMeetingsByAgent(agentId, weekStart, weekEnd)
                .stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<MeetingDto> getMeetingsByDeal(UUID idDeal) {
        return meetingRepository.findByDeal_IdDeal(idDeal)
                .stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Transactional
    public MeetingDto createMeeting(CreateMeetingRequest request, UUID agentId) {
        Deal deal = dealRepository.findById(request.getIdDeal())
                .orElseThrow(() -> new IllegalArgumentException("Dossier introuvable : " + request.getIdDeal()));

        Meeting meeting = Meeting.builder()
                .deal(deal)
                .type(request.getType())
                .scheduledAt(request.getScheduledAt())
                .notesLogged(request.getNotes())
                .propertyAddress(request.getPropertyAddress())
                .status(request.getStatus() != null ? request.getStatus() : MeetingStatus.PENDING)
                .build();

        Meeting saved = meetingRepository.save(meeting);
        eventPublisher.publishEvent(new MeetingScheduledEvent(this, saved));

        return mapToDto(saved);
    }

    @Transactional
    public MeetingDto updateMeetingStatus(UUID meetingId, com.smartestatehub.crm.dto.UpdateMeetingStatusRequest request, UUID agentId) {
        Meeting meeting = meetingRepository.findById(meetingId)
                .orElseThrow(() -> new IllegalArgumentException("Réunion introuvable : " + meetingId));

        if (request.getNewStatus() != null) {
            meeting.setStatus(request.getNewStatus());
            if (request.getNewStatus() == MeetingStatus.COMPLETED) {
                eventPublisher.publishEvent(new MeetingCompletedEvent(this, meeting));
            }
        }

        if (request.getNewScheduledAt() != null) {
            meeting.setScheduledAt(request.getNewScheduledAt());
        }

        return mapToDto(meetingRepository.save(meeting));
    }

    @Transactional
    public void deleteMeeting(UUID meetingId, UUID agentId) {
        Meeting meeting = meetingRepository.findById(meetingId)
                .orElseThrow(() -> new IllegalArgumentException("Réunion introuvable : " + meetingId));
        
        // Optionnel: Vérifier que le meeting est bien lié à l'agent
        meetingRepository.delete(meeting);
    }

    public MeetingDto mapToDto(Meeting meeting) {
        String clientName = "Client inconnu";
        UUID idDeal = null;
        if (meeting.getDeal() != null) {
            idDeal = meeting.getDeal().getIdDeal();
            if (meeting.getDeal().getClientFolder() != null &&
                meeting.getDeal().getClientFolder().getClient() != null) {
                var client = meeting.getDeal().getClientFolder().getClient();
                clientName = client.getFirstName() + " " + client.getLastName();
            }
        }

        String formattedTime = meeting.getScheduledAt() != null
                ? meeting.getScheduledAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME)
                : null;

        return MeetingDto.builder()
            .idMeeting(meeting.getIdMeeting())
            .idDeal(idDeal)
            .scheduledAt(formattedTime)
            .clientFullName(clientName)
            .type(mapTypeToFrench(meeting.getType()))
            .status(meeting.getStatus() != null ? meeting.getStatus().name() : "PENDING")
            .notesLogged(meeting.getNotesLogged())
            .propertyAddress(meeting.getPropertyAddress())
            .reminder1hSent(meeting.isReminder1hSent())
            .reminder24hSent(meeting.isReminder24hSent())
            .build();
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
