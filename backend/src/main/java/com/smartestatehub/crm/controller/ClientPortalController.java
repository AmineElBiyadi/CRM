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
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class ClientPortalController {

    private final ClientPortalService clientPortalService;

    @GetMapping("/{clientId}/full-data")
    public ResponseEntity<ClientPortalDataDto> getFullClientPortalData(@PathVariable UUID clientId) {
        try {
            ClientPortalDataDto data = clientPortalService.getFullClientPortalData(clientId);
            return ResponseEntity.ok(data);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
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

    @PostMapping("/{clientId}/meetings/request")
    public ResponseEntity<Void> requestMeeting(@PathVariable UUID clientId, @RequestBody java.util.Map<String, String> body) {
        try {
            clientPortalService.requestMeeting(
                    clientId,
                    body.get("type"),
                    body.get("preferredDate"),
                    body.get("preferredTime"),
                    body.get("message")
            );
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{clientId}/password")
    public ResponseEntity<Void> updatePassword(@PathVariable UUID clientId, @RequestBody ChangePasswordDto dto) {
        try {
            clientPortalService.updatePassword(clientId, dto);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
}
