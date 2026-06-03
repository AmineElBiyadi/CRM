package com.smartestatehub.crm.dto;

import java.util.List;

public record AgentDashboardDto(
    String agentFirstName,
    String agentFullName,
    String agentRole,
    String agentEmail,
    String agentPhone,
    java.time.LocalDateTime agentCreatedAt,
    AgentKpiDto kpis,
    List<MeetingDto> todayMeetings,
    List<DealPriorityDto> priorities,
    List<MeetingDto> todayTasks,
    List<ClientIdentityDto> pendingClients
) {}
