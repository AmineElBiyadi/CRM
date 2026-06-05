package com.smartestatehub.notification.controller;

import com.smartestatehub.ai.service.WeeklyReportService;
import com.smartestatehub.auth.model.Role;
import com.smartestatehub.auth.repository.UserRepository;
import com.smartestatehub.crm.service.ClientService;
import com.smartestatehub.crm.service.DealService;
import com.smartestatehub.notification.dto.NotificationDto;
import com.smartestatehub.notification.dto.SystemNotificationRequest;
import com.smartestatehub.notification.service.EmailService;
import com.smartestatehub.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.List;
import java.util.UUID;

/**
 * Controller specifically for n8n workflows to call back into our system.
 * Accessible by n8n to perform actions in the CRM.
 */
@RestController
@RequestMapping("/api/webhooks")
@RequiredArgsConstructor
@Slf4j
public class WebhookController {

    private final EmailService emailService;
    private final NotificationService notificationService;
    private final WeeklyReportService weeklyReportService;
    private final ClientService clientService;
    private final DealService dealService;
    private final UserRepository userRepository;

    /**
     * Endpoint for n8n to request the weekly AI report PDF.
     */
    @GetMapping("/ai-weekly-summary")
    public ResponseEntity<byte[]> getWeeklyReport() {
        log.info("[WEBHOOK] n8n requested weekly report PDF");
        byte[] pdfContent = weeklyReportService.generateWeeklyReportPdf();
        
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=rapport-hebdomadaire.pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdfContent);
    }

    /**
     * Endpoint for n8n to get the list of cold leads (inactive > 10 days).
     */
    @GetMapping("/leads/cold")
    public ResponseEntity<List<com.smartestatehub.crm.dto.ColdLeadDto>> getColdLeads() {
        log.info("[WEBHOOK] n8n requested cold leads list");
        return ResponseEntity.ok(dealService.getColdLeads());
    }

    /**
     * Endpoint for n8n to get the primary admin email.
     */
    @GetMapping("/admin/primary-email")
    public ResponseEntity<Map<String, String>> getPrimaryAdminEmail() {
        log.info("[WEBHOOK] n8n requested primary admin email");
        return userRepository.findByRoleOrderByLastNameAsc(Role.ADMIN).stream()
                .findFirst()
                .map(admin -> ResponseEntity.ok(Map.of("email", admin.getEmail())))
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Endpoint for n8n to send an in-app notification to an agent.
     */
    @PostMapping("/notifications/agent")
    public ResponseEntity<NotificationDto> notifyAgent(@RequestBody SystemNotificationRequest request) {
        log.info("[WEBHOOK] n8n sending notification to agent. Email: {}, ID: {}", 
                request.getReceiverEmail(), request.getReceiverId());

        if (request.getReceiverId() == null && 
            (request.getReceiverEmail() == null || request.getReceiverEmail().isBlank() || request.getReceiverEmail().equalsIgnoreCase("N/A"))) {
            log.warn("[WEBHOOK] Skipping agent notification: No valid recipient provided.");
            return ResponseEntity.ok().build();
        }

        return ResponseEntity.ok(notificationService.sendSystemNotification(
                request.getReceiverId(),
                request.getReceiverEmail(),
                request.getTitle(),
                request.getMessage()
        ));
    }

    /**
     * Endpoint for n8n to send an in-app notification to an admin.
     */
    @PostMapping("/notifications/admin")
    public ResponseEntity<NotificationDto> notifyAdmin(@RequestBody SystemNotificationRequest request) {
        log.info("[WEBHOOK] n8n sending notification to admin. Email: {}, ID: {}", 
                request.getReceiverEmail(), request.getReceiverId());

        if (request.getReceiverId() == null && 
            (request.getReceiverEmail() == null || request.getReceiverEmail().isBlank() || request.getReceiverEmail().equalsIgnoreCase("N/A"))) {
            log.warn("[WEBHOOK] Skipping admin notification: No valid recipient provided.");
            return ResponseEntity.ok().build();
        }

        return ResponseEntity.ok(notificationService.sendSystemNotification(
                request.getReceiverId(),
                request.getReceiverEmail(),
                request.getTitle(),
                request.getMessage()
        ));
    }

    /**
     * Endpoint for n8n to close a deal.
     */
    @PostMapping("/dossiers/{id}/cloturer")
    public ResponseEntity<Void> closeDossier(@PathVariable UUID id) {
        log.info("[WEBHOOK] n8n closing deal: {}", id);
        dealService.closeDeal(id);
        return ResponseEntity.ok().build();
    }

    /**
     * Endpoint for n8n to log that an email has been sent.
     */
    @PostMapping("/log-email")
    public ResponseEntity<Void> logEmailSent(@RequestBody Map<String, Object> payload) {
        log.info("[WEBHOOK] n8n logged an email: {}", payload);
        return ResponseEntity.ok().build();
    }

    /**
     * Endpoint for n8n to request an AI-generated draft.
     */
    @PostMapping("/generate-draft")
    public ResponseEntity<Map<String, String>> generateDraft(@RequestBody Map<String, Object> request) {
        log.info("[WEBHOOK] n8n requested a draft: {}", request);
        String prompt = (String) request.get("prompt");
        Map<String, Object> context = (Map<String, Object>) request.get("context");
        String draft = emailService.generateEmailDraft(prompt, context);
        return ResponseEntity.ok(Map.of("draft", draft));
    }
}
