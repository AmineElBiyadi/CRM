package com.smartestatehub.crm.controller;

import com.smartestatehub.crm.dto.AdminAlertNotifyRequest;
import com.smartestatehub.crm.dto.AdminDashboardDto;
import com.smartestatehub.crm.service.AdminDashboardService;
import com.smartestatehub.notification.dto.NotificationDto;
import com.smartestatehub.notification.service.NotificationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;

@RestController
@RequestMapping("/api/admin/dashboard")
@RequiredArgsConstructor
public class AdminDashboardController {

    private final AdminDashboardService adminDashboardService;
    private final NotificationService notificationService;

    @GetMapping
    public ResponseEntity<AdminDashboardDto> getAdminDashboard(
            Principal principal,
            @RequestParam(defaultValue = "0") int weekOffset
    ) {
        String email = principal != null ? principal.getName() : null;
        return ResponseEntity.ok(adminDashboardService.getAdminDashboard(email, weekOffset));
    }

    @PostMapping("/alerts/notify")
    public ResponseEntity<NotificationDto> notifyAgent(
            @Valid @RequestBody AdminAlertNotifyRequest request,
            Principal principal
    ) {
        if (principal == null) {
            return ResponseEntity.status(401).build();
        }
        String title = "Action requise — " + request.clientName();
        NotificationDto created = notificationService.notifyAgentFromAdmin(
                request.agentId(),
                title,
                request.reason(),
                principal.getName()
        );
        return ResponseEntity.ok(created);
    }
}
