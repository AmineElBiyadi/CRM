package com.smartestatehub.crm.controller;

import com.smartestatehub.crm.dto.CreateMeetingRequest;
import com.smartestatehub.crm.dto.MeetingDto;
import com.smartestatehub.crm.service.MeetingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/agent/meetings")
@RequiredArgsConstructor
public class MeetingController {

    private final MeetingService meetingService;

    @PostMapping
    public ResponseEntity<MeetingDto> createMeeting(
            @RequestBody CreateMeetingRequest request,
            @RequestHeader(value = "X-Agent-Id", required = false) String devAgentId,
            Principal principal) {
        UUID agentId = resolveAgentId(devAgentId, principal);
        return ResponseEntity.ok(meetingService.createMeeting(request, agentId));
    }

    @GetMapping("/week")
    public ResponseEntity<List<MeetingDto>> getWeekMeetings(
            @RequestHeader(value = "X-Agent-Id", required = false) String devAgentId,
            Principal principal) {
        UUID agentId = resolveAgentId(devAgentId, principal);
        return ResponseEntity.ok(meetingService.getWeekMeetings(agentId));
    }

    @GetMapping("/month")
    public ResponseEntity<List<MeetingDto>> getMonthMeetings(
            @RequestParam int year,
            @RequestParam int month,
            @RequestHeader(value = "X-Agent-Id", required = false) String devAgentId,
            Principal principal) {
        UUID agentId = resolveAgentId(devAgentId, principal);
        return ResponseEntity.ok(meetingService.getMonthMeetings(agentId, year, month));
    }

    @GetMapping("/deal/{idDeal}")
    public ResponseEntity<List<MeetingDto>> getMeetingsByDeal(@PathVariable UUID idDeal) {
        return ResponseEntity.ok(meetingService.getMeetingsByDeal(idDeal));
    }

    @PatchMapping("/{meetingId}/toggle")
    public ResponseEntity<MeetingDto> toggleMeetingStatus(
            @PathVariable UUID meetingId,
            @RequestHeader(value = "X-Agent-Id", required = false) String devAgentId,
            Principal principal) {
        UUID agentId = resolveAgentId(devAgentId, principal);
        return ResponseEntity.ok(meetingService.toggleMeetingStatus(meetingId, agentId));
    }

    private UUID resolveAgentId(String devAgentId, Principal principal) {
        if (devAgentId != null && !devAgentId.isBlank()) {
            return UUID.fromString(devAgentId);
        }
        if (principal != null) {
            try {
                return UUID.fromString(principal.getName());
            } catch (Exception ignored) {}
        }
        return UUID.fromString("8366d183-2fb7-44a1-8f16-2ec3ca78a320");
    }
}
