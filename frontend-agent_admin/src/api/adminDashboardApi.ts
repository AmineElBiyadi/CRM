import { ensureAuthenticated } from "@/lib/auth";
import { ApiError } from "@/lib/api-error";
import { apiFetch } from "@/utils/api";
import type { DealStage, DossierDetail } from "./dossiersApi";

export interface AdminKpiDto {
  activeDossiers: number;
  closedThisMonth: number;
  coldLeads: number;
  conversionRatePercent: number;
  activeDossiersTrend: string;
  closedThisMonthTrend: string;
  coldLeadsTrend: string;
  conversionTrend: string;
  activeDossiersUp: boolean;
  closedThisMonthUp: boolean;
  coldLeadsUp: boolean;
  conversionUp: boolean;
}

export interface AdminPipelineStageDto {
  key: string;
  label: string;
  count: number;
}

export interface AdminAgentPerfDto {
  id: string;
  name: string;
  activeClients: number;
  closedThisMonth: number;
  lastActivity: string;
  active: boolean;
}

export interface AdminAgentDto extends AdminAgentPerfDto {
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
}

export interface CreateAgentRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  password: string;
  active: boolean;
}

export interface UpdateAgentRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  active: boolean;
}

export interface AdminAlertDto {
  alertId: string;
  agentId: string | null;
  clientName: string;
  agentName: string;
  reason: string;
  tone: "warn" | "danger";
  alertType: string;
}

export interface AdminDashboardDto {
  adminFirstName: string;
  periodLabel: string;
  periodWeekNumber: number;
  periodStart: string;
  periodEnd: string;
  weekOffset: number;
  kpis: AdminKpiDto;
  pipeline: AdminPipelineStageDto[];
  totalDossiers: number;
  agents: AdminAgentPerfDto[];
  alerts: AdminAlertDto[];
}

export interface AdminAlertNotifyRequest {
  agentId: string;
  clientName: string;
  reason: string;
  alertType?: string;
  alertId?: string;
}

export async function fetchAdminDashboard(weekOffset = 0): Promise<AdminDashboardDto> {
  const user = await ensureAuthenticated();
  if (!user) {
    throw ApiError.client(
      "NOT_AUTHENTICATED",
      "Vous n'êtes pas connecté.",
      "Connectez-vous avec un compte administrateur pour accéder au tableau de bord.",
    );
  }
  if (user.role !== "ADMIN") {
    throw ApiError.client(
      "WRONG_ROLE",
      "Cet espace est réservé aux administrateurs.",
      `Vous êtes connecté en tant qu'${user.role === "AGENT" ? "agent" : "client"} (${user.email}). Déconnectez-vous puis reconnectez-vous avec un compte admin.`,
    );
  }
  const q = weekOffset === 0 ? "" : `?weekOffset=${weekOffset}`;
  return apiFetch(`/api/admin/dashboard${q}`) as Promise<AdminDashboardDto>;
}

export async function notifyAdminAlert(body: AdminAlertNotifyRequest) {
  return apiFetch("/api/admin/dashboard/alerts/notify", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export interface AdminPipelineDealDto {
  idDeal: string;
  idProfile: string;
  clientName: string;
  clientType: "BUYER" | "SELLER";
  stage: string;
  stageKey: string;
  aiLeadScore: number | null;
  urgent: boolean;
  lastInteraction: string;
  agentId: string | null;
  agentName: string;
}

export interface AdminPipelineDto {
  totalDeals: number;
  stages: AdminPipelineStageDto[];
  deals: AdminPipelineDealDto[];
}

export async function fetchAdminPipeline(agentId?: string): Promise<AdminPipelineDto> {
  await requireAdmin();
  const q = agentId ? `?agentId=${encodeURIComponent(agentId)}` : "";
  return apiFetch(`/api/admin/dashboard/pipeline${q}`) as Promise<AdminPipelineDto>;
}

export type AdminAgentSortKey = "workload" | "closed" | "status" | "name" | "activity";
export type AdminAgentSortDirection = "asc" | "desc";

export interface AdminAgentDossierDto {
  idDeal: string;
  idProfile: string;
  clientName: string;
  clientType: "BUYER" | "SELLER";
  stage: string;
  aiLeadScore: number | null;
  urgent: boolean;
  lastInteractionAt: string | null;
  createdAt: string;
}

export interface AdminAgentDetailDto {
  agent: AdminAgentDto;
  stageCounts: Record<string, number>;
  dossiers: AdminAgentDossierDto[];
  conversionRatePercent: number;
}

export async function fetchAdminAgents(
  sortBy: AdminAgentSortKey = "workload",
  direction: AdminAgentSortDirection = "desc",
): Promise<AdminAgentDto[]> {
  await requireAdmin();
  const params = new URLSearchParams({ sortBy, direction });
  return apiFetch(`/api/admin/dashboard/agents?${params}`) as Promise<AdminAgentDto[]>;
}

export async function fetchAdminAgentDetail(agentId: string): Promise<AdminAgentDetailDto> {
  await requireAdmin();
  return apiFetch(`/api/admin/dashboard/agents/${agentId}`) as Promise<AdminAgentDetailDto>;
}

export async function createAdminAgent(body: CreateAgentRequest): Promise<AdminAgentDto> {
  await requireAdmin();
  return apiFetch("/api/admin/dashboard/agents", {
    method: "POST",
    body: JSON.stringify(body),
  }) as Promise<AdminAgentDto>;
}

export async function updateAdminAgent(
  agentId: string,
  body: UpdateAgentRequest,
): Promise<AdminAgentDto> {
  await requireAdmin();
  return apiFetch(`/api/admin/dashboard/agents/${agentId}`, {
    method: "PUT",
    body: JSON.stringify(body),
  }) as Promise<AdminAgentDto>;
}

export async function updateAdminAgentStatus(
  agentId: string,
  active: boolean,
): Promise<AdminAgentDto> {
  await requireAdmin();
  return apiFetch(`/api/admin/dashboard/agents/${agentId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ active }),
  }) as Promise<AdminAgentDto>;
}

export interface AdminAnalyticsMonthDto {
  label: string;
  conversionRatePercent: number;
}

export interface AdminAnalyticsFunnelDto {
  label: string;
  value: number;
  colorKey: string;
}

export interface AdminAnalyticsSourceDto {
  label: string;
  percent: number;
  colorKey: string;
}

export interface AdminAnalyticsTopAgentDto {
  name: string;
  closedCount: number;
  conversionRatePercent: number;
  activeClients: number;
  performanceScore: number;
  progressPercent: number;
  periodLabel: string;
  selectionReason: string;
}

export type AdminAnalyticsPeriodType = "year" | "month";

export interface AdminAnalyticsDto {
  conversionSeries: AdminAnalyticsMonthDto[];
  conversionPeriodType: AdminAnalyticsPeriodType;
  conversionYear: number;
  conversionMonth: number | null;
  conversionTitle: string;
  availableYears: number[];
  funnel: AdminAnalyticsFunnelDto[];
  averageDaysToClose: number;
  acquisitionSources: AdminAnalyticsSourceDto[];
  topAgent: AdminAnalyticsTopAgentDto;
}

export interface AdminAnalyticsParams {
  periodType?: AdminAnalyticsPeriodType;
  year?: number;
  month?: number;
}

export async function fetchAdminAnalytics(
  params: AdminAnalyticsParams = {},
): Promise<AdminAnalyticsDto> {
  await requireAdmin();
  const search = new URLSearchParams();
  search.set("periodType", params.periodType ?? "year");
  if (params.year != null) search.set("year", String(params.year));
  if (params.periodType === "month" && params.month != null) {
    search.set("month", String(params.month));
  }
  const q = search.toString();
  return apiFetch(`/api/admin/dashboard/analytics?${q}`) as Promise<AdminAnalyticsDto>;
}

async function requireAdmin() {
  const user = await ensureAuthenticated();
  if (!user) {
    throw ApiError.client(
      "NOT_AUTHENTICATED",
      "Vous n'Ãªtes pas connectÃ©.",
      "Connectez-vous avec un compte administrateur pour accÃ©der Ã  cette page.",
    );
  }
  if (user.role !== "ADMIN") {
    throw ApiError.client(
      "WRONG_ROLE",
      "Cet espace est rÃ©servÃ© aux administrateurs.",
      `Vous Ãªtes connectÃ© en tant qu'${user.role === "AGENT" ? "agent" : "client"} (${user.email}).`,
    );
  }
}

export async function updateAdminDealStage(id: string, stage: DealStage): Promise<DossierDetail> {
  await requireAdmin();
  return apiFetch(`/api/admin/dashboard/dossiers/${id}/stage?stage=${stage}`, {
    method: "PATCH",
  }) as Promise<DossierDetail>;
}
