package com.smartestatehub.crm.controller;

import com.smartestatehub.crm.dto.*;
import com.smartestatehub.crm.model.Client;
import com.smartestatehub.crm.repository.ClientRepository;
import com.smartestatehub.crm.service.ClientPortalService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/client/portal")
@RequiredArgsConstructor
public class ClientPortalController {

    private final ClientPortalService clientPortalService;
    private final ClientRepository clientRepository;

    private Client getAuthenticatedClient(String email) {
        return clientRepository.findByEmail(email)
                .orElseThrow(() -> new BadCredentialsException("Client non trouvé"));
    }

    @GetMapping("/full-data")
    public ResponseEntity<?> getFullClientPortalData(@AuthenticationPrincipal String email) {
        if (email == null) {
            return ResponseEntity.status(401).body(java.util.Map.of("error", "Email principal non trouvé dans le contexte de sécurité."));
        }
        try {
            Client client = getAuthenticatedClient(email);
            ClientPortalDataDto data = clientPortalService.getFullClientPortalData(client.getIdClient());
            return ResponseEntity.ok(data);
        } catch (BadCredentialsException e) {
            return ResponseEntity.status(401).body(java.util.Map.of("error", "Client non trouvé pour l'email : " + email));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(java.util.Map.of("error", e.getMessage() != null ? e.getMessage() : "Internal Server Error"));
        }
    }

    @PutMapping("/profile")
    public ResponseEntity<Void> updateProfile(@AuthenticationPrincipal String email, @RequestBody UpdateClientProfileDto dto) {
        try {
            Client client = getAuthenticatedClient(email);
            clientPortalService.updateProfile(client.getIdClient(), dto);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/message")
    public ResponseEntity<Void> sendMessage(@AuthenticationPrincipal String email, @RequestBody java.util.Map<String, String> body) {
        try {
            Client client = getAuthenticatedClient(email);
            clientPortalService.sendMessage(client.getIdClient(), body.get("content"));
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/meetings/{meetingId}/accept")
    public ResponseEntity<Void> acceptMeeting(@AuthenticationPrincipal String email, @PathVariable UUID meetingId) {
        try {
            Client client = getAuthenticatedClient(email);
            clientPortalService.acceptMeeting(client.getIdClient(), meetingId);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/meetings/{meetingId}/reschedule")
    public ResponseEntity<Void> rescheduleMeeting(@AuthenticationPrincipal String email, @PathVariable UUID meetingId, @RequestBody java.util.Map<String, String> body) {
        try {
            Client client = getAuthenticatedClient(email);
            java.time.LocalDateTime newDate = java.time.LocalDateTime.parse(body.get("newDate"));
            clientPortalService.rescheduleMeeting(client.getIdClient(), meetingId, newDate, body.get("reason"));
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/meetings/{meetingId}/cancel")
    public ResponseEntity<Void> cancelMeeting(@AuthenticationPrincipal String email, @PathVariable UUID meetingId, @RequestBody java.util.Map<String, String> body) {
        try {
            Client client = getAuthenticatedClient(email);
            clientPortalService.cancelMeeting(client.getIdClient(), meetingId, body.get("reason"));
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/offers/{offerId}/accept")
    public ResponseEntity<Void> acceptOffer(@AuthenticationPrincipal String email, @PathVariable UUID offerId) {
        try {
            Client client = getAuthenticatedClient(email);
            clientPortalService.acceptOffer(client.getIdClient(), offerId);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/offers/{offerId}/reject")
    public ResponseEntity<Void> rejectOffer(@AuthenticationPrincipal String email, @PathVariable UUID offerId) {
        try {
            Client client = getAuthenticatedClient(email);
            clientPortalService.rejectOffer(client.getIdClient(), offerId);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/offers/{offerId}/withdraw")
    public ResponseEntity<Void> withdrawOffer(@AuthenticationPrincipal String email, @PathVariable UUID offerId) {
        try {
            Client client = getAuthenticatedClient(email);
            clientPortalService.withdrawOffer(client.getIdClient(), offerId);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/password")
    public ResponseEntity<?> updatePassword(@AuthenticationPrincipal String email, @RequestBody ChangePasswordDto dto) {
        try {
            Client client = getAuthenticatedClient(email);
            clientPortalService.updatePassword(client.getIdClient(), dto);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(java.util.Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
}
