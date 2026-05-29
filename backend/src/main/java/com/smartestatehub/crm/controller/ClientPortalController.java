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
}
