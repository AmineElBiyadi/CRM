import { ensureAuthenticated } from "@/lib/auth";
import { ApiError } from "@/lib/api-error";
import { apiFetch } from "@/utils/api";

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
