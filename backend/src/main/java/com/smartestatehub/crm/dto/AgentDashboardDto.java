package com.smartestatehub.crm.dto;

import java.util.List;

public record AgentDashboardDto(
    String agentFirstName,
    String agentFullName,
    String agentRole,
    AgentKpiDto kpis,
    List<MeetingDto> todayMeetings,
    List<DealPriorityDto> priorities,
    List<MeetingDto> todayTasks
) {}
