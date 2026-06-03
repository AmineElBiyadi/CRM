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
            @RequestHeader("X-Agent-Id") UUID agentId) {
        
        AgentDashboardDto dashboard = dashboardService.getAgentDashboard(agentId);
        return ResponseEntity.ok(dashboard);
    }
}
