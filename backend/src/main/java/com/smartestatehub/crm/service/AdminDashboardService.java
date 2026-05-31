package com.smartestatehub.crm.service;

import com.smartestatehub.auth.model.InternalUser;
import com.smartestatehub.auth.model.Role;
import com.smartestatehub.auth.repository.UserRepository;
import com.smartestatehub.crm.dto.*;
import com.smartestatehub.crm.model.Contract;
import com.smartestatehub.crm.model.ContractStatus;
import com.smartestatehub.crm.model.Deal;
import com.smartestatehub.crm.model.DealStage;
import com.smartestatehub.crm.repository.ContractRepository;
import com.smartestatehub.crm.repository.DealRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.time.temporal.TemporalAdjusters;
import java.time.temporal.WeekFields;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AdminDashboardService {

    private static final List<DealStage> TERMINAL_STAGES = List.of(DealStage.CLOSED, DealStage.LOST);
    private static final DateTimeFormatter PERIOD_DAY_FMT = DateTimeFormatter.ofPattern("d MMM", Locale.FRENCH);
    private static final DateTimeFormatter PERIOD_DAY_YEAR_FMT = DateTimeFormatter.ofPattern("d MMM yyyy", Locale.FRENCH);
    private static final WeekFields WEEK_FIELDS = WeekFields.of(Locale.FRANCE);

    private final UserRepository userRepository;
    private final DealRepository dealRepository;
    private final ContractRepository contractRepository;

    @Transactional(readOnly = true)
    public AdminDashboardDto getAdminDashboard(String adminEmail, int weekOffset) {
        String adminFirstName = "Admin";
        if (adminEmail != null && !adminEmail.isBlank()) {
            adminFirstName = userRepository.findByEmail(adminEmail)
                    .map(InternalUser::getFirstName)
                    .orElse(adminFirstName);
        }

        LocalDate today = LocalDate.now();
        WeekPeriod weekPeriod = resolveWeekPeriod(today, weekOffset);
        LocalDateTime weekStart = weekPeriod.start().atStartOfDay();
        LocalDateTime nextWeekStart = weekPeriod.end().plusDays(1).atStartOfDay();
        LocalDateTime prevWeekStart = weekStart.minusWeeks(1);

        long activeDossiers = dealRepository.countCreatedBetween(weekStart, nextWeekStart);
        long closedThisMonth = dealRepository.countClosedBetween(
                DealStage.CLOSED, weekStart, nextWeekStart);
        long closedPrevMonth = dealRepository.countClosedBetween(
                DealStage.CLOSED, prevWeekStart, weekStart);
        long coldLeads = dealRepository.countByStageCreatedBetween(DealStage.COLD, weekStart, nextWeekStart);
        long totalDossiers = dealRepository.countCreatedBetween(weekStart, nextWeekStart);
        long closedTotal = dealRepository.countClosedBetween(DealStage.CLOSED, weekStart, nextWeekStart);
        long lostTotal = dealRepository.countClosedBetween(DealStage.LOST, weekStart, nextWeekStart);
        long decided = closedTotal + lostTotal;
        double conversionRate = decided == 0 ? 0.0 : (100.0 * closedTotal) / decided;

        long prevClosedTotal = dealRepository.countClosedBetween(DealStage.CLOSED, prevWeekStart, weekStart);
        long prevLostTotal = dealRepository.countClosedBetween(DealStage.LOST, prevWeekStart, weekStart);
        double prevConversion = (prevClosedTotal + prevLostTotal) == 0
                ? 0.0
                : (100.0 * prevClosedTotal) / (prevClosedTotal + prevLostTotal);

        long createdThisMonth = activeDossiers;
        long createdPrevMonth = dealRepository.countCreatedBetween(prevWeekStart, weekStart);
        long warmAndHot = dealRepository.countByStageCreatedBetween(DealStage.WARM, weekStart, nextWeekStart)
                + dealRepository.countByStageCreatedBetween(DealStage.HOT, weekStart, nextWeekStart);

        AdminKpiDto kpis = new AdminKpiDto(
                activeDossiers,
                closedThisMonth,
                coldLeads,
                Math.round(conversionRate * 10) / 10.0,
                formatPercentChange(createdThisMonth, createdPrevMonth),
                formatPercentChange(closedThisMonth, closedPrevMonth),
                formatDelta(coldLeads, warmAndHot),
                formatPercentPointDelta(conversionRate, prevConversion),
                createdThisMonth >= createdPrevMonth,
                closedThisMonth >= closedPrevMonth,
                coldLeads <= warmAndHot,
                conversionRate >= prevConversion
        );

        List<AdminPipelineStageDto> pipeline = List.of(
                stageDto("froid", "Froid", DealStage.COLD, weekStart, nextWeekStart),
                stageDto("tiede", "Tiède", DealStage.WARM, weekStart, nextWeekStart),
                stageDto("chaud", "Chaud", DealStage.HOT, weekStart, nextWeekStart),
                stageDto("negociation", "Négociation", DealStage.NEGOTIATION, weekStart, nextWeekStart),
                stageDto("cloture", "Clôturé", DealStage.CLOSED, weekStart, nextWeekStart),
                stageDto("perdu", "Perdu", DealStage.LOST, weekStart, nextWeekStart)
        );

        List<AdminAgentPerfDto> agents = buildAgentPerformance(weekStart, nextWeekStart);
        List<AdminAlertDto> alerts = buildAlerts();

        return new AdminDashboardDto(
                adminFirstName,
                weekPeriod.label(),
                weekPeriod.weekNumber(),
                weekPeriod.start().toString(),
                weekPeriod.end().toString(),
                weekOffset,
                kpis,
                pipeline,
                totalDossiers,
                agents,
                alerts
        );
    }

    private AdminPipelineStageDto stageDto(String key, String label, DealStage stage) {
        return new AdminPipelineStageDto(key, label, dealRepository.countByDeletedAtIsNullAndStage(stage));
    }

    private AdminPipelineStageDto stageDto(
            String key,
            String label,
            DealStage stage,
            LocalDateTime from,
            LocalDateTime to) {
        return new AdminPipelineStageDto(key, label, dealRepository.countByStageCreatedBetween(stage, from, to));
    }

    private List<AdminAgentPerfDto> buildAgentPerformance(LocalDateTime monthStart, LocalDateTime nextMonthStart) {
        List<InternalUser> agentUsers = userRepository.findByRoleAndDeletedAtIsNullOrderByLastNameAsc(Role.AGENT);
        LocalDateTime inactivityThreshold = LocalDateTime.now().minusDays(14);

        return agentUsers.stream()
                .map(agent -> {
                    UUID agentId = agent.getIdUser();
                    long activeClients = dealRepository.countByClientFolder_AssignedAgent_IdUserAndStageNotInAndDeletedAtIsNull(
                            agentId, TERMINAL_STAGES);
                    long closedThisMonth = dealRepository.countAgentClosedBetween(
                            agentId, DealStage.CLOSED, monthStart, nextMonthStart);

                    LocalDateTime lastInteraction = dealRepository.findLatestInteractionByAgent(agentId);
                    String lastActivity = getRelativeTime(lastInteraction);
                    boolean active = lastInteraction != null && lastInteraction.isAfter(inactivityThreshold);

                    return new AdminAgentPerfDto(
                            agentId,
                            agent.getFirstName() + " " + agent.getLastName(),
                            activeClients,
                            closedThisMonth,
                            lastActivity,
                            active
                    );
                })
                .sorted(Comparator.comparingLong(AdminAgentPerfDto::activeClients).reversed())
                .toList();
    }

    private List<AdminAlertDto> buildAlerts() {
        List<AdminAlertDto> alerts = new ArrayList<>();
        LocalDateTime staleThreshold = LocalDateTime.now().minusDays(7);

        for (Deal deal : dealRepository.findStaleHotDeals(DealStage.HOT, staleThreshold)) {
            alerts.add(new AdminAlertDto(
                    "deal:" + deal.getIdDeal(),
                    agentId(deal),
                    clientName(deal),
                    agentName(deal),
                    "Lead chaud sans contact depuis " + daysSince(deal.getLastInteractionAt()) + "j",
                    "warn",
                    "STALE_HOT_DEAL"
            ));
        }

        for (Contract contract : contractRepository.findStaleSentContracts(ContractStatus.SENT, staleThreshold)) {
            long days = ChronoUnit.DAYS.between(contract.getSentAt(), LocalDateTime.now());
            Deal deal = contract.getDeal();
            alerts.add(new AdminAlertDto(
                    "contract:" + contract.getIdContract(),
                    agentId(deal),
                    clientName(deal),
                    agentName(deal),
                    "Contrat en attente de signature depuis " + days + "j",
                    "warn",
                    "STALE_CONTRACT"
            ));
        }

        return alerts.stream().limit(10).toList();
    }

    private String clientName(Deal deal) {
        if (deal.getClientFolder() == null || deal.getClientFolder().getClient() == null) {
            return "Client inconnu";
        }
        var c = deal.getClientFolder().getClient();
        return c.getFirstName() + " " + c.getLastName();
    }

    private String agentName(Deal deal) {
        if (deal.getClientFolder() == null || deal.getClientFolder().getAssignedAgent() == null) {
            return "Non assigné";
        }
        var a = deal.getClientFolder().getAssignedAgent();
        return a.getFirstName() + " " + a.getLastName();
    }

    private UUID agentId(Deal deal) {
        if (deal == null || deal.getClientFolder() == null || deal.getClientFolder().getAssignedAgent() == null) {
            return null;
        }
        return deal.getClientFolder().getAssignedAgent().getIdUser();
    }

    private record WeekPeriod(int weekNumber, LocalDate start, LocalDate end, String label) {}

    private WeekPeriod resolveWeekPeriod(LocalDate today, int weekOffset) {
        LocalDate ref = today.plusWeeks(weekOffset);
        LocalDate weekStart = ref.with(TemporalAdjusters.previousOrSame(WEEK_FIELDS.getFirstDayOfWeek()));
        LocalDate weekEnd = weekStart.plusDays(6);
        int weekNumber = ref.get(WEEK_FIELDS.weekOfWeekBasedYear());

        String rangeLabel = weekStart.getMonth() == weekEnd.getMonth()
                ? weekStart.format(PERIOD_DAY_FMT) + " – " + weekEnd.format(PERIOD_DAY_YEAR_FMT)
                : weekStart.format(PERIOD_DAY_FMT) + " – " + weekEnd.format(PERIOD_DAY_YEAR_FMT);

        String label = "Semaine " + weekNumber + " · " + rangeLabel;
        return new WeekPeriod(weekNumber, weekStart, weekEnd, label);
    }

    private int daysSince(LocalDateTime dateTime) {
        if (dateTime == null) return 99;
        return (int) ChronoUnit.DAYS.between(dateTime, LocalDateTime.now());
    }

    private String formatDelta(long current, long previous) {
        long diff = current - previous;
        if (diff == 0) return "0";
        return (diff > 0 ? "+" : "") + diff;
    }

    private String formatPercentChange(long current, long previous) {
        if (previous == 0) {
            return current > 0 ? "+100%" : "0%";
        }
        double pct = Math.round(1000.0 * (current - previous) / previous) / 10.0;
        if (pct == 0) return "0%";
        return (pct > 0 ? "+" : "") + pct + "%";
    }

    private String formatPercentPointDelta(double current, double previous) {
        double diff = Math.round((current - previous) * 10) / 10.0;
        if (diff == 0) return "0pt";
        return (diff > 0 ? "+" : "") + diff + "pt";
    }

    private String getRelativeTime(LocalDateTime dateTime) {
        if (dateTime == null) return "aucune activité";
        LocalDateTime now = LocalDateTime.now();
        long days = ChronoUnit.DAYS.between(dateTime, now);
        if (days < 0) return "à venir";
        if (days == 0) {
            long hours = ChronoUnit.HOURS.between(dateTime, now);
            if (hours <= 0) {
                long minutes = ChronoUnit.MINUTES.between(dateTime, now);
                return minutes <= 0 ? "à l'instant" : "il y a " + minutes + " min";
            }
            return "il y a " + hours + "h";
        }
        if (days == 1) return "hier";
        return "il y a " + days + "j";
    }
}
