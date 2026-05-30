import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { NeuCard } from "@/components/ui/neu-card";
import { SoftBadge } from "@/components/ui/design-bits";
import { Calendar, Clock, MapPin, Phone, Building, PenLine, Video, CalendarPlus, Loader2 } from "lucide-react";
import { useClientData } from "@/hooks/use-client-data";
import { format, isWithinInterval, addDays, startOfDay } from "date-fns";
import { fr } from "date-fns/locale";
import { MeetingRequestModal } from "@/components/client/MeetingRequestModal";
import { cn } from "@/lib/utils";
import type { Meeting } from "@/hooks/use-client-data";

export const Route = createFileRoute("/client/rendez-vous")({
  component: ClientMeetings,
});

const MEETING_TYPE_MAP: Record<string, { label: string; icon: React.ReactNode }> = {
  PROPERTY_VISIT:      { label: "Visite de propriété",       icon: <MapPin size={16} /> },
  PHONE_CALL:          { label: "Appel téléphonique",         icon: <Phone size={16} /> },
  OFFICE_APPOINTMENT:  { label: "Rendez-vous en agence",      icon: <Building size={16} /> },
  CONTRACT_SIGNING:    { label: "Signature de contrat",       icon: <PenLine size={16} /> },
};

function typeLabel(type: string) {
  return MEETING_TYPE_MAP[type]?.label ?? type.replace(/_/g, " ");
}
function typeIcon(type: string) {
  return MEETING_TYPE_MAP[type]?.icon ?? <Video size={16} />;
}

function isThisWeek(dateStr: string) {
  const d = new Date(dateStr);
  const now = startOfDay(new Date());
  return isWithinInterval(d, { start: now, end: addDays(now, 7) });
}

function ClientMeetings() {
  const { data, isLoading } = useClientData();
  const [showRequestModal, setShowRequestModal] = useState(false);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center p-12">
        <Loader2 className="animate-spin text-vanilla" size={32} />
      </div>
    );
  }

  const meetings: Meeting[] = data?.meetings || [];
  const now = new Date();
  const upcoming = meetings
    .filter((m) => new Date(m.scheduledAt) >= now)
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());

  const past = meetings
    .filter((m) => new Date(m.scheduledAt) < now)
    .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime());

  const thisWeek = upcoming.filter((m) => isThisWeek(m.scheduledAt));
  const laterUpcoming = upcoming.filter((m) => !isThisWeek(m.scheduledAt));

  return (
    <div className="space-y-8 max-w-[1000px]">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Mes rendez-vous</h1>
          <p className="text-sm text-muted-foreground mt-1">Gérez vos visites et points de situation</p>
        </div>
        <button
          onClick={() => setShowRequestModal(true)}
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-eerie text-ghost text-sm font-medium hover:opacity-90"
        >
          <CalendarPlus size={16} /> Demander un rendez-vous
        </button>
      </div>

      {/* Cette semaine */}
      <section>
        <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4">
          Cette semaine
        </h2>
        {thisWeek.length > 0 ? (
          <div className="flex gap-4 overflow-x-auto soft-scroll pb-3">
            {thisWeek.map((m) => (
              <NeuCard
                key={m.idMeeting}
                className="min-w-[170px] max-w-[200px] shrink-0 p-5 flex flex-col gap-2 bg-alice/30"
              >
                <p className="text-[11px] text-muted-foreground font-medium uppercase">
                  {format(new Date(m.scheduledAt), "EEE d MMM", { locale: fr })}
                </p>
                <p className="text-sm font-bold text-eerie leading-tight">{typeLabel(m.type)}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock size={11} />
                  {format(new Date(m.scheduledAt), "HH:mm", { locale: fr })}
                </p>
                <SoftBadge tone="info" className="text-[10px] self-start">{m.status}</SoftBadge>
              </NeuCard>
            ))}
          </div>
        ) : (
          <div className="p-6 neu-inset rounded-2xl text-center">
            <p className="text-sm text-muted-foreground">Aucun rendez-vous prévu cette semaine.</p>
          </div>
        )}
      </section>

      {/* À venir (au-delà de cette semaine) */}
      <section className="space-y-4">
        <h2 className="font-semibold flex items-center gap-2">
          <Clock size={18} className="text-eerie" /> À venir
        </h2>
        <div className="grid gap-4">
          {laterUpcoming.map((m) => (
            <NeuCard key={m.idMeeting} className="flex flex-col md:flex-row gap-6">
              <div className="md:w-48 shrink-0 flex flex-col items-center justify-center p-4 bg-alice/30 rounded-2xl text-center">
                <span className="text-sm font-medium uppercase text-muted-foreground">
                  {format(new Date(m.scheduledAt), "EEEE", { locale: fr })}
                </span>
                <span className="text-3xl font-bold text-eerie">
                  {format(new Date(m.scheduledAt), "d", { locale: fr })}
                </span>
                <span className="text-sm font-medium text-muted-foreground">
                  {format(new Date(m.scheduledAt), "MMMM yyyy", { locale: fr })}
                </span>
              </div>
              <div className="flex-1 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      {typeIcon(m.type)}
                      <span className="text-xs font-semibold uppercase tracking-wide">{typeLabel(m.type)}</span>
                    </div>
                    <h3 className="text-lg font-bold">
                      {format(new Date(m.scheduledAt), "HH:mm", { locale: fr })}
                    </h3>
                  </div>
                  <SoftBadge tone="info">{m.status}</SoftBadge>
                </div>
                {m.notesLogged && (
                  <p className="text-sm text-muted-foreground italic p-3 neu-inset rounded-xl leading-relaxed line-clamp-2">
                    "{m.notesLogged}"
                  </p>
                )}
              </div>
            </NeuCard>
          ))}
          {laterUpcoming.length === 0 && upcoming.length === 0 && (
            <div className="py-12 text-center neu-inset rounded-3xl">
              <Calendar size={32} className="mx-auto text-muted-foreground mb-3 opacity-40" />
              <p className="text-muted-foreground">Aucun rendez-vous à venir.</p>
              <button
                onClick={() => setShowRequestModal(true)}
                className="mt-4 text-eerie font-medium text-sm flex items-center gap-2 mx-auto hover:underline"
              >
                <CalendarPlus size={16} /> Demander un rendez-vous
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Historique */}
      {past.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-semibold text-muted-foreground">Historique des rendez-vous</h2>
          <div className="grid gap-3">
            {past.map((m) => (
              <div key={m.idMeeting} className="flex items-center gap-4 p-4 neu-sm rounded-xl opacity-60">
                <div className="text-muted-foreground shrink-0">{typeIcon(m.type)}</div>
                <div className="flex-1">
                  <div className="text-sm font-medium">{typeLabel(m.type)}</div>
                  <div className="text-xs text-muted-foreground">
                    Le {format(new Date(m.scheduledAt), "d MMMM yyyy · HH:mm", { locale: fr })}
                  </div>
                </div>
                <SoftBadge tone="success">Terminé</SoftBadge>
              </div>
            ))}
          </div>
        </section>
      )}

      {showRequestModal && <MeetingRequestModal onClose={() => setShowRequestModal(false)} />}
    </div>
  );
}
