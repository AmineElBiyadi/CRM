package com.smartestatehub.crm.service;

import com.smartestatehub.auth.model.DeletionReason;
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
import org.springframework.security.crypto.password.PasswordEncoder;
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
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
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
    private final PasswordEncoder passwordEncoder;
    private final DealService dealService;

    @Transactional(readOnly = true)
    public List<AdminAgentDto> getAgents(String sortBy, String direction) {
        boolean ascending = "asc".equalsIgnoreCase(direction);
        Comparator<AdminAgentDto> comparator = switch (sortBy == null ? "" : sortBy.toLowerCase(Locale.ROOT)) {
            case "closed" -> Comparator.comparingLong(AdminAgentDto::closedThisMonth);
            case "status" -> Comparator.comparing(AdminAgentDto::active);
            case "name" -> Comparator.comparing(AdminAgentDto::name, String.CASE_INSENSITIVE_ORDER);
            case "activity" -> Comparator.comparing(
                    AdminAgentDto::lastActivity,
                    Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER)
            );
            default -> Comparator.comparingLong(AdminAgentDto::activeClients);
        };
        if (!ascending) {
            comparator = comparator.reversed();
        }
        Comparator<AdminAgentDto> tieBreaker = Comparator.comparing(
                AdminAgentDto::name,
                String.CASE_INSENSITIVE_ORDER
        );
        if (!ascending) {
            tieBreaker = tieBreaker.reversed();
        }

        return userRepository.findByRoleOrderByLastNameAsc(Role.AGENT).stream()
                .map(this::toAdminAgentDto)
                .sorted(comparator.thenComparing(tieBreaker))
                .toList();
    }

    @Transactional(readOnly = true)
    public AdminAgentDetailDto getAgentDetail(UUID agentId) {
        InternalUser agent = findAgent(agentId);
        List<Deal> deals = dealRepository.findActiveDossiersByAgentId(agentId);

        Map<String, Long> stageCounts = new LinkedHashMap<>();
        stageCounts.put("froid", countStage(deals, DealStage.COLD));
        stageCounts.put("tiede", countStage(deals, DealStage.WARM));
        stageCounts.put("chaud", countStage(deals, DealStage.HOT));
        stageCounts.put("negociation", countStage(deals, DealStage.NEGOTIATION));
        stageCounts.put("cloture", countStage(deals, DealStage.CLOSED));
        stageCounts.put("perdu", countStage(deals, DealStage.LOST));

        List<AdminAgentDossierDto> dossiers = deals.stream()
                .sorted(Comparator
                        .comparing((Deal d) -> d.getLastInteractionAt() == null ? LocalDateTime.MIN : d.getLastInteractionAt())
                        .reversed())
                .map(this::toAgentDossierDto)
                .toList();

        long closed = stageCounts.getOrDefault("cloture", 0L);
        long lost = stageCounts.getOrDefault("perdu", 0L);
        long decided = closed + lost;
        double conversionRate = decided == 0 ? 0.0 : (100.0 * closed) / decided;

        return new AdminAgentDetailDto(
                toAdminAgentDto(agent),
                stageCounts,
                dossiers,
                Math.round(conversionRate * 10) / 10.0
        );
    }

    @Transactional
    public AdminAgentDto createAgent(CreateAgentRequest request) {
        String email = request.email().trim().toLowerCase(Locale.ROOT);
        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("Un utilisateur avec cet email existe d\u00e9j\u00e0.");
        }

        InternalUser agent = InternalUser.builder()
                .firstName(cleanRequiredString(request.firstName(), "Le pr\u00e9nom de l'agent est obligatoire."))
                .lastName(cleanRequiredString(request.lastName(), "Le nom de l'agent est obligatoire."))
                .email(email)
                .phone(cleanString(request.phone()))
                .password(passwordEncoder.encode(request.password()))
                .role(Role.AGENT)
                .build();

        if (Boolean.FALSE.equals(request.active())) {
            applyAgentStatus(agent, false);
        }

        return toAdminAgentDto(userRepository.save(agent));
    }

    @Transactional
    public AdminAgentDto updateAgent(UUID agentId, UpdateAgentRequest request) {
        InternalUser agent = findAgent(agentId);
        String email = request.email().trim().toLowerCase(Locale.ROOT);
        userRepository.findByEmail(email)
                .filter(existing -> !existing.getIdUser().equals(agentId))
                .ifPresent(existing -> {
                    throw new IllegalArgumentException("Un utilisateur avec cet email existe d\u00e9j\u00e0.");
                });

        agent.setFirstName(cleanRequiredString(request.firstName(), "Le pr\u00e9nom de l'agent est obligatoire."));
        agent.setLastName(cleanRequiredString(request.lastName(), "Le nom de l'agent est obligatoire."));
        agent.setEmail(email);
        agent.setPhone(cleanString(request.phone()));
        applyAgentStatus(agent, Boolean.TRUE.equals(request.active()));

        return toAdminAgentDto(userRepository.save(agent));
    }

    @Transactional
    public AdminAgentDto updateAgentStatus(UUID agentId, UpdateAgentStatusRequest request, String adminEmail) {
        InternalUser agent = findAgent(agentId);
        applyAgentStatus(agent, Boolean.TRUE.equals(request.active()));

        if (!Boolean.TRUE.equals(request.active()) && adminEmail != null) {
            userRepository.findByEmail(adminEmail).ifPresent(agent::setDeletedBy);
        }

        return toAdminAgentDto(userRepository.save(agent));
    }

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

    @Transactional(readOnly = true)
    public AdminPipelineDto getAdminPipeline(UUID agentId) {
        List<Deal> deals = agentId == null
                ? dealRepository.findAllPipelineDeals()
                : dealRepository.findPipelineDealsByAgent(agentId);

        List<AdminPipelineDealDto> dealDtos = deals.stream()
                .map(this::toPipelineDealDto)
                .toList();

        List<AdminPipelineStageDto> stages = List.of(
                stageDto("froid", "Froid", DealStage.COLD),
                stageDto("tiede", "Tiède", DealStage.WARM),
                stageDto("chaud", "Chaud", DealStage.HOT),
                stageDto("negociation", "Négociation", DealStage.NEGOTIATION),
                stageDto("cloture", "Clôturé", DealStage.CLOSED),
                stageDto("perdu", "Perdu", DealStage.LOST)
        );

        if (agentId != null) {
            stages = List.of(
                    pipelineStageCount("froid", "Froid", DealStage.COLD, dealDtos),
                    pipelineStageCount("tiede", "Tiède", DealStage.WARM, dealDtos),
                    pipelineStageCount("chaud", "Chaud", DealStage.HOT, dealDtos),
                    pipelineStageCount("negociation", "Négociation", DealStage.NEGOTIATION, dealDtos),
                    pipelineStageCount("cloture", "Clôturé", DealStage.CLOSED, dealDtos),
                    pipelineStageCount("perdu", "Perdu", DealStage.LOST, dealDtos)
            );
        }

        return new AdminPipelineDto(dealDtos.size(), stages, dealDtos);
    }

    @Transactional(readOnly = true)
    public AdminAnalyticsDto getAdminAnalytics(String periodType, Integer year, Integer month) {
        LocalDate today = LocalDate.now();
        int selectedYear = year != null ? year : today.getYear();
        String normalizedPeriod = "month".equalsIgnoreCase(periodType) ? "month" : "year";
        Integer selectedMonth = normalizedPeriod.equals("month")
                ? (month != null ? month : today.getMonthValue())
                : null;

        List<Integer> availableYears = buildAvailableYears(today.getYear());
        selectedYear = clampYear(selectedYear, availableYears);

        List<AdminAnalyticsMonthDto> conversionSeries;
        String conversionTitle;
        if ("month".equals(normalizedPeriod)) {
            selectedMonth = clampMonth(selectedMonth, selectedYear, today);
            conversionSeries = buildConversionByWeeks(selectedYear, selectedMonth);
            conversionTitle = "Conversion des leads — " + capitalizeMonthLabel(selectedYear, selectedMonth);
        } else {
            conversionSeries = buildConversionByYear(selectedYear);
            conversionTitle = "Conversion des leads — " + selectedYear;
        }

        List<AdminAnalyticsFunnelDto> funnel = buildFunnel();
        long averageDaysToClose = computeAverageDaysToClose();
        List<AdminAnalyticsSourceDto> acquisitionSources = buildAcquisitionSources();
        AdminAnalyticsTopAgentDto topAgent = buildTopAgent();

        return new AdminAnalyticsDto(
                conversionSeries,
                normalizedPeriod,
                selectedYear,
                selectedMonth,
                conversionTitle,
                availableYears,
                funnel,
                averageDaysToClose,
                acquisitionSources,
                topAgent
        );
    }

    private List<Integer> buildAvailableYears(int currentYear) {
        LocalDateTime earliest = dealRepository.findEarliestDealCreatedAt();
        int startYear = earliest != null ? earliest.getYear() : currentYear;
        if (startYear > currentYear) {
            startYear = currentYear;
        }

        List<Integer> years = new ArrayList<>();
        for (int y = currentYear; y >= startYear; y--) {
            years.add(y);
        }
        if (years.isEmpty()) {
            years.add(currentYear);
        }
        return years;
    }

    private int clampYear(int year, List<Integer> availableYears) {
        if (availableYears.contains(year)) {
            return year;
        }
        return availableYears.get(0);
    }

    private int clampMonth(Integer month, int year, LocalDate today) {
        int value = month != null ? month : today.getMonthValue();
        if (value < 1) return 1;
        if (value > 12) return 12;
        if (year == today.getYear() && value > today.getMonthValue()) {
            return today.getMonthValue();
        }
        return value;
    }

    private List<AdminAnalyticsMonthDto> buildConversionByYear(int year) {
        DateTimeFormatter monthFmt = DateTimeFormatter.ofPattern("MMM", Locale.FRENCH);
        List<AdminAnalyticsMonthDto> result = new ArrayList<>();

        for (int month = 1; month <= 12; month++) {
            LocalDate monthStart = LocalDate.of(year, month, 1);
            LocalDateTime from = monthStart.atStartOfDay();
            LocalDateTime to = monthStart.plusMonths(1).atStartOfDay();
            result.add(buildConversionPoint(capitalize(monthStart.format(monthFmt)), from, to));
        }

        return result;
    }

    private List<AdminAnalyticsMonthDto> buildConversionByWeeks(int year, int month) {
        LocalDate monthStart = LocalDate.of(year, month, 1);
        LocalDate monthEnd = monthStart.plusMonths(1);
        List<AdminAnalyticsMonthDto> result = new ArrayList<>();
        LocalDate cursor = monthStart;
        int weekNum = 1;

        while (cursor.isBefore(monthEnd)) {
            LocalDate weekEnd = cursor.plusDays(7);
            if (weekEnd.isAfter(monthEnd)) {
                weekEnd = monthEnd;
            }
            LocalDateTime from = cursor.atStartOfDay();
            LocalDateTime to = weekEnd.atStartOfDay();
            result.add(buildConversionPoint("S" + weekNum, from, to));
            cursor = weekEnd;
            weekNum++;
        }

        return result;
    }

    private AdminAnalyticsMonthDto buildConversionPoint(String label, LocalDateTime from, LocalDateTime to) {
        long closed = dealRepository.countClosedBetween(DealStage.CLOSED, from, to);
        long lost = dealRepository.countClosedBetween(DealStage.LOST, from, to);
        long decided = closed + lost;
        double rate = decided == 0 ? 0.0 : (100.0 * closed) / decided;
        return new AdminAnalyticsMonthDto(label, Math.round(rate * 10) / 10.0);
    }

    private String capitalizeMonthLabel(int year, int month) {
        LocalDate date = LocalDate.of(year, month, 1);
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("MMMM yyyy", Locale.FRENCH);
        return capitalize(date.format(fmt));
    }

    private List<AdminAnalyticsFunnelDto> buildFunnel() {
        long warm = dealRepository.countByDeletedAtIsNullAndStage(DealStage.WARM);
        long hot = dealRepository.countByDeletedAtIsNullAndStage(DealStage.HOT);
        long negotiation = dealRepository.countByDeletedAtIsNullAndStage(DealStage.NEGOTIATION);
        long closed = dealRepository.countByDeletedAtIsNullAndStage(DealStage.CLOSED);

        long leads = dealRepository.countByDeletedAtIsNull();
        long qualified = warm + hot + negotiation + closed;
        long visit = hot + negotiation + closed;
        long nego = negotiation + closed;

        return List.of(
                new AdminAnalyticsFunnelDto("Leads", leads, "alice"),
                new AdminAnalyticsFunnelDto("Qualifiés", qualified, "honeydew"),
                new AdminAnalyticsFunnelDto("Visite", visit, "vanilla"),
                new AdminAnalyticsFunnelDto("Négo.", nego, "accent"),
                new AdminAnalyticsFunnelDto("Clôturés", closed, "success")
        );
    }

    private long computeAverageDaysToClose() {
        List<Deal> closedDeals = dealRepository.findByDeletedAtIsNullAndStage(DealStage.CLOSED);
        if (closedDeals.isEmpty()) {
            return 0L;
        }

        double avg = closedDeals.stream()
                .filter(deal -> deal.getCreatedAt() != null && deal.getUpdatedAt() != null)
                .mapToLong(deal -> Math.max(0, ChronoUnit.DAYS.between(deal.getCreatedAt(), deal.getUpdatedAt())))
                .average()
                .orElse(0.0);

        return Math.round(avg);
    }

    private List<AdminAnalyticsSourceDto> buildAcquisitionSources() {
        List<Object[]> rows = dealRepository.countDealsGroupedByClientSource().stream()
                .sorted((a, b) -> Long.compare(((Number) b[1]).longValue(), ((Number) a[1]).longValue()))
                .toList();
        if (rows.isEmpty()) {
            return List.of();
        }

        long total = rows.stream()
                .mapToLong(row -> ((Number) row[1]).longValue())
                .sum();
        if (total == 0) {
            return List.of();
        }

        String[] colorKeys = {"alice", "honeydew", "vanilla", "muted"};
        List<AdminAnalyticsSourceDto> sources = new ArrayList<>();
        long othersCount = 0L;
        int colorIdx = 0;

        for (int i = 0; i < rows.size(); i++) {
            String rawLabel = rows.get(i)[0] == null ? null : String.valueOf(rows.get(i)[0]).trim();
            String label = (rawLabel == null || rawLabel.isBlank()) ? "Non renseigné" : rawLabel;
            long count = ((Number) rows.get(i)[1]).longValue();

            if (i < 3) {
                int percent = (int) Math.round(100.0 * count / total);
                sources.add(new AdminAnalyticsSourceDto(
                        label,
                        percent,
                        colorKeys[Math.min(colorIdx, colorKeys.length - 1)]
                ));
                colorIdx++;
            } else {
                othersCount += count;
            }
        }

        if (rows.size() > 3 && othersCount > 0) {
            int percent = (int) Math.round(100.0 * othersCount / total);
            sources.add(new AdminAnalyticsSourceDto("Autres", percent, "muted"));
        }

        int sum = sources.stream().mapToInt(AdminAnalyticsSourceDto::percent).sum();
        if (!sources.isEmpty() && sum != 100) {
            AdminAnalyticsSourceDto last = sources.get(sources.size() - 1);
            sources.set(sources.size() - 1, new AdminAnalyticsSourceDto(
                    last.label(),
                    last.percent() + (100 - sum),
                    last.colorKey()
            ));
        }

        return sources;
    }

    private AdminAnalyticsTopAgentDto buildTopAgent() {
        LocalDate monthStart = LocalDate.now().withDayOfMonth(1);
        LocalDateTime from = monthStart.atStartOfDay();
        LocalDateTime to = monthStart.plusMonths(1).atStartOfDay();
        String periodLabel = capitalizeMonthLabel(monthStart.getYear(), monthStart.getMonthValue());
        LocalDateTime recentThreshold = LocalDateTime.now().minusDays(7);

        List<InternalUser> agents = userRepository.findByRoleAndDeletedAtIsNullOrderByLastNameAsc(Role.AGENT);
        if (agents.isEmpty()) {
            return new AdminAnalyticsTopAgentDto("—", 0L, 0.0, 0L, 0.0, 0, periodLabel,
                    "Aucun agent actif dans l'agence.");
        }

        List<AgentPerformanceCandidate> candidates = new ArrayList<>();
        long maxClosed = 0L;
        long maxActive = 0L;

        for (InternalUser agent : agents) {
            UUID agentId = agent.getIdUser();
            long closedThisMonth = dealRepository.countAgentClosedBetween(
                    agentId, DealStage.CLOSED, from, to);
            long activeClients = dealRepository.countByClientFolder_AssignedAgent_IdUserAndStageNotInAndDeletedAtIsNull(
                    agentId, TERMINAL_STAGES);

            List<Deal> agentDeals = dealRepository.findActiveDossiersByAgentId(agentId);
            long closedTotal = agentDeals.stream().filter(d -> d.getStage() == DealStage.CLOSED).count();
            long lostTotal = agentDeals.stream().filter(d -> d.getStage() == DealStage.LOST).count();
            long decided = closedTotal + lostTotal;
            double conversion = decided == 0 ? 0.0 : (100.0 * closedTotal) / decided;

            LocalDateTime lastInteraction = dealRepository.findLatestInteractionByAgent(agentId);
            boolean activeRecently = lastInteraction != null && lastInteraction.isAfter(recentThreshold);

            maxClosed = Math.max(maxClosed, closedThisMonth);
            maxActive = Math.max(maxActive, activeClients);

            candidates.add(new AgentPerformanceCandidate(
                    agent,
                    closedThisMonth,
                    conversion,
                    activeClients,
                    activeRecently
            ));
        }

        final long maxClosedFinal = maxClosed;
        final long maxActiveFinal = maxActive;

        AgentPerformanceCandidate best = candidates.get(0);
        double bestScore = -1.0;

        for (AgentPerformanceCandidate candidate : candidates) {
            candidate.compositeScore = computeAgentCompositeScore(
                    candidate,
                    maxClosedFinal,
                    maxActiveFinal
            );

            if (candidate.compositeScore > bestScore
                    || (candidate.compositeScore == bestScore && candidate.closedThisMonth > best.closedThisMonth)
                    || (candidate.compositeScore == bestScore
                            && candidate.closedThisMonth == best.closedThisMonth
                            && candidate.conversion > best.conversion)
                    || (candidate.compositeScore == bestScore
                            && candidate.closedThisMonth == best.closedThisMonth
                            && candidate.conversion == best.conversion
                            && candidate.activeClients > best.activeClients)) {
                best = candidate;
                bestScore = candidate.compositeScore;
            }
        }

        int progress = (int) Math.min(100, Math.round(best.compositeScore));

        if (best.compositeScore <= 0) {
            return new AdminAnalyticsTopAgentDto(
                    best.agent.getFirstName() + " " + best.agent.getLastName(),
                    best.closedThisMonth,
                    Math.round(best.conversion * 10) / 10.0,
                    best.activeClients,
                    0.0,
                    0,
                    periodLabel,
                    "Aucune performance significative ce mois-ci."
            );
        }

        return new AdminAnalyticsTopAgentDto(
                best.agent.getFirstName() + " " + best.agent.getLastName(),
                best.closedThisMonth,
                Math.round(best.conversion * 10) / 10.0,
                best.activeClients,
                Math.round(best.compositeScore * 10) / 10.0,
                progress,
                periodLabel,
                buildTopAgentReason(best)
        );
    }

    private double computeAgentCompositeScore(
            AgentPerformanceCandidate candidate,
            long maxClosed,
            long maxActive
    ) {
        double closedNorm = maxClosed == 0 ? 0.0 : (40.0 * candidate.closedThisMonth) / maxClosed;
        double conversionNorm = (25.0 * candidate.conversion) / 100.0;
        double activeNorm = maxActive == 0 ? 0.0 : (20.0 * candidate.activeClients) / maxActive;
        double recentNorm = candidate.activeRecently ? 15.0 : 0.0;
        return closedNorm + conversionNorm + activeNorm + recentNorm;
    }

    private String buildTopAgentReason(AgentPerformanceCandidate candidate) {
        List<String> strengths = new ArrayList<>();
        if (candidate.closedThisMonth > 0) {
            strengths.add(candidate.closedThisMonth + " clôture(s) ce mois");
        }
        if (candidate.conversion >= 20) {
            strengths.add("conversion " + Math.round(candidate.conversion * 10) / 10.0 + "%");
        }
        if (candidate.activeClients > 0) {
            strengths.add(candidate.activeClients + " dossier(s) actif(s)");
        }
        if (candidate.activeRecently) {
            strengths.add("activité récente (< 7 j)");
        }

        if (strengths.isEmpty()) {
            return "Meilleur score global sur la période.";
        }
        return "Meilleur score global : " + String.join(" · ", strengths);
    }

    @Transactional
    public DossierDetailDto updateDealStage(UUID id, DealStage stage, String adminEmail) {
        UUID adminId = null;
        if (adminEmail != null) {
            adminId = userRepository.findByEmail(adminEmail)
                    .map(InternalUser::getIdUser)
                    .orElse(null);
        }
        return dealService.updateDealStage(id, stage, adminId);
    }

    private static class AgentPerformanceCandidate {
        private final InternalUser agent;
        private final long closedThisMonth;
        private final double conversion;
        private final long activeClients;
        private final boolean activeRecently;
        private double compositeScore;

        private AgentPerformanceCandidate(
                InternalUser agent,
                long closedThisMonth,
                double conversion,
                long activeClients,
                boolean activeRecently
        ) {
            this.agent = agent;
            this.closedThisMonth = closedThisMonth;
            this.conversion = conversion;
            this.activeClients = activeClients;
            this.activeRecently = activeRecently;
        }
    }

    private String capitalize(String value) {
        if (value == null || value.isBlank()) {
            return value;
        }
        return value.substring(0, 1).toUpperCase(Locale.FRENCH) + value.substring(1);
    }

    private AdminPipelineStageDto pipelineStageCount(
            String key,
            String label,
            DealStage stage,
            List<AdminPipelineDealDto> deals
    ) {
        long count = deals.stream().filter(d -> d.stage() == stage).count();
        return new AdminPipelineStageDto(key, label, count);
    }

    private AdminPipelineDealDto toPipelineDealDto(Deal deal) {
        var folder = deal.getClientFolder();
        var client = folder.getClient();
        var agent = folder.getAssignedAgent();

        String agentName = agent != null
                ? agent.getFirstName() + " " + agent.getLastName()
                : "Non assigné";

        return new AdminPipelineDealDto(
                deal.getIdDeal(),
                folder.getIdProfile(),
                client.getFirstName() + " " + client.getLastName(),
                folder.getClientType(),
                deal.getStage(),
                stageToKey(deal.getStage()),
                deal.getAiLeadScore(),
                Boolean.TRUE.equals(deal.getIsUrgent()),
                getRelativeTime(deal.getLastInteractionAt()),
                agent != null ? agent.getIdUser() : null,
                agentName
        );
    }

    private String stageToKey(DealStage stage) {
        return switch (stage) {
            case COLD -> "froid";
            case WARM -> "tiede";
            case HOT -> "chaud";
            case NEGOTIATION -> "negociation";
            case CLOSED -> "cloture";
            case LOST -> "perdu";
        };
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
    private AdminAgentDto toAdminAgentDto(InternalUser agent) {
        UUID agentId = agent.getIdUser();
        LocalDateTime weekStart = LocalDate.now()
                .with(TemporalAdjusters.previousOrSame(WEEK_FIELDS.getFirstDayOfWeek()))
                .atStartOfDay();
        LocalDateTime nextWeekStart = weekStart.plusWeeks(1);

        long activeClients = dealRepository.countByClientFolder_AssignedAgent_IdUserAndStageNotInAndDeletedAtIsNull(
                agentId, TERMINAL_STAGES);
        long closedThisMonth = dealRepository.countAgentClosedBetween(
                agentId, DealStage.CLOSED, weekStart, nextWeekStart);

        return new AdminAgentDto(
                agentId,
                agent.getFirstName(),
                agent.getLastName(),
                agent.getFirstName() + " " + agent.getLastName(),
                agent.getEmail(),
                agent.getPhone(),
                agent.getDeletedAt() == null,
                activeClients,
                closedThisMonth,
                getRelativeTime(dealRepository.findLatestInteractionByAgent(agentId))
        );
    }

    private AdminAgentDossierDto toAgentDossierDto(Deal deal) {
        var folder = deal.getClientFolder();
        var client = folder.getClient();
        return new AdminAgentDossierDto(
                deal.getIdDeal(),
                folder.getIdProfile(),
                client.getFirstName() + " " + client.getLastName(),
                folder.getClientType(),
                deal.getStage(),
                deal.getAiLeadScore(),
                deal.getIsUrgent(),
                deal.getLastInteractionAt(),
                deal.getCreatedAt()
        );
    }

    private long countStage(List<Deal> deals, DealStage stage) {
        return deals.stream().filter(deal -> deal.getStage() == stage).count();
    }

    private InternalUser findAgent(UUID agentId) {
        InternalUser agent = userRepository.findById(agentId)
                .orElseThrow(() -> new IllegalArgumentException("Agent introuvable."));
        if (agent.getRole() != Role.AGENT) {
            throw new IllegalArgumentException("Cet utilisateur n'est pas un agent.");
        }
        return agent;
    }

    private void applyAgentStatus(InternalUser agent, boolean active) {
        if (active) {
            agent.setDeletedAt(null);
            agent.setDeletedBy(null);
            agent.setDeletionReason(null);
        } else if (agent.getDeletedAt() == null) {
            agent.setDeletedAt(LocalDateTime.now());
            agent.setDeletionReason(DeletionReason.OTHER);
        }
    }

    private String cleanString(String value) {
        return value == null ? null : value.trim();
    }

    private String cleanRequiredString(String value, String message) {
        String cleaned = value == null ? "" : value.trim().replaceAll("\\s+", " ");
        if (cleaned.isBlank()) {
            throw new IllegalArgumentException(message);
        }
        return cleaned;
    }
}
