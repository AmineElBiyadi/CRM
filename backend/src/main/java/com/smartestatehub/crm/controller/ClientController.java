package com.smartestatehub.crm.controller;

import com.smartestatehub.crm.service.ClientService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

import com.smartestatehub.crm.dto.ClientIdentityDto;
import com.smartestatehub.crm.dto.CreateClientForm1Request;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;

@RestController
@RequestMapping("/api/agent/clients")
@RequiredArgsConstructor
public class ClientController {

    private final ClientService clientService;

    @GetMapping("/identities")
    public List<ClientIdentityDto> getIdentities(@RequestHeader("X-Agent-Id") UUID agentId) {
        return clientService.getClientIdentitiesForAgent(agentId);
    }

    @GetMapping("/check")
    public ResponseEntity<?> checkExistence(@RequestParam String email, @RequestParam String phone) {
        var existing = clientService.findExistingClient(email, phone);
        if (existing.isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(existing.get());
        }
        return ResponseEntity.ok().build();
    }

    @PostMapping("/identity")
    public void createIdentity(
            @RequestBody CreateClientForm1Request request,
            @RequestHeader("X-Agent-Id") UUID agentId) {
        clientService.createClientIdentity(request, agentId);
    }
}
