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
            @RequestHeader("X-Agent-Id") UUID agentId) {
        return ResponseEntity.ok(meetingService.createMeeting(request, agentId));
    }

    @GetMapping("/week")
    public ResponseEntity<List<MeetingDto>> getWeekMeetings(
            @RequestHeader("X-Agent-Id") UUID agentId) {
        return ResponseEntity.ok(meetingService.getWeekMeetings(agentId));
    }

    @GetMapping("/month")
    public ResponseEntity<List<MeetingDto>> getMonthMeetings(
            @RequestParam int year,
            @RequestParam int month,
            @RequestHeader("X-Agent-Id") UUID agentId) {
        return ResponseEntity.ok(meetingService.getMonthMeetings(agentId, year, month));
    }

    @GetMapping("/deal/{idDeal}")
    public ResponseEntity<List<MeetingDto>> getMeetingsByDeal(@PathVariable UUID idDeal) {
        return ResponseEntity.ok(meetingService.getMeetingsByDeal(idDeal));
    }

    @PatchMapping("/{meetingId}/status")
    public ResponseEntity<MeetingDto> updateStatus(
            @PathVariable UUID meetingId,
            @RequestBody com.smartestatehub.crm.dto.UpdateMeetingStatusRequest request,
            @RequestHeader("X-Agent-Id") UUID agentId) {
        return ResponseEntity.ok(meetingService.updateMeetingStatus(meetingId, request, agentId));
    }

    @DeleteMapping("/{meetingId}")
    public ResponseEntity<Void> deleteMeeting(
            @PathVariable UUID meetingId,
            @RequestHeader("X-Agent-Id") UUID agentId) {
        meetingService.deleteMeeting(meetingId, agentId);
        return ResponseEntity.ok().build();
    }
}
