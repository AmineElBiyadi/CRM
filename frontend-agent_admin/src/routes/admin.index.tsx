import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { NeuCard } from "@/components/ui/neu-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, SoftBadge } from "@/components/ui/design-bits";
import { pipelineStages } from "@/lib/mock-data";
import { useAdminDashboard, useNotifyAdminAlert } from "@/hooks/useDashboard";
import { getUser } from "@/lib/auth";
import { getAdminDashboardErrorUi } from "@/lib/api-error";
import type { AdminAlertDto } from "@/api/adminDashboardApi";
import {
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  AlertTriangle,
  FileDown,
  FileText,
  Snowflake,
  CheckCircle2,
  ShieldAlert,
  LogIn,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/")({
  pendingComponent: AdminDashboardLoading,
  component: AdminDashboard,
});

const STAGE_COLORS: Record<string, string> = Object.fromEntries(
  pipelineStages.map((s) => [s.key, s.color]),
);

function AdminDashboard() {
  const [targetWeekOffset, setTargetWeekOffset] = useState(0);
  const [queryWeekOffset, setQueryWeekOffset] = useState(0);
  const { data, isLoading, isFetching, isError, error, refetch } = useAdminDashboard(queryWeekOffset);
  const notifyAlert = useNotifyAdminAlert();
  const [notifyingId, setNotifyingId] = useState<string | null>(null);
  const isChangingWeek = isFetching && !isLoading;
  const isCalculatingWeek = isChangingWeek || targetWeekOffset !== queryWeekOffset;

  useEffect(() => {
    const timeout = window.setTimeout(() => setQueryWeekOffset(targetWeekOffset), 280);
    return () => window.clearTimeout(timeout);
  }, [targetWeekOffset]);

  async function handleNotifyAgent(alert: AdminAlertDto) {
    if (!alert.agentId) {
      toast.error("Aucun agent assigné à ce dossier.");
      return;
    }
    setNotifyingId(alert.alertId);
    try {
      await notifyAlert.mutateAsync({
        agentId: alert.agentId,
        clientName: alert.clientName,
        reason: alert.reason,
        alertType: alert.alertType,
        alertId: alert.alertId,
      });
      toast.success(`Notification envoyée à ${alert.agentName}.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Échec de l'envoi.");
    } finally {
      setNotifyingId(null);
    }
  }

  if (isLoading && !data) {
    return <AdminDashboardLoading />;
  }

  if (isError || !data) {
    const cached = getUser();
    const ui = getAdminDashboardErrorUi(error, cached?.role);
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center max-w-[520px] mx-auto min-h-[400px]">
        <div className="w-14 h-14 rounded-2xl neu-sm flex items-center justify-center mb-5 bg-destructive/10">
          <ShieldAlert className="text-destructive" size={28} strokeWidth={1.8} />
        </div>
        <h2 className="text-xl font-bold text-eerie mb-2">{ui.title}</h2>
        <p className="text-foreground/90 mb-2">{ui.message}</p>
        {ui.hint ? (
          <p className="text-sm text-muted-foreground mb-6 leading-relaxed">{ui.hint}</p>
        ) : (
          <div className="mb-6" />
        )}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => refetch()}
            className="px-4 py-2 bg-eerie text-ghost rounded-xl hover:opacity-90 transition-opacity text-sm font-medium"
          >
            Réessayer
          </button>
          {ui.showLogin ? (
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm font-medium hover:bg-muted/40 transition-colors"
            >
              <LogIn size={16} />
              Se connecter
            </Link>
          ) : null}
        </div>
      </div>
    );
  }

  const { kpis, pipeline, totalDossiers, agents, alerts, adminFirstName, periodLabel } = data;

  const kpiCards = [
    {
      label: "Dossiers actifs",
      value: String(kpis.activeDossiers),
      trend: kpis.activeDossiersTrend,
      up: kpis.activeDossiersUp,
      icon: TrendingUp,
      tone: "bg-alice",
    },
    {
      label: "Clôturés ce mois",
      value: String(kpis.closedThisMonth),
      trend: kpis.closedThisMonthTrend,
      up: kpis.closedThisMonthUp,
      icon: CheckCircle2,
      tone: "bg-honeydew",
    },
    {
      label: "Leads froids",
      value: String(kpis.coldLeads),
      trend: kpis.coldLeadsTrend,
      up: kpis.coldLeadsUp,
      icon: Snowflake,
      tone: "bg-vanilla",
    },
    {
      label: "Taux conversion",
      value: `${kpis.conversionRatePercent}%`,
      trend: kpis.conversionTrend,
      up: kpis.conversionUp,
      icon: TrendingUp,
      tone: "bg-alice",
    },
  ];

  const pipelineByKey = Object.fromEntries(pipeline.map((s) => [s.key, s]));

  return (
    <div className="space-y-6 md:space-y-8 max-w-[1400px]">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Bonjour {adminFirstName} 👋</p>
          <h1 className="text-2xl md:text-3xl font-bold mt-1">Vue d'ensemble de l'agence</h1>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label="Semaine précédente"
              onClick={() => setTargetWeekOffset((w) => w - 1)}
              className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="relative text-xs text-muted-foreground min-w-[180px] text-center">
              <span className={isCalculatingWeek ? "opacity-60 transition-opacity" : "transition-opacity"}>
                {periodLabel}
              </span>
              {isCalculatingWeek ? (
                <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[9px] uppercase tracking-widest text-muted-foreground">
                  Mise Ã  jour
                </span>
              ) : null}
            </span>
            <button
              type="button"
              aria-label="Semaine suivante"
              disabled={targetWeekOffset >= 0}
              onClick={() => setTargetWeekOffset((w) => Math.min(0, w + 1))}
              className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors disabled:opacity-30"
            >
              <ChevronRight size={16} />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setTargetWeekOffset((w) => w - 10)}
              className="text-[10px] font-medium px-2 py-1 rounded-lg hover:bg-muted/50 transition-colors"
            >
              -10 semaines
            </button>
            <button
              type="button"
              onClick={() => setTargetWeekOffset(0)}
              disabled={targetWeekOffset === 0}
              className="text-[10px] font-medium px-2 py-1 rounded-lg hover:bg-muted/50 transition-colors disabled:opacity-30"
            >
              Aujourd'hui
            </button>
          </div>
          <span className="text-[10px] text-muted-foreground">KPIs : mois en cours · période affichée : semaine</span>
        </div>
      </div>

      <div
        key={`kpis-${periodLabel}`}
        className={`grid grid-cols-2 lg:grid-cols-4 gap-5 transition-all duration-300 ${
          isChangingWeek ? "opacity-70 translate-y-0.5" : "opacity-100 translate-y-0 animate-in fade-in slide-in-from-bottom-2"
        }`}
        aria-busy={isChangingWeek}
      >
        {kpiCards.map((k) => {
          const Icon = k.icon;
          return (
            <NeuCard key={k.label}>
              <div className="flex items-start justify-between">
                <div className={`w-10 h-10 rounded-xl ${k.tone} flex items-center justify-center`}>
                  <Icon size={18} strokeWidth={1.8} />
                </div>
                <span
                  className={`text-xs flex items-center gap-1 font-medium ${k.up ? "text-[oklch(0.55_0.15_145)]" : "text-destructive"}`}
                >
                  {k.up ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />} {k.trend}
                </span>
              </div>
              <div className="mt-5">
                <div className="text-3xl font-bold tracking-tight">
                  <CalculatingValue value={k.value} loading={isCalculatingWeek} />
                </div>
                <div className="text-xs text-muted-foreground mt-1">{k.label}</div>
              </div>
            </NeuCard>
          );
        })}
      </div>

      <NeuCard
        key={`pipeline-${periodLabel}`}
        className={`transition-all duration-300 ${
          isChangingWeek ? "opacity-70" : "opacity-100 animate-in fade-in slide-in-from-bottom-2"
        }`}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-semibold">Pipeline — vue macro</h2>
          <span className="text-xs text-muted-foreground">{totalDossiers} dossiers répartis</span>
        </div>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {pipelineStages.map((s) => {
            const stage = pipelineByKey[s.key];
            const count = stage?.count ?? 0;
            return (
              <Link
                key={s.key}
                to="/admin/pipeline"
                className="neu-inset p-3 rounded-xl block hover:neu-sm transition-all"
              >
                <div className={`h-1.5 rounded-full ${STAGE_COLORS[s.key] ?? s.color} mb-3`} />
                <div className="text-xs text-muted-foreground">{stage?.label ?? s.label}</div>
                <div className="text-xl md:text-2xl font-bold mt-1">
                  <CalculatingValue value={String(count)} loading={isCalculatingWeek} size="sm" />
                </div>
              </Link>
            );
          })}
        </div>
      </NeuCard>

      <div
        key={`lists-${periodLabel}`}
        className={`grid lg:grid-cols-2 gap-6 transition-all duration-300 ${
          isChangingWeek ? "opacity-70 translate-y-0.5" : "opacity-100 translate-y-0 animate-in fade-in slide-in-from-bottom-2"
        }`}
      >
        <NeuCard>
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold">Performances agents</h2>
            <Link to="/admin/agents" className="text-xs text-muted-foreground hover:text-eerie">
              Voir tout →
            </Link>
          </div>
          {agents.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Aucun agent enregistré.</p>
          ) : (
            <div className="space-y-3">
              {agents.slice(0, 5).map((a) => (
                <div
                  key={a.id}
                  className={`flex items-center gap-4 p-3 rounded-xl hover:bg-alice/40 cursor-pointer transition-colors ${!a.active ? "opacity-60" : ""}`}
                >
                  <Avatar name={a.name} size={40} />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{a.name}</div>
                    <div className="text-xs text-muted-foreground">{a.lastActivity}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-bold">{a.activeClients}</div>
                    <div className="text-[10px] text-muted-foreground uppercase">Actifs</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-bold text-[oklch(0.55_0.15_145)]">{a.closedThisMonth}</div>
                    <div className="text-[10px] text-muted-foreground uppercase">Clôt.</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </NeuCard>

        <NeuCard>
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold flex items-center gap-2">
              <AlertTriangle size={16} /> Alertes & actions
            </h2>
            {alerts.length > 0 && <SoftBadge tone="warn">{alerts.length}</SoftBadge>}
          </div>
          {alerts.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Aucune alerte pour le moment.</p>
          ) : (
            <div className="space-y-3">
              {alerts.map((a) => (
                <div key={a.alertId} className="p-4 neu-sm rounded-xl">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{a.clientName}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">Agent : {a.agentName}</div>
                      <div className="text-xs mt-2">{a.reason}</div>
                    </div>
                    <SoftBadge tone={a.tone === "danger" ? "danger" : "warn"}>!</SoftBadge>
                  </div>
                  <button
                    type="button"
                    disabled={!a.agentId || notifyingId === a.alertId}
                    onClick={() => handleNotifyAgent(a)}
                    className="mt-3 text-xs font-medium px-3 py-1.5 rounded-lg neu-sm hover:neu-pressable disabled:opacity-50"
                  >
                    {notifyingId === a.alertId ? "Envoi…" : "Alerter l'agent"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </NeuCard>
      </div>

      <NeuCard
        key={`report-${periodLabel}`}
        className={`bg-alice/40 flex flex-col md:flex-row gap-6 items-center transition-all duration-300 ${
          isChangingWeek ? "opacity-70" : "opacity-100 animate-in fade-in slide-in-from-bottom-2"
        }`}
      >
        <div className="w-14 h-14 rounded-2xl bg-vanilla flex items-center justify-center shrink-0">
          <FileText size={22} strokeWidth={1.8} />
        </div>
        <div className="flex-1">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Rapport hebdomadaire IA</div>
          <h3 className="font-bold text-lg mt-1">Synthèse {periodLabel.split("·")[0]?.trim()} disponible</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {totalDossiers} dossiers · {kpis.closedThisMonth} clôtures ce mois · {alerts.length} alerte(s)
          </p>
        </div>
        <button
          onClick={() => toast.success("Téléchargement du rapport hebdomadaire…")}
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-eerie text-ghost text-sm font-medium hover:opacity-90"
        >
          <FileDown size={16} /> Télécharger PDF
        </button>
      </NeuCard>
    </div>
  );
}

function AdminDashboardLoading() {
  return (
    <div className="space-y-6 md:space-y-8 max-w-[1400px]" aria-busy="true">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Skeleton className="h-4 w-32" />
          <Skeleton className="mt-3 h-8 w-64 rounded-lg" />
        </div>
        <div className="flex flex-col items-end gap-2">
          <Skeleton className="h-6 w-56 rounded-full" />
          <Skeleton className="h-3 w-40" />
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {[1, 2, 3, 4].map((i) => (
          <NeuCard key={i} className="h-[164px] flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <Skeleton className="h-10 w-10 rounded-xl opacity-70" />
              <Skeleton className="h-4 w-14 rounded-full opacity-70" />
            </div>
            <div>
              <Skeleton className="h-8 w-16 rounded-lg" />
              <Skeleton className="mt-3 h-3 w-28" />
            </div>
          </NeuCard>
        ))}
      </div>

      <NeuCard>
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-5 w-44" />
          <Skeleton className="h-3 w-28" />
        </div>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="neu-inset p-3 rounded-xl h-24">
              <Skeleton className="h-1.5 w-full rounded-full mb-4" />
              <Skeleton className="h-3 w-16" />
              <Skeleton className="mt-3 h-7 w-10 rounded-lg" />
            </div>
          ))}
        </div>
      </NeuCard>

      <div className="grid lg:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <NeuCard key={i} className="h-72">
            <div className="mb-6 flex items-center justify-between">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-16 rounded-full" />
            </div>
            <div className="space-y-3">
              {[1, 2, 3].map((row) => (
                <div key={row} className="flex items-center gap-4 rounded-xl p-3 neu-sm shadow-none">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                  <Skeleton className="h-6 w-10 rounded-lg" />
                </div>
              ))}
            </div>
          </NeuCard>
        ))}
      </div>
    </div>
  );
}

function CalculatingValue({
  value,
  loading,
  size = "md",
}: {
  value: string;
  loading: boolean;
  size?: "sm" | "md";
}) {
  if (!loading) return <>{value}</>;

  const dotClass = size === "sm" ? "h-1.5 w-1.5" : "h-2 w-2";

  return (
    <span className="inline-flex min-w-[2.5ch] items-center gap-1 align-middle" aria-label="Calcul en cours">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={`${dotClass} rounded-full bg-current opacity-70 animate-bounce`}
          style={{ animationDelay: `${i * 120}ms` }}
        />
      ))}
    </span>
  );
}
