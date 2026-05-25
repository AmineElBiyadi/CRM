import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useAgentDashboard, useToggleMeeting } from "@/hooks/useDashboard";
import { NeuCard } from "@/components/ui/neu-card";
import { Avatar, LeadScore, StageBadge } from "@/components/ui/design-bits";
import { Phone, Calendar, FileText, MessageSquarePlus, CheckCircle2, Clock, Users, FolderCheck, Sparkles } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/agent/")({
  component: AgentDashboard,
});

function AgentDashboard() {
  const navigate = useNavigate();
  const { data, isLoading, isError } = useAgentDashboard();
  const toggleMeetingMutation = useToggleMeeting();

  if (isLoading) {
    return (
      <div className="space-y-6 md:space-y-8 max-w-[1400px] animate-pulse">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="space-y-2">
            <div className="h-4 w-28 bg-ghost/20 rounded"></div>
            <div className="h-8 w-64 bg-ghost/20 rounded"></div>
          </div>
          <div className="h-10 w-36 bg-ghost/20 rounded-full"></div>
        </div>

        {/* Planning du jour skeleton */}
        <div className="glass-dark rounded-3xl p-4 md:p-6 h-48 flex flex-col justify-between">
          <div className="h-4 w-48 bg-ghost/20 rounded"></div>
          <div className="flex justify-between gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex flex-col items-center gap-2 flex-1">
                <div className="h-6 w-12 bg-ghost/20 rounded"></div>
                <div className="h-10 w-10 bg-ghost/20 rounded-full"></div>
                <div className="h-3 w-16 bg-ghost/20 rounded"></div>
              </div>
            ))}
          </div>
        </div>

        {/* KPIs skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-ghost/10 rounded-2xl"></div>
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center max-w-[1400px] min-h-[400px]">
        <div className="text-red-500 font-semibold mb-2">Erreur lors de la récupération des données</div>
        <p className="text-muted-foreground mb-4">Impossible de contacter le serveur backend.</p>
        <button 
          onClick={() => window.location.reload()} 
          className="px-4 py-2 bg-eerie text-white rounded-xl hover:opacity-90 transition-opacity"
        >
          Recharger la page
        </button>
      </div>
    );
  }

  const agentFirstName = data?.agentFirstName || "Sara";
  const kpisData = [
    { label: "Mes clients actifs", value: data?.kpis?.activeClients ?? 0, icon: Users },
    { label: "RDV cette semaine", value: data?.kpis?.weekMeetings ?? 0, icon: Calendar },
    { label: "Contrats en attente", value: data?.kpis?.pendingContracts ?? 0, icon: FileText },
    { label: "Score moyen leads", value: data?.kpis?.avgLeadScore ?? 0, icon: FolderCheck },
  ];

  const todayMeetings = data?.todayMeetings || [];
  const priorities = data?.priorities || [];
  const todayTasks = data?.todayTasks || [];

  // Formatter la date du jour en français
  const formattedDate = new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const handleToggleTask = (meetingId: string, clientName: string) => {
    toggleMeetingMutation.mutate(meetingId, {
      onSuccess: (updated: any) => {
        const isDone = updated.status === "COMPLETED";
        if (isDone) {
          toast.success(`RDV avec ${clientName} marqué comme effectué ! 🎯`);
        } else {
          toast.info(`RDV avec ${clientName} remis à faire.`);
        }
      },
      onError: () => {
        toast.error("Erreur de communication avec le serveur.");
      }
    });
  };

  return (
    <div className="space-y-6 md:space-y-8 max-w-[1400px]">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-lg md:text-xl font-medium text-muted-foreground italic">Bonjour {agentFirstName}</p>
          <h1 className="text-2xl md:text-3xl font-bold mt-1">Votre journée commence bien</h1>
        </div>
        <div className="neu-sm rounded-full px-4 py-2 text-sm">
          Score mensuel : <span className="font-bold">{data?.kpis?.monthlyScore ?? 0}</span>
        </div>
      </div>

      {/* Planning du jour */}
      <div className="glass-dark rounded-3xl p-4 md:p-6">
        <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
          <h2 className="font-semibold text-ghost flex items-center gap-2">
            <Clock size={16} /> Aujourd'hui · {todayMeetings.length} rendez-vous
          </h2>
          <span className="text-xs text-ghost/60 capitalize">{formattedDate}</span>
        </div>
        
        {todayMeetings.length === 0 ? (
          <div className="text-center py-6 text-ghost/60 text-sm">
            Aucun rendez-vous planifié aujourd'hui.
          </div>
        ) : (
          <div className="relative overflow-x-auto soft-scroll">
            <div className="absolute left-0 right-0 top-1/2 h-px bg-ghost/20" />
            <div className="relative flex justify-between gap-4 min-w-[480px]">
              {todayMeetings.map((m: any) => (
                <Link key={m.idMeeting} to="/agent/dossier" className="flex flex-col items-center gap-3 group flex-1 min-w-[100px]">
                  <div className="glass rounded-2xl px-3 py-1.5 text-xs font-semibold">{m.scheduledAt}</div>
                  <div className="w-3 h-3 rounded-full bg-vanilla ring-4 ring-eerie" />
                  <div className="text-center">
                    <Avatar name={m.clientFullName} size={36} />
                    <div className="text-xs font-medium text-ghost mt-2">{m.clientFullName}</div>
                    <div className="text-[10px] text-ghost/60">{m.type}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {kpisData.map((k) => {
          const Icon = k.icon;
          return (
            <NeuCard key={k.label}>
              <Icon size={20} className="text-muted-foreground" strokeWidth={1.8} />
              <div className="text-3xl font-bold mt-3">{k.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{k.label}</div>
            </NeuCard>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Priorités */}
        <NeuCard className="lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold flex items-center gap-2"><Sparkles size={16} /> Mes clients — priorités IA</h2>
            <Link to="/agent/clients" className="text-xs text-muted-foreground hover:text-eerie">Voir tous →</Link>
          </div>
          <div className="space-y-3">
            {priorities.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground text-sm">
                Aucun client prioritaire pour le moment.
              </div>
            ) : (
              priorities.map((c: any) => (
                <div 
                  key={c.idDeal} 
                  onClick={() => navigate({ to: "/agent/dossier", search: { id: c.idDeal } })}
                  className="flex flex-wrap items-center gap-3 md:gap-4 p-3 rounded-xl hover:bg-alice/40 transition-colors cursor-pointer group"
                >
                  <Avatar name={c.clientFullName} size={44} />
                  <div className="flex-1 min-w-[140px]">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">{c.clientFullName}</span>
                      <StageBadge stage={c.stage} />
                    </div>
                    <p className="text-xs text-muted-foreground italic mt-0.5">→ {c.aiRecommendedAction}</p>
                    <div className="text-[10px] text-muted-foreground mt-1">Dernière interaction : {c.lastInteractionAt}</div>
                  </div>
                  <LeadScore score={c.aiLeadScore} size={48} />
                  <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                    <Link 
                      to="/agent/dossier" 
                      search={{ id: c.idDeal }}
                      className="w-9 h-9 rounded-lg neu-sm hover:neu-pressable flex items-center justify-center text-inherit bg-ghost/50" 
                      aria-label="Dossier"
                    >
                      <FileText size={14} />
                    </Link>
                    <button onClick={() => toast.success(`Message envoyé à ${c.clientFullName}`)} className="w-9 h-9 rounded-lg neu-sm hover:neu-pressable flex items-center justify-center" aria-label="Message"><MessageSquarePlus size={14} /></button>
                    <button onClick={() => toast(`Appel vers ${c.clientPhone}…`)} className="w-9 h-9 rounded-lg neu-sm hover:neu-pressable flex items-center justify-center" aria-label="Appeler"><Phone size={14} /></button>
                  </div>
                </div>
              ))
            )}
          </div>
        </NeuCard>

        {/* Tasks */}
        <NeuCard>
          <h2 className="font-semibold mb-5">Tâches du jour</h2>
          <div className="space-y-3">
            {todayTasks.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground text-sm">
                Aucune tâche pour aujourd'hui.
              </div>
            ) : (
              todayTasks.map((t: any) => {
                const isDone = t.status === "COMPLETED";
                return (
                  <div key={t.idMeeting} className="flex items-center gap-3 p-3 rounded-xl neu-sm">
                    <button
                      onClick={() => handleToggleTask(t.idMeeting, t.clientFullName)}
                      disabled={toggleMeetingMutation.isPending}
                      className={`w-6 h-6 rounded-md flex items-center justify-center transition-colors ${
                        isDone ? "bg-honeydew" : "neu-inset hover:bg-honeydew/30"
                      }`}
                      aria-label="Toggle tâche"
                    >
                      {isDone && <CheckCircle2 size={14} className="text-eerie" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-medium ${isDone ? "line-through text-muted-foreground" : ""}`}>
                        {t.type} — {t.clientFullName}
                      </div>
                      <div className="text-xs text-muted-foreground">{t.scheduledAt}</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </NeuCard>
      </div>
    </div>
  );
}
