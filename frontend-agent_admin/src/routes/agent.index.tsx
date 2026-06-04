import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useAgentDashboard, useToggleMeeting } from "@/hooks/useDashboard";
import { useConfirmClient } from "@/hooks/useClients";
import { NeuCard } from "@/components/ui/neu-card";
import { Avatar, LeadScore, StageBadge, SoftBadge } from "@/components/ui/design-bits";
import { 
  Phone, Calendar, FileText, MessageSquarePlus, CheckCircle2, 
  Clock, Users, FolderCheck, Sparkles, UserPlus, ArrowRight, X 
} from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { EmailModal } from "@/components/EmailModal";
import { getUser } from "@/lib/auth";

export const Route = createFileRoute("/agent/")({
  component: AgentDashboard,
});

function AgentDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data, isLoading, isError } = useAgentDashboard();
  const toggleMeetingMutation = useToggleMeeting();
  const confirmClientMutation = useConfirmClient();
  const user = getUser();

  const [confirmingClient, setConfirmingClient] = useState<any>(null);
  const [selectedEmailClient, setSelectedEmailClient] = useState<any>(null);
  const [confirmForm, setConfirmForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    source: "Saisie manuelle",
  });

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
  const pendingClients = data?.pendingClients || [];

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

  const handleConfirm = () => {
    confirmClientMutation.mutate(
      { id: confirmingClient.idClient, data: confirmForm },
      {
        onSuccess: () => {
          toast.success("Client confirmé avec succès !");
          setConfirmingClient(null);
        },
        onError: () => toast.error("Erreur lors de la confirmation"),
      }
    );
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

      {/* Nouveaux Clients à Confirmer */}
      {pendingClients.length > 0 && (
        <div className="animate-in fade-in slide-in-from-top duration-500">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-ghost shadow-sm">
              <UserPlus size={18} />
            </div>
            <h2 className="font-bold text-lg">Nouveaux clients à confirmer</h2>
            <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full border border-amber-200 ml-1">
              {pendingClients.length}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingClients.map((c: any) => (
              <NeuCard 
                key={c.idClient} 
                className="group border-amber-100 bg-amber-50/30 ring-1 ring-amber-50"
              >
                <div className="flex items-center gap-4">
                  <Avatar name={`${c.firstName} ${c.lastName}`} size={44} />
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm truncate">{c.firstName} {c.lastName}</div>
                    <div className="text-[10px] text-muted-foreground font-medium truncate">{c.email}</div>
                  </div>
                  <button
                    onClick={() => {
                      setConfirmingClient(c);
                      setConfirmForm({
                        firstName: c.firstName,
                        lastName: c.lastName,
                        email: c.email,
                        phone: c.phone || "",
                        source: c.source || "Saisie manuelle"
                      });
                    }}
                    className="shrink-0 px-3 py-1.5 rounded-lg bg-amber-500 text-ghost text-xs font-bold hover:bg-amber-600 transition-colors shadow-sm"
                  >
                    Confirmer
                  </button>
                </div>
              </NeuCard>
            ))}
          </div>
        </div>
      )}

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
                <Link key={m.idMeeting} to="/agent/dossier" search={{ from: "/agent/" }} className="flex flex-col items-center gap-3 group flex-1 min-w-[100px]">
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

      {/* Confirmation Modal */}
      {confirmingClient && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-eerie/40 backdrop-blur-md"
          onClick={() => setConfirmingClient(null)}
        >
          <div 
            className="relative bg-ghost rounded-[2.5rem] max-w-lg w-full p-8 md:p-10 shadow-[0_20px_70px_rgba(0,0,0,0.4)] flex flex-col gap-8"
            onClick={e => e.stopPropagation()}
          >
            <button 
              onClick={() => setConfirmingClient(null)}
              className="absolute top-6 right-6 w-10 h-10 rounded-full neu-sm flex items-center justify-center hover:bg-alice transition-colors"
            >
              <X size={18} />
            </button>

            <div>
              <h2 className="text-3xl font-extrabold tracking-tight">Confirmer le Client</h2>
              <p className="text-muted-foreground text-sm mt-2 font-medium">
                Vérifiez et complétez les informations pour activer le compte portail.
              </p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-1">Prénom</label>
                  <input 
                    value={confirmForm.firstName}
                    onChange={e => setConfirmForm({...confirmForm, firstName: e.target.value})}
                    className="w-full px-5 py-3 rounded-2xl neu-inset bg-transparent text-sm focus:outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-1">Nom</label>
                  <input 
                    value={confirmForm.lastName}
                    onChange={e => setConfirmForm({...confirmForm, lastName: e.target.value})}
                    className="w-full px-5 py-3 rounded-2xl neu-inset bg-transparent text-sm focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-1">Email</label>
                <input 
                  value={confirmForm.email}
                  onChange={e => setConfirmForm({...confirmForm, email: e.target.value})}
                  className="w-full px-5 py-3 rounded-2xl neu-inset bg-transparent text-sm focus:outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-1">Téléphone</label>
                <input 
                  value={confirmForm.phone}
                  onChange={e => setConfirmForm({...confirmForm, phone: e.target.value})}
                  placeholder="06..."
                  className="w-full px-5 py-3 rounded-2xl neu-inset bg-transparent text-sm focus:outline-none"
                />
              </div>
            </div>

            <div className="flex flex-col gap-3 mt-2">
              <button 
                onClick={handleConfirm}
                disabled={confirmClientMutation.isPending}
                className="w-full py-4 rounded-2xl bg-eerie text-ghost font-bold shadow-lg hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                {confirmClientMutation.isPending ? "Confirmation..." : <>Confirmer & Envoyer l'accès <ArrowRight size={18} /></>}
              </button>
            </div>
          </div>
        </div>
      )}

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
                  onClick={() => navigate({ to: "/agent/dossier", search: { id: c.idDeal, from: "/agent/" } })}
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
                      search={{ id: c.idDeal, from: "/agent/" }}
                      className="w-9 h-9 rounded-lg neu-sm hover:neu-pressable flex items-center justify-center text-inherit bg-ghost/50" 
                      aria-label="Dossier"
                    >
                      <FileText size={14} />
                    </Link>
                    <button 
                      onClick={() => setSelectedEmailClient(c)}
                      className="w-9 h-9 rounded-lg neu-sm hover:neu-pressable flex items-center justify-center text-inherit bg-ghost/50" 
                      aria-label="Email"
                    >
                      <MessageSquarePlus size={14} />
                    </button>
                    <a 
                      href={`tel:${c.clientPhone}`} 
                      className="w-9 h-9 rounded-lg neu-sm hover:neu-pressable flex items-center justify-center text-inherit bg-ghost/50" 
                      aria-label="Appeler"
                      onClick={() => toast.info(`Appel vers ${c.clientPhone}…`)}
                    >
                      <Phone size={14} />
                    </a>
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

      {/* Email Modal */}
      {selectedEmailClient && (
        <EmailModal 
          isOpen={!!selectedEmailClient}
          onClose={() => setSelectedEmailClient(null)}
          dealId={selectedEmailClient.idDeal}
          clientEmail={selectedEmailClient.clientEmail}
          clientName={selectedEmailClient.clientFullName}
          agentEmail={user?.email || ""}
          initialSubject={`Suivi de votre dossier immobilier - ${selectedEmailClient.clientFullName}`}
          initialBody=""
          onSuccess={() => {
            // Rafraîchir le dashboard après l'envoi (donner 2s pour l'IA)
            setTimeout(() => {
              queryClient.invalidateQueries({ queryKey: ["agent-dashboard"] });
            }, 2000);
          }}
        />
      )}
    </div>
  );
}
