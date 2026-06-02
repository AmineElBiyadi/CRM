package com.smartestatehub.crm.service;

import com.smartestatehub.auth.model.InternalUser;
import com.smartestatehub.auth.repository.UserRepository;
import com.smartestatehub.crm.dto.AgentDashboardDto;
import com.smartestatehub.crm.dto.AgentKpiDto;
import com.smartestatehub.crm.dto.ClientIdentityDto;
import com.smartestatehub.crm.dto.DealPriorityDto;
import com.smartestatehub.crm.dto.MeetingDto;
import com.smartestatehub.crm.model.ContractStatus;
import com.smartestatehub.crm.model.Deal;
import com.smartestatehub.crm.model.DealStage;
import com.smartestatehub.crm.repository.ContractRepository;
import com.smartestatehub.crm.repository.DealRepository;
import com.smartestatehub.crm.repository.DealStageUpdateRepository;
import com.smartestatehub.crm.repository.MeetingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.TemporalAdjusters;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final UserRepository userRepository;
    private final DealRepository dealRepository;
    private final ContractRepository contractRepository;
    private final MeetingRepository meetingRepository;
    private final DealStageUpdateRepository stageUpdateRepository;
    private final MeetingService meetingService;
    private final ClientService clientService;

    @Transactional(readOnly = true)
    public AgentDashboardDto getAgentDashboard(UUID agentId) {
        // 1. Nom de l'agent
        InternalUser agent = userRepository.findById(agentId).orElse(null);
        String agentFirstName = agent != null ? agent.getFirstName() : "Agent";
        String agentFullName = agent != null ? agent.getFirstName() + " " + agent.getLastName() : "Agent";
        String agentRole = (agent != null && agent.getRole() != null) ? agent.getRole().name() : "AGENT";

        // 2. Calcul des KPIs
        // Clients actifs (non CLOSED et non LOST)
        long activeClients = dealRepository.countByClientFolder_AssignedAgent_IdUserAndStageNotInAndDeletedAtIsNull(
                agentId, List.of(DealStage.CLOSED, DealStage.LOST));

        // Réunions cette semaine (du lundi 00:00 au dimanche 23:59)
        LocalDateTime weekStart = LocalDate.now().with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY)).atStartOfDay();
        LocalDateTime weekEnd = weekStart.plusDays(7);
        long weekMeetings = meetingRepository.countWeekMeetingsByAgent(agentId, weekStart, weekEnd);

        // Contrats en attente (statut SENT)
        long pendingContracts = contractRepository.countByDeal_ClientFolder_AssignedAgent_IdUserAndStatusAndDeletedAtIsNull(
                agentId, ContractStatus.SENT);

        // Score moyen leads
        Double avgScore = dealRepository.avgLeadScoreByAgent(agentId);
        int avgLeadScore = avgScore != null ? (int) Math.round(avgScore) : 0;
        
        // 3. Score mensuel (Taux de conversion : CLOS / (Actifs + CLOS + LOST ce mois))
        LocalDateTime monthStart = LocalDate.now().with(TemporalAdjusters.firstDayOfMonth()).atStartOfDay();
        long wonThisMonth = stageUpdateRepository.countUniqueDealsByStageSince(agentId, "CLOSED", monthStart);
        long lostThisMonth = stageUpdateRepository.countUniqueDealsByStageSince(agentId, "LOST", monthStart);
        
        long totalManagedThisMonth = activeClients + wonThisMonth + lostThisMonth;
        int monthlyScore = 0;
        if (totalManagedThisMonth > 0) {
            monthlyScore = (int) Math.round((double) wonThisMonth / totalManagedThisMonth * 100);
        }

        AgentKpiDto kpis = new AgentKpiDto(activeClients, weekMeetings, pendingContracts, avgLeadScore, monthlyScore);

        // 3. Réunions d'aujourd'hui (timeline + checklist)
        List<MeetingDto> todayMeetings = meetingService.getTodayMeetings(agentId);

        // 4. Priorités IA (Top 5 deals triés par score décroissant)
        List<Deal> topDeals = dealRepository.findTop5ByAgentIdWithClient(agentId, PageRequest.of(0, 5));
        List<DealPriorityDto> priorities = topDeals.stream()
                .map(this::mapToPriorityDto)
                .collect(Collectors.toList());

        // 5. Nouveaux clients PENDING
        List<ClientIdentityDto> pendingClients = clientService.getClientIdentitiesForAgent(agentId).stream()
                .filter(c -> c.newClient())
                .collect(Collectors.toList());

        // 6. Assemblage du dashboard
        return new AgentDashboardDto(
                agentFirstName,
                agentFullName,
                agentRole,
                kpis,
                todayMeetings, // Planning
                priorities,    // Priorités
                todayMeetings, // Tâches du jour (checklist)
                pendingClients // Nouveaux clients à confirmer
        );
    }

    private DealPriorityDto mapToPriorityDto(Deal deal) {
        String clientFullName = "Client inconnu";
        String clientPhone = "";
        String clientEmail = "";
        UUID clientFolderId = null;

        if (deal.getClientFolder() != null) {
            clientFolderId = deal.getClientFolder().getIdProfile();
            if (deal.getClientFolder().getClient() != null) {
                var client = deal.getClientFolder().getClient();
                clientFullName = client.getFirstName() + " " + client.getLastName();
                clientPhone = client.getPhone() != null ? client.getPhone() : "";
                clientEmail = client.getEmail() != null ? client.getEmail() : "";
            }
        }

        String stageStr = deal.getStage() != null ? deal.getStage().name().toLowerCase() : "froid";
        Integer score = deal.getAiLeadScore() != null ? deal.getAiLeadScore() : 0;
        String recAction = deal.getAiRecommendedAction() != null ? deal.getAiRecommendedAction() : "Aucune recommandation";
        String relativeTime = getRelativeTime(deal.getLastInteractionAt());

        return new DealPriorityDto(
                deal.getIdDeal(),
                clientFolderId,
                clientFullName,
                clientPhone,
                clientEmail,
                stageStr,
                score,
                recAction,
                relativeTime
        );
    }

    private String getRelativeTime(LocalDateTime dateTime) {
        if (dateTime == null) return "jamais";
        LocalDateTime now = LocalDateTime.now();
        long days = java.time.temporal.ChronoUnit.DAYS.between(dateTime, now);
        if (days < 0) return "à venir";
        if (days == 0) {
            long hours = java.time.temporal.ChronoUnit.HOURS.between(dateTime, now);
            if (hours <= 0) {
                long minutes = java.time.temporal.ChronoUnit.MINUTES.between(dateTime, now);
                return minutes <= 0 ? "à l'instant" : "il y a " + minutes + "m";
            }
            return "il y a " + hours + "h";
        }
        if (days == 1) return "hier";
        return "il y a " + days + "j";
    }
}
