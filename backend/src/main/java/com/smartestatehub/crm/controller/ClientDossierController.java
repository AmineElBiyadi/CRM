package com.smartestatehub.crm.controller;

import com.smartestatehub.crm.dto.ClientPortalDataDto;
import com.smartestatehub.crm.dto.DossierDetailDto;
import com.smartestatehub.crm.service.ClientPortalService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/client")
@RequiredArgsConstructor
public class ClientDossierController {

    private final ClientPortalService clientPortalService;

    @GetMapping("/dossiers")
    public ResponseEntity<List<DossierDetailDto>> getClientDossiers(@RequestHeader("X-Client-Id") UUID clientId) {
        try {
            List<DossierDetailDto> dossiers = clientPortalService.getClientDossiers(clientId);
            return ResponseEntity.ok(dossiers);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/dossiers/{idFolder}/activity")
    public ResponseEntity<List<ClientPortalDataDto.TimelineEvent>> getDossierActivity(
            @RequestHeader("X-Client-Id") UUID clientId,
            @PathVariable UUID idFolder) {
        try {
            List<ClientPortalDataDto.TimelineEvent> activity = clientPortalService.getDossierActivity(clientId, idFolder);
            return ResponseEntity.ok(activity);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }
}
