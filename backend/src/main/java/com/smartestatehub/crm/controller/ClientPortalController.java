package com.smartestatehub.crm.controller;

import com.smartestatehub.crm.dto.*;
import com.smartestatehub.crm.service.ClientPortalService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/public/client-portal")
@RequiredArgsConstructor
public class ClientPortalController {

    private final ClientPortalService clientPortalService;

    @GetMapping("/{clientId}/full-data")
    public ResponseEntity<ClientPortalDataDto> getFullClientPortalData(@PathVariable UUID clientId) {
        try {
            ClientPortalDataDto data = clientPortalService.getFullClientPortalData(clientId);
            return ResponseEntity.ok(data);
        } catch (Exception e) {
            e.printStackTrace(); // Log l'erreur pour le debug
            return ResponseEntity.internalServerError().build();
        }
    }

    @PutMapping("/{clientId}/profile")
    public ResponseEntity<Void> updateProfile(@PathVariable UUID clientId, @RequestBody UpdateClientProfileDto dto) {
        try {
            clientPortalService.updateProfile(clientId, dto);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/{clientId}/message")
    public ResponseEntity<Void> sendMessage(@PathVariable UUID clientId, @RequestBody java.util.Map<String, String> body) {
        try {
            clientPortalService.sendMessage(clientId, body.get("content"));
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{clientId}/meetings/{meetingId}/accept")
    public ResponseEntity<Void> acceptMeeting(@PathVariable UUID clientId, @PathVariable UUID meetingId) {
        try {
            clientPortalService.acceptMeeting(clientId, meetingId);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{clientId}/meetings/{meetingId}/reschedule")
    public ResponseEntity<Void> rescheduleMeeting(@PathVariable UUID clientId, @PathVariable UUID meetingId, @RequestBody java.util.Map<String, String> body) {
        try {
            java.time.LocalDateTime newDate = java.time.LocalDateTime.parse(body.get("newDate"));
            clientPortalService.rescheduleMeeting(clientId, meetingId, newDate, body.get("reason"));
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{clientId}/meetings/{meetingId}/cancel")
    public ResponseEntity<Void> cancelMeeting(@PathVariable UUID clientId, @PathVariable UUID meetingId, @RequestBody java.util.Map<String, String> body) {
        try {
            clientPortalService.cancelMeeting(clientId, meetingId, body.get("reason"));
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{clientId}/password")
    public ResponseEntity<?> updatePassword(@PathVariable UUID clientId, @RequestBody ChangePasswordDto dto) {
        try {
            clientPortalService.updatePassword(clientId, dto);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(java.util.Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
}
