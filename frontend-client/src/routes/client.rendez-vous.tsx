import { createFileRoute } from "@tanstack/react-router";
import { NeuCard } from "@/components/ui/neu-card";
import { SoftBadge } from "@/components/ui/design-bits";
import { Calendar, Clock, MapPin, Video, User, MessageCircle, Loader2 } from "lucide-react";
import { useClientData } from "@/hooks/use-client-data";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export const Route = createFileRoute("/client/rendez-vous")({
  component: ClientMeetings,
});

function ClientMeetings() {
  const { data, isLoading } = useClientData();

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center p-12">
        <Loader2 className="animate-spin text-vanilla" size={32} />
      </div>
    );
  }

  const meetings = data?.meetings || [];
  const upcoming = meetings.filter(m => new Date(m.scheduledAt) >= new Date()).sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
  const past = meetings.filter(m => new Date(m.scheduledAt) < new Date()).sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime());

  return (
    <div className="space-y-8 max-w-[1000px]">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Mes rendez-vous</h1>
        <p className="text-sm text-muted-foreground mt-1">Gérez vos visites et points de situation</p>
      </div>

      <section className="space-y-4">
        <h2 className="font-semibold flex items-center gap-2">
          <Clock size={18} className="text-eerie" /> À venir
        </h2>
        <div className="grid gap-4">
          {upcoming.map((m) => (
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
              <div className="flex-1 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-bold">{m.type.replace('_', ' ')}</h3>
                    <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Clock size={14} /> {format(new Date(m.scheduledAt), "HH:mm", { locale: fr })}
                      </div>
                      <div className="flex items-center gap-1.5">
                        {m.type.includes('VISITE') ? <MapPin size={14} /> : <Video size={14} />} 
                        {m.type.includes('VISITE') ? "Sur place" : "Visioconférence"}
                      </div>
                    </div>
                  </div>
                  <SoftBadge tone="info">{m.status}</SoftBadge>
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground glass-inset p-3 rounded-xl italic">
                  "{m.notesLogged || "Aucune note spécifique pour ce rendez-vous."}"
                </p>
                <div className="flex flex-wrap gap-3">
                  <button className="px-4 py-2 rounded-lg bg-eerie text-ghost text-xs font-medium hover:opacity-90">
                    Confirmer présence
                  </button>
                  <button className="px-4 py-2 rounded-lg neu-sm hover:neu-pressable text-xs font-medium">
                    Reporter
                  </button>
                </div>
              </div>
            </NeuCard>
          ))}
          {upcoming.length === 0 && (
            <div className="py-12 text-center neu-inset rounded-3xl">
              <p className="text-muted-foreground">Aucun rendez-vous à venir.</p>
              <button className="mt-4 text-eerie font-medium text-sm flex items-center gap-2 mx-auto">
                <Calendar size={16} /> Demander un rendez-vous
              </button>
            </div>
          )}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-semibold text-muted-foreground">Historique des rendez-vous</h2>
        <div className="grid gap-3">
          {past.map((m) => (
            <div key={m.idMeeting} className="flex items-center gap-4 p-4 neu-sm rounded-xl opacity-70 italic">
              <Calendar size={18} className="text-muted-foreground shrink-0" />
              <div className="flex-1">
                <div className="text-sm font-medium">{m.type.replace('_', ' ')}</div>
                <div className="text-xs text-muted-foreground">
                  Le {format(new Date(m.scheduledAt), "d MMMM yyyy", { locale: fr })}
                </div>
              </div>
              <SoftBadge tone="success">Terminé</SoftBadge>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
