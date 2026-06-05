package com.smartestatehub.crm.controller;

import com.smartestatehub.crm.dto.PublicOnboardingDTO.*;
import com.smartestatehub.crm.model.Client;
import com.smartestatehub.crm.model.ClientFolder;
import com.smartestatehub.crm.service.ClientService;
import com.smartestatehub.crm.service.DealService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;

import java.util.UUID;

@RestController
@RequestMapping("/api/public/onboarding")
@RequiredArgsConstructor
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class PublicOnboardingController {

    private final ClientService clientService;
    private final DealService dealService;

    @PostMapping("/client")
    public ResponseEntity<?> createClient(@RequestBody ClientStep1Request request) {
        try {
            Client client = clientService.createPublicClient(request);
            return ResponseEntity.ok(client.getIdClient());
        } catch (RuntimeException e) {
            if ("EMAIL_TAKEN".equals(e.getMessage())) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body(java.util.Map.of("error", "EMAIL_TAKEN"));
            }
            throw e;
        }
    }

    @GetMapping("/check-email")
    public ResponseEntity<?> checkEmail(@RequestParam String email) {
        if (clientService.isEmailTaken(email)) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(java.util.Map.of("error", "EMAIL_TAKEN"));
        }
        return ResponseEntity.ok().build();
    }

    @PostMapping("/dossier")
    public ResponseEntity<UUID> createDossier(@RequestBody DossierStep3Request request) {
        ClientFolder folder = clientService.createPublicDossier(request);
        return ResponseEntity.ok(folder.getIdProfile());
    }
}
