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
        if (devAgentId != null && !devAgentId.isBlank()) {
            return UUID.fromString(devAgentId);
        }
        if (principal != null) {
            try {
                return UUID.fromString(principal.getName());
            } catch (Exception e) {
                // Principal is likely email/user object
            }
        }
        // Fallback agent ID for local development and integration tests
        return UUID.fromString("b8a260b2-aad3-4923-97ff-2a3e761fcafd");
    }
}
