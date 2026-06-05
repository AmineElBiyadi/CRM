package com.smartestatehub.notification.controller;

import com.smartestatehub.notification.dto.SendEmailRequest;
import com.smartestatehub.notification.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/emails")
@RequiredArgsConstructor
@Slf4j
public class EmailController {

    private final EmailService emailService;

    @PostMapping("/send")
    public ResponseEntity<Void> sendEmail(@RequestBody SendEmailRequest request) {
        log.info("Requête d'envoi d'email vers {}", request.getClientEmail());
        try {
            emailService.sendCustomEmail(
                    request.getClientEmail(),
                    request.getSubject(),
                    request.getBody()
            );
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("Erreur lors de l'envoi de l'email: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }
}
