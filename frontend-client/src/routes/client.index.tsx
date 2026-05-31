import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { NeuCard } from "@/components/ui/neu-card";
import { Avatar, SoftBadge } from "@/components/ui/design-bits";
import { CheckCircle2, Circle, MessageCircle, CalendarPlus, Upload, FileText, MapPin, Clock, Loader2, CheckCheck } from "lucide-react";
import { toast } from "sonner";
import { useClientData } from "@/hooks/use-client-data";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ContactAgentModal } from "@/components/client/ContactAgentModal";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/client/")({
  component: ClientHome,
});

const STEPS = ["Profil créé", "Recherche", "Visite", "Négociation", "Contrat", "Clôturé"];

const stageToIdx: Record<string, number> = {
  COLD: 1, WARM: 1, HOT: 2, NEGOTIATION: 3, CONTRACT: 4, CLOSED: 5,
};

function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("rounded-xl bg-gradient-to-r from-muted via-alice to-muted animate-pulse", className)}
    />
  );
}

function ClientHome() {
  const { data, isLoading } = useClientData();
  const [showContactModal, setShowContactModal] = useState(false);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center p-12">
        <Loader2 className="animate-spin text-vanilla" size={32} />
      </div>
    );
  }

  const profile = data?.profile;
  const primaryDossier = data?.dossiers?.[0];
  const nextMeeting = data?.meetings?.filter((m) => m.status === "SCHEDULED")?.[0];
  const missingDocs = data?.documents?.filter((d) => !d.confirmedReceived) || [];
  const receivedDocs = data?.documents?.filter((d) => d.confirmedReceived) || [];

  const currentStepIdx = primaryDossier ? (stageToIdx[primaryDossier.stage] ?? 0) : 0;

  const agentName = profile?.assignedAgentName || "votre agent";

  return (
    <div className="space-y-6 md:space-y-8 max-w-[1200px]">
      {/* Greeting */}
      <NeuCard className="flex flex-col md:flex-row items-center gap-6 bg-alice/40">
        <Avatar name={profile ? `${profile.firstName} ${profile.lastName}` : "User"} size={72} />
        <div className="flex-1 text-center md:text-left space-y-2">
          <p className="text-sm text-muted-foreground">Bienvenue</p>
          <h1 className="text-2xl md:text-3xl font-bold">
            Bonjour M. {profile?.lastName || "Client"}
          </h1>
          {primaryDossier?.isUrgent && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-honeydew/60 text-green-800 border border-green-200">
              <CheckCheck size={12} />
              Dossier suivi en priorité
            </span>
          )}
          <p className="text-sm text-muted-foreground">
            Votre dossier est suivi par <span className="font-semibold text-eerie">{agentName}</span>.
          </p>
        </div>
        <button
          onClick={() => setShowContactModal(true)}
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-eerie text-ghost text-sm font-medium hover:opacity-90 transition-all"
        >
          <MessageCircle size={16} /> Contacter {agentName.split(" ")[0]}
        </button>
      </NeuCard>

      {/* Stepper */}
      <NeuCard>
        <h2 className="font-semibold mb-6">Avancement de votre dossier</h2>
        <div className="flex items-center overflow-x-auto soft-scroll pb-2">
          {STEPS.map((label, i) => {
            const done = i < currentStepIdx;
            const active = i === currentStepIdx;
            return (
              <div key={label} className="flex-1 min-w-[90px] flex items-center last:flex-none">
                <button
                  onClick={() => toast(`Étape : ${label}${done ? " — terminée" : active ? " — en cours" : " — à venir"}`)}
                  className="flex flex-col items-center gap-2 group"
                >
                  <div className={cn(
                    "w-11 h-11 rounded-full flex items-center justify-center transition-all",
                    active ? "bg-honeydew ring-4 ring-honeydew/30 animate-pulse" :
                    done ? "bg-eerie text-ghost" : "neu-inset"
                  )}>
                    {done ? <CheckCircle2 size={18} /> : <Circle size={16} className="opacity-40" />}
                  </div>
                  <span className={cn("text-xs text-center max-w-[80px]", active ? "font-bold" : done ? "" : "text-muted-foreground")}>
                    {label}
                  </span>
                </button>
                {i < STEPS.length - 1 && (
                  <div className={cn("flex-1 h-0.5 mx-2", done ? "bg-eerie" : "bg-border")} />
                )}
              </div>
            );
          })}
        </div>
      </NeuCard>

      <div className="grid md:grid-cols-2 gap-6">
        {/* AI Action */}
        <NeuCard className="bg-vanilla/40">
          <SoftBadge tone="warn" className="mb-3">Prochaine étape conseil</SoftBadge>
          {primaryDossier?.clientFriendlyAction ? (
            <h3 className="font-bold text-lg">{primaryDossier.clientFriendlyAction}</h3>
          ) : primaryDossier?.aiRecommendedAction ? (
            <h3 className="font-bold text-lg">{primaryDossier.aiRecommendedAction}</h3>
          ) : (
            <Skeleton className="h-5 w-3/5 mt-1" />
          )}
        </NeuCard>

        {/* Next Meeting */}
        <NeuCard>
          <div className="flex items-center justify-between mb-3">
            <SoftBadge tone="info"><Clock size={12} /> Prochain RDV</SoftBadge>
          </div>
          {nextMeeting ? (
            <>
              <h3 className="font-bold text-lg">{nextMeeting.type.replace(/_/g, " ")}</h3>
              <div className="space-y-1 mt-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CalendarPlus size={14} />
                  {format(new Date(nextMeeting.scheduledAt), "EEEE d MMMM · HH:mm", { locale: fr })}
                </div>
                {nextMeeting.notesLogged && (
                  <p className="text-xs italic mt-2 line-clamp-2">{nextMeeting.notesLogged}</p>
                )}
              </div>
              <button
                onClick={() => toast.success("Événement ajouté à votre calendrier")}
                className="mt-4 px-4 py-2.5 rounded-lg neu-sm hover:neu-pressable text-sm font-medium flex items-center gap-2"
              >
                <CalendarPlus size={14} /> Ajouter à mon calendrier
              </button>
            </>
          ) : (
            <div className="py-4 text-center">
              <p className="text-sm text-muted-foreground">Aucun rendez-vous prévu.</p>
            </div>
          )}
        </NeuCard>
      </div>

      {/* AI Summary */}
      {(primaryDossier?.aiSummary !== undefined) && (
        <NeuCard className="bg-alice/30 border border-border/40">
          <p className="text-xs text-muted-foreground mb-2 font-semibold uppercase tracking-wider">
            Ce que votre agent a noté sur votre projet
          </p>
          {primaryDossier.aiSummary ? (
            <p className="text-sm text-eerie leading-relaxed">{primaryDossier.aiSummary}</p>
          ) : (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
            </div>
          )}
        </NeuCard>
      )}

      {/* Documents */}
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
            <>Il manque encore : {missingDocs.map((d, i) => (
              <span key={d.idDocument} className="text-destructive font-medium">
                {d.documentType}{i < missingDocs.length - 1 ? ", " : ""}
              </span>
            ))}</>
          ) : "Tous vos documents sont à jour."}
        </p>
        <Link
          to="/client/documents"
          className="px-5 py-3 rounded-xl bg-eerie text-ghost text-sm font-medium hover:opacity-90 inline-flex items-center gap-2"
        >
          <Upload size={16} /> Gérer mes documents
        </Link>
      </NeuCard>

      {showContactModal && (
        <ContactAgentModal
          agentName={agentName}
          onClose={() => setShowContactModal(false)}
        />
      )}
    </div>
  );
}
