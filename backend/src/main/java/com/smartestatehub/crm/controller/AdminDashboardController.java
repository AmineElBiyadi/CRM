package com.smartestatehub.crm.controller;

import com.smartestatehub.crm.dto.AdminAlertNotifyRequest;
import com.smartestatehub.crm.dto.AdminAgentDetailDto;
import com.smartestatehub.crm.dto.AdminAgentDto;
import com.smartestatehub.crm.dto.AdminAnalyticsDto;
import com.smartestatehub.crm.dto.AdminDashboardDto;
import com.smartestatehub.crm.dto.AdminPipelineDto;
import com.smartestatehub.crm.dto.CreateAgentRequest;
import com.smartestatehub.crm.dto.DossierDetailDto;
import com.smartestatehub.crm.dto.UpdateAgentRequest;
import com.smartestatehub.crm.dto.UpdateAgentStatusRequest;
import com.smartestatehub.crm.service.AdminDashboardService;
import com.smartestatehub.notification.dto.NotificationDto;
import com.smartestatehub.notification.service.NotificationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/dashboard")
@RequiredArgsConstructor
public class AdminDashboardController {

    private final AdminDashboardService adminDashboardService;
    private final NotificationService notificationService;

    @GetMapping("/agents")
    public ResponseEntity<List<AdminAgentDto>> getAgents(
            @RequestParam(defaultValue = "workload") String sortBy,
            @RequestParam(defaultValue = "desc") String direction
    ) {
        return ResponseEntity.ok(adminDashboardService.getAgents(sortBy, direction));
    }

    @GetMapping("/agents/{agentId}")
    public ResponseEntity<AdminAgentDetailDto> getAgentDetail(@PathVariable UUID agentId) {
        return ResponseEntity.ok(adminDashboardService.getAgentDetail(agentId));
    }

    @PostMapping("/agents")
    public ResponseEntity<AdminAgentDto> createAgent(@Valid @RequestBody CreateAgentRequest request) {
        return ResponseEntity.ok(adminDashboardService.createAgent(request));
    }

    @PutMapping("/agents/{agentId}")
    public ResponseEntity<AdminAgentDto> updateAgent(
            @PathVariable UUID agentId,
            @Valid @RequestBody UpdateAgentRequest request
    ) {
        return ResponseEntity.ok(adminDashboardService.updateAgent(agentId, request));
    }

    @PatchMapping("/agents/{agentId}/status")
    public ResponseEntity<AdminAgentDto> updateAgentStatus(
            @PathVariable UUID agentId,
            @Valid @RequestBody UpdateAgentStatusRequest request,
            Principal principal
    ) {
        String email = principal != null ? principal.getName() : null;
        return ResponseEntity.ok(adminDashboardService.updateAgentStatus(agentId, request, email));
    }

    @GetMapping("/pipeline")
    public ResponseEntity<AdminPipelineDto> getPipeline(
            @RequestParam(required = false) UUID agentId
    ) {
        return ResponseEntity.ok(adminDashboardService.getAdminPipeline(agentId));
    }

    @GetMapping("/analytics")
    public ResponseEntity<AdminAnalyticsDto> getAnalytics(
            @RequestParam(defaultValue = "year") String periodType,
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer month
    ) {
        return ResponseEntity.ok(adminDashboardService.getAdminAnalytics(periodType, year, month));
    }

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

    @PatchMapping("/dossiers/{id}/stage")
    public ResponseEntity<DossierDetailDto> updateDealStage(
            @PathVariable UUID id,
            @RequestParam com.smartestatehub.crm.model.DealStage stage,
            java.security.Principal principal
    ) {
        String email = principal != null ? principal.getName() : null;
        return ResponseEntity.ok(adminDashboardService.updateDealStage(id, stage, email));
    }
}
