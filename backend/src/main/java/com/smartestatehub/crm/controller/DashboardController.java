package com.smartestatehub.crm.controller;

import com.smartestatehub.crm.dto.AgentDashboardDto;
import com.smartestatehub.crm.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.UUID;

@RestController
@RequestMapping("/api/agent/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping
    public ResponseEntity<AgentDashboardDto> getAgentDashboard(
            @RequestHeader(value = "X-Agent-Id", required = false) String devAgentId,
            Principal principal) {
        
        UUID agentId = resolveAgentId(devAgentId, principal);
        AgentDashboardDto dashboard = dashboardService.getAgentDashboard(agentId);
        return ResponseEntity.ok(dashboard);
    }

    private UUID resolveAgentId(String devAgentId, Principal principal) {
        try {
            if (devAgentId != null && !devAgentId.isBlank()) {
                return UUID.fromString(devAgentId);
            }
            if (principal != null) {
                return UUID.fromString(principal.getName());
            }
        } catch (Exception e) {
            // Fallback if conversion fails
        }
        // Fallback agent ID (Sarah Laroui - seeded in DatabaseSeeder)
        return UUID.fromString("8366d183-2fb7-44a1-8f16-2ec3ca78a320");
    }
}
