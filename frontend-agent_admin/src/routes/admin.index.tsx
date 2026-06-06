import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { NeuCard } from "@/components/ui/neu-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, SoftBadge } from "@/components/ui/design-bits";
import { pipelineStages } from "@/lib/mock-data";
import { useAdminDashboard, useNotifyAdminAlert } from "@/hooks/useDashboard";
import { getUser } from "@/lib/auth";
import { getAdminDashboardErrorUi } from "@/lib/api-error";
import { AdminAlertDto, downloadWeeklyReport } from "@/api/adminDashboardApi";
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
  Search,
  Plus,
  Users,
  LayoutGrid,
  Zap,
  KanbanSquare,
  Loader2,
  Sparkles,
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
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const isChangingWeek = isFetching && !isLoading;
  const isCalculatingWeek = isChangingWeek || targetWeekOffset !== queryWeekOffset;

  useEffect(() => {
    const timeout = window.setTimeout(() => setQueryWeekOffset(targetWeekOffset), 280);
    return () => window.clearTimeout(timeout);
  }, [targetWeekOffset]);

  async function handleGenerateReport() {
    setIsGeneratingReport(true);
    const tid = toast.loading("Intelligence Artificielle : Analyse des dossiers et génération du PDF...", { id: "report-gen" });
    
    try {
      const blob = await downloadWeeklyReport();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Rapport_Strategique_${new Date().toLocaleDateString("fr-FR").replace(/\//g, "-")}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success("Rapport hebdomadaire téléchargé !", { id: tid });
    } catch (e: any) {
      toast.error("Erreur lors de la génération : " + e.message, { id: tid });
    } finally {
      setIsGeneratingReport(false);
    }
  }

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
      icon: LayoutGrid,
      tone: "bg-alice",
      accent: "border-alice",
    },
    {
      label: "Clôturés ce mois",
      value: String(kpis.closedThisMonth),
      trend: kpis.closedThisMonthTrend,
      up: kpis.closedThisMonthUp,
      icon: CheckCircle2,
      tone: "bg-honeydew",
      accent: "border-honeydew",
    },
    {
      label: "Leads froids",
      value: String(kpis.coldLeads),
      trend: kpis.coldLeadsTrend,
      up: kpis.coldLeadsUp,
      icon: Snowflake,
      tone: "bg-vanilla",
      accent: "border-vanilla",
    },
    {
      label: "Taux conversion",
      value: `${kpis.conversionRatePercent}%`,
      trend: kpis.conversionTrend,
      up: kpis.conversionUp,
      icon: TrendingUp,
      tone: "bg-alice",
      accent: "border-alice",
    },
  ];

  const pipelineByKey = Object.fromEntries(pipeline.map((s) => [s.key, s]));

  return (
    <div className="space-y-6 md:space-y-10 max-w-[1400px] pb-10">
      {/* Header with Welcome and Time Control */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground animate-in fade-in slide-in-from-left-4 duration-500">
             <span className="text-sm font-medium tracking-wide uppercase">Bonjour, {adminFirstName}</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-eerie animate-in fade-in slide-in-from-left-4 duration-700">
            Tableau de bord <span className="text-muted-foreground/40 font-light">Admin</span>
          </h1>
        </div>

        <div className="flex flex-col items-end gap-3 animate-in fade-in slide-in-from-right-4 duration-700">
          <div className="flex items-center gap-1.5 bg-ghost/50 p-1.5 rounded-2xl neu-inset shadow-none border border-white/40">
            <button
              type="button"
              aria-label="Semaine précédente"
              onClick={() => setTargetWeekOffset((w) => w - 1)}
              className="p-2 rounded-xl hover:bg-white/80 hover:shadow-sm transition-all"
            >
              <ChevronLeft size={18} />
            </button>
            <div className="px-4 min-w-[200px] text-center">
              <span className={`text-sm font-bold block ${isCalculatingWeek ? "opacity-40" : "transition-opacity"}`}>
                {periodLabel}
              </span>
              {isCalculatingWeek && (
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 animate-pulse">
                  Mise à jour...
                </span>
              )}
            </div>
            <button
              type="button"
              aria-label="Semaine suivante"
              disabled={targetWeekOffset >= 0}
              onClick={() => setTargetWeekOffset((w) => Math.min(0, w + 1))}
              className="p-2 rounded-xl hover:bg-white/80 hover:shadow-sm transition-all disabled:opacity-20"
            >
              <ChevronRight size={18} />
            </button>
          </div>
          <div className="flex items-center gap-3">
             <button
                onClick={() => setTargetWeekOffset(0)}
                disabled={targetWeekOffset === 0}
                className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg neu-sm hover:neu-pressable disabled:opacity-30 transition-all"
              >
                Aujourd'hui
              </button>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                KPIs Mensuels · Période : Semaine
              </span>
          </div>
        </div>
      </div>

      {/* Quick Actions Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
         {[
           { label: "Nouvel Agent", icon: Plus, to: "/admin/agents", tone: "bg-eerie text-ghost" },
           { label: "Gérer Pipeline", icon: KanbanSquare, to: "/admin/pipeline", tone: "neu-sm hover:bg-alice/20" },
           { label: "Recherche", icon: Search, to: "/admin/recherche", tone: "neu-sm hover:bg-honeydew/20" }
         ].map((action, i) => (
           <Link 
            key={i}
            to={action.to} 
            className={`flex items-center justify-center gap-3 p-4 rounded-2xl text-sm font-bold transition-all hover:scale-[1.02] active:scale-[0.98] ${action.tone}`}
           >
             <action.icon size={18} />
             {action.label}
           </Link>
         ))}
      </div>

      {/* KPI Section */}
      <div
        key={`kpis-${periodLabel}`}
        className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 transition-all duration-500 ${
          isChangingWeek ? "opacity-50 scale-[0.99]" : "opacity-100 animate-in fade-in slide-in-from-bottom-4"
        }`}
      >
        {kpiCards.map((k, i) => {
          const Icon = k.icon;
          return (
            <NeuCard 
              key={k.label} 
              className={`relative overflow-hidden group border-b-4 ${k.accent} hover:shadow-xl transition-all duration-500`}
            >
              <div className="flex items-start justify-between relative z-10">
                <div className={`w-12 h-12 rounded-2xl ${k.tone} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-500`}>
                  <Icon size={22} strokeWidth={2} />
                </div>
                <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${k.up ? "bg-honeydew/50 text-eerie" : "bg-destructive/10 text-destructive"}`}>
                  {k.up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />} {k.trend}
                </div>
              </div>
              <div className="mt-8 relative z-10">
                <div className="text-4xl font-black tracking-tighter text-eerie">
                  <CalculatingValue value={k.value} loading={isCalculatingWeek} />
                </div>
                <div className="text-xs font-bold text-muted-foreground uppercase tracking-[0.15em] mt-2 opacity-60">{k.label}</div>
              </div>
              {/* Subtle background decoration */}
              <div className={`absolute -right-4 -bottom-4 w-24 h-24 ${k.tone} opacity-10 rounded-full blur-3xl group-hover:opacity-20 transition-opacity`} />
            </NeuCard>
          );
        })}
      </div>

      {/* Main Grid: Pipeline + Performances & Alerts */}
      <div className="grid grid-cols-12 gap-6 md:gap-8">
        {/* Left Column: Pipeline View */}
        <div className="col-span-12 lg:col-span-8 space-y-6 md:space-y-8">
          <NeuCard className="overflow-hidden relative">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-xl font-black text-eerie tracking-tight uppercase">Pipeline Global</h2>
                <p className="text-xs text-muted-foreground mt-1 font-medium">{totalDossiers} dossiers en cours d'analyse</p>
              </div>
              <Link to="/admin/pipeline" className="p-2 rounded-xl neu-sm hover:neu-pressable text-xs font-bold uppercase tracking-widest">
                Vue complète
              </Link>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {pipelineStages.map((s) => {
                const stage = pipelineByKey[s.key];
                const count = stage?.count ?? 0;
                const percentage = totalDossiers > 0 ? (count / totalDossiers) * 100 : 0;
                
                return (
                  <Link
                    key={s.key}
                    to="/admin/pipeline"
                    className="group relative p-4 rounded-2xl bg-ghost/30 border border-white/40 hover:bg-white hover:shadow-xl transition-all duration-500"
                  >
                    <div className="flex justify-between items-start mb-4">
                       <div className={`w-2 h-2 rounded-full ${STAGE_COLORS[s.key] ?? s.color} shadow-[0_0_10px_rgba(0,0,0,0.1)]`} />
                       <span className="text-[10px] font-black text-muted-foreground/40">{Math.round(percentage)}%</span>
                    </div>
                    <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest truncate">{stage?.label ?? s.label}</div>
                    <div className="text-2xl font-black mt-1 text-eerie">
                      <CalculatingValue value={String(count)} loading={isCalculatingWeek} size="sm" />
                    </div>
                    {/* Tiny progress bar at bottom */}
                    <div className="absolute bottom-0 left-0 h-1 bg-ghost w-full rounded-b-2xl overflow-hidden">
                       <div 
                        className={`h-full ${STAGE_COLORS[s.key] ?? s.color} opacity-30 transition-all duration-1000`}
                        style={{ width: `${percentage}%` }}
                       />
                    </div>
                  </Link>
                );
              })}
            </div>
          </NeuCard>

          {/* AI Weekly Report - Reverted to Classic View */}
          <NeuCard className="bg-white p-8">
            <div className="flex flex-col md:flex-row items-center gap-8">
              {/* Circular Icon */}
              <div className="w-20 h-20 rounded-full bg-eerie flex items-center justify-center shadow-lg shrink-0">
                <FileText size={32} className="text-vanilla" strokeWidth={1.5} />
              </div>

              {/* Text Content */}
              <div className="flex-1 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                  <Zap size={14} className="fill-current text-eerie" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-eerie">Intelligence Artificielle</span>
                </div>
                <h3 className="text-2xl font-black text-eerie tracking-tight mb-2">Rapport Stratégique Hebdomadaire</h3>
                <p className="text-muted-foreground text-sm font-medium leading-relaxed">
                  L'IA a analysé les <span className="text-eerie font-bold">{totalDossiers} dossiers</span> et les performances de la semaine. Votre synthèse stratégique est prête.
                </p>
              </div>

              {/* Action Button */}
              <button
                onClick={handleGenerateReport}
                disabled={isGeneratingReport}
                className="min-w-[200px] flex items-center justify-center gap-3 px-8 py-4 rounded-full bg-eerie text-ghost font-bold text-sm transition-all hover:opacity-90 active:scale-95 disabled:opacity-70 disabled:cursor-wait"
              >
                {isGeneratingReport ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Génération...</span>
                  </>
                ) : (
                  <>
                    <FileDown size={18} />
                    <span>Générer le PDF</span>
                  </>
                )}
              </button>
            </div>
          </NeuCard>

        </div>

        {/* Right Column: Alerts & Agents */}
        <div className="col-span-12 lg:col-span-4 space-y-6 md:space-y-8">
          {/* Alerts Section - Higher priority */}
          <NeuCard className="border-l-4 border-warn">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-sm font-black uppercase tracking-widest text-eerie flex items-center gap-2">
                <AlertTriangle size={18} className="text-warn" /> Alertes Critiques
              </h2>
              {alerts.length > 0 && (
                <span className="w-6 h-6 rounded-full bg-warn text-eerie flex items-center justify-center text-[10px] font-black shadow-lg animate-bounce">
                  {alerts.length}
                </span>
              )}
            </div>
            {alerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 opacity-40">
                <CheckCircle2 size={40} className="text-muted-foreground/30 mb-3" />
                <p className="text-xs font-bold uppercase tracking-widest">Aucune alerte</p>
              </div>
            ) : (
              <div className="space-y-4">
                {alerts.map((a) => (
                  <div key={a.alertId} className="group p-4 rounded-2xl bg-ghost/30 border border-white/60 hover:bg-white hover:shadow-lg transition-all duration-300">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm text-eerie truncate">{a.clientName}</div>
                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter mt-1 flex items-center gap-1.5">
                           <Users size={10} /> {a.agentName}
                        </div>
                        <p className="text-xs text-eerie/70 mt-3 leading-relaxed font-medium">"{a.reason}"</p>
                      </div>
                      <div className={`p-1.5 rounded-lg ${a.tone === "danger" ? "bg-destructive/10 text-destructive" : "bg-warn/10 text-warn"}`}>
                        <ShieldAlert size={16} />
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={!a.agentId || notifyingId === a.alertId}
                      onClick={() => handleNotifyAgent(a)}
                      className="w-full mt-4 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest neu-sm hover:neu-pressable disabled:opacity-50 transition-all"
                    >
                      {notifyingId === a.alertId ? "Envoi..." : "Relancer l'agent"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </NeuCard>

          {/* Agents Performances */}
          <NeuCard>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-sm font-black uppercase tracking-widest text-eerie flex items-center gap-2">
                <Users size={18} /> Top Agents
              </h2>
              <Link to="/admin/agents" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-eerie transition-colors">
                Voir tout
              </Link>
            </div>
            {agents.length === 0 ? (
              <p className="text-sm text-muted-foreground py-10 text-center italic">Aucun agent actif.</p>
            ) : (
              <div className="space-y-1">
                {agents.slice(0, 5).map((a, i) => (
                  <div
                    key={a.id}
                    className={`group flex items-center gap-4 p-3 rounded-2xl hover:bg-alice/40 transition-all duration-300 ${!a.active ? "opacity-40" : ""}`}
                  >
                    <div className="relative">
                       <Avatar name={a.name} size={44} className="shadow-md group-hover:scale-105 transition-transform" />
                       {i === 0 && <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-vanilla flex items-center justify-center text-[8px] shadow-sm">🏆</div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm text-eerie truncate">{a.name}</div>
                      <div className="text-[10px] font-bold text-muted-foreground uppercase opacity-60 truncate">{a.lastActivity}</div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-xs font-black text-eerie">{a.activeClients}</div>
                        <div className="text-[8px] font-black text-muted-foreground uppercase tracking-tighter">Actifs</div>
                      </div>
                      <div className="w-px h-6 bg-border/40" />
                      <div className="text-right">
                        <div className="text-xs font-black text-honeydew-foreground">{a.closedThisMonth}</div>
                        <div className="text-[8px] font-black text-muted-foreground uppercase tracking-tighter">Clos</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </NeuCard>
        </div>
      </div>
    </div>
  );
}

function AdminDashboardLoading() {
  return (
    <div className="space-y-6 md:space-y-10 max-w-[1400px] animate-pulse" aria-busy="true">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-3">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-10 w-80 rounded-xl" />
        </div>
        <Skeleton className="h-14 w-64 rounded-2xl" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-14 rounded-2xl" />
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <NeuCard key={i} className="h-44">
            <div className="flex items-start justify-between mb-8">
              <Skeleton className="h-12 w-12 rounded-2xl" />
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
            <Skeleton className="h-10 w-24 rounded-xl mb-3" />
            <Skeleton className="h-3 w-32" />
          </NeuCard>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 lg:col-span-8 space-y-8">
          <NeuCard className="h-64" />
          <NeuCard className="h-48" />
        </div>
        <div className="col-span-12 lg:col-span-4 space-y-8">
          <NeuCard className="h-80" />
          <NeuCard className="h-64" />
        </div>
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

  const dotClass = size === "sm" ? "h-1.5 w-1.5" : "h-2.5 w-2.5";

  return (
    <span className="inline-flex min-w-[2.5ch] items-center gap-1.5 align-middle" aria-label="Calcul en cours">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={`${dotClass} rounded-full bg-current opacity-40 animate-bounce`}
          style={{ animationDelay: `${i * 150}ms` }}
        />
      ))}
    </span>
  );
}

