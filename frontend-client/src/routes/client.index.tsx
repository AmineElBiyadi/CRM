import { createFileRoute, Link } from "@tanstack/react-router";
import { NeuCard } from "@/components/ui/neu-card";
import { Avatar, SoftBadge } from "@/components/ui/design-bits";
import { CheckCircle2, Circle, MessageCircle, CalendarPlus, Upload, FileText, MapPin, Clock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useClientData } from "@/hooks/use-client-data";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export const Route = createFileRoute("/client/")({
  component: ClientHome,
});

const defaultSteps = [
  { label: "Profil créé", done: true },
  { label: "Recherche", done: true },
  { label: "Visite", done: false },
  { label: "Négociation", done: false },
  { label: "Contrat", done: false },
  { label: "Clôturé", done: false },
];

function ClientHome() {
  const { data, isLoading } = useClientData();

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center p-12">
        <Loader2 className="animate-spin text-vanilla" size={32} />
      </div>
    );
  }

  const profile = data?.profile;
  const primaryDossier = data?.dossiers?.[0];
  const nextMeeting = data?.meetings?.filter(m => m.status === "SCHEDULED")?.[0];
  const missingDocs = data?.documents?.filter(d => !d.confirmedReceived) || [];
  const receivedDocs = data?.documents?.filter(d => d.confirmedReceived) || [];

  // Map deal stage to steps
  const stageToStepIdx: Record<string, number> = {
    "COLD": 1,
    "WARM": 1,
    "HOT": 2,
    "NEGOTIATION": 3,
    "CONTRACT": 4,
    "CLOSED": 5,
  };
  const currentStepIdx = primaryDossier ? (stageToStepIdx[primaryDossier.stage] || 0) : 0;
  
  const dynamicSteps = defaultSteps.map((s, i) => ({
    ...s,
    done: i < currentStepIdx,
    active: i === currentStepIdx,
  }));

  return (
    <div className="space-y-6 md:space-y-8 max-w-[1200px]">
      {/* Greeting */}
      <NeuCard className="flex flex-col md:flex-row items-center gap-6 bg-alice/40">
        <Avatar name={profile ? `${profile.firstName} ${profile.lastName}` : "User"} size={72} />
        <div className="flex-1 text-center md:text-left">
          <p className="text-sm text-muted-foreground">Bienvenue</p>
          <h1 className="text-2xl md:text-3xl font-bold mt-1">
            Bonjour M. {profile?.lastName || "Client"}
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            Votre dossier est suivi par <span className="font-semibold text-eerie">{profile?.assignedAgentName || "votre agent"}</span>.
          </p>
        </div>
        <Link
          to="/client/assistant"
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-eerie text-ghost text-sm font-medium hover:opacity-90"
        >
          <MessageCircle size={16} /> Contacter {profile?.assignedAgentName?.split(' ')[0] || "Agent"}
        </Link>
      </NeuCard>

      {/* Stepper */}
      <NeuCard>
        <h2 className="font-semibold mb-6">Avancement de votre dossier</h2>
        <div className="flex items-center overflow-x-auto soft-scroll pb-2">
          {dynamicSteps.map((s, i) => (
            <div key={s.label} className="flex-1 min-w-[100px] flex items-center last:flex-none">
              <button
                onClick={() => toast(`Étape : ${s.label}${s.done ? " — terminée" : s.active ? " — en cours" : " — à venir"}`)}
                className="flex flex-col items-center gap-2 group"
              >
                <div className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${
                  s.active ? "bg-honeydew ring-4 ring-honeydew/30 animate-pulse" :
                  s.done ? "bg-eerie text-ghost" : "neu-inset"
                }`}>
                  {s.done ? <CheckCircle2 size={18} /> : <Circle size={16} className="opacity-40" />}
                </div>
                <span className={`text-xs text-center max-w-[80px] ${s.active ? "font-bold" : s.done ? "" : "text-muted-foreground"}`}>{s.label}</span>
              </button>
              {i < dynamicSteps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 ${s.done ? "bg-eerie" : "bg-border"}`} />
              )}
            </div>
          ))}
        </div>
      </NeuCard>

      <div className="grid md:grid-cols-2 gap-6">
        <NeuCard className="bg-vanilla/40">
          <SoftBadge tone="warn" className="mb-3">Prochaine étape conseil</SoftBadge>
          <h3 className="font-bold text-lg">{primaryDossier?.aiRecommendedAction || "Analyse en cours"}</h3>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            {primaryDossier?.aiSummary || "Votre agent étudie actuellement votre dossier pour vous proposer les meilleures options."}
          </p>
        </NeuCard>

        <NeuCard>
          <div className="flex items-center justify-between mb-3">
            <SoftBadge tone="info"><Clock size={12} /> Prochain RDV</SoftBadge>
          </div>
          {nextMeeting ? (
            <>
              <h3 className="font-bold text-lg">{nextMeeting.type.replace('_', ' ')}</h3>
              <div className="space-y-1 mt-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CalendarPlus size={14} /> 
                  {format(new Date(nextMeeting.scheduledAt), "EEEE d MMMM · HH:mm", { locale: fr })}
                </div>
                <p className="text-xs italic mt-2 line-clamp-2">{nextMeeting.notesLogged}</p>
              </div>
            </>
          ) : (
            <div className="py-4 text-center">
              <p className="text-sm text-muted-foreground">Aucun rendez-vous prévu.</p>
              <button className="text-xs text-eerie font-medium hover:underline mt-2">Solliciter une visite</button>
            </div>
          )}
          {nextMeeting && (
            <button
              onClick={() => toast.success("Événement ajouté à votre calendrier")}
              className="mt-4 px-4 py-2.5 rounded-lg neu-sm hover:neu-pressable text-sm font-medium flex items-center gap-2"
            >
              <CalendarPlus size={14} /> Ajouter à mon calendrier
            </button>
          )}
        </NeuCard>
      </div>

      <NeuCard>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h3 className="font-bold flex items-center gap-2"><FileText size={16} /> Documents</h3>
          <div className="flex gap-2 text-xs">
            <SoftBadge tone="success">{receivedDocs.length} reçus</SoftBadge>
            <SoftBadge tone="danger">{missingDocs.length} manquants</SoftBadge>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          {missingDocs.length > 0 ? (
            <>
              Il manque encore : {missingDocs.map((d, i) => (
                <span key={d.idDocument} className="text-destructive font-medium">
                  {d.documentType}{i < missingDocs.length - 1 ? ", " : ""}
                </span>
              ))}
            </>
          ) : (
            "Tous vos documents sont à jour."
          )}
        </p>
        <Link
          to="/client/documents"
          className="px-5 py-3 rounded-xl bg-eerie text-ghost text-sm font-medium hover:opacity-90 inline-flex items-center gap-2"
        >
          <Upload size={16} /> Gérer mes documents
        </Link>
      </NeuCard>
    </div>
  );
}
