package com.smartestatehub.crm.controller;

import com.smartestatehub.crm.dto.*;
import com.smartestatehub.crm.model.Client;
import com.smartestatehub.crm.service.ClientService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;
import java.util.Map;
import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class WorkflowController {

    private final ClientService clientService;

    @PostMapping("/clients")
    public ResponseEntity<Client> createClient(@RequestBody ClientCreateDTO dto) {
        return ResponseEntity.ok(clientService.createPendingClient(dto));
    }

    @PatchMapping("/clients/{id}/confirm")
    public ResponseEntity<Void> confirmClient(@PathVariable UUID id, @RequestBody ClientConfirmDTO dto) {
        clientService.confirmClient(id, dto);
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/dossiers/{id}/confirm")
    public ResponseEntity<Void> confirmDossier(@PathVariable UUID id, @RequestBody DossierConfirmDTO dto) {
        clientService.confirmDossier(id, dto);
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/dossiers/{id}/assign")
    public ResponseEntity<Void> assignDossier(@PathVariable UUID id, @RequestBody Map<String, UUID> body) {
        UUID agentId = body.get("agentId");
        clientService.assignDossier(id, agentId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/dossiers/{id}/cloturer")
    public ResponseEntity<Void> closeDossier(@PathVariable UUID id) {
        clientService.closeDossier(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/agents/{agentId}/dossiers")
    public ResponseEntity<List<DossierAgentDto>> getDossiersForAgent(@PathVariable UUID agentId) {
        return ResponseEntity.ok(clientService.getDossierIdentitiesForAgent(agentId));
    }
}
