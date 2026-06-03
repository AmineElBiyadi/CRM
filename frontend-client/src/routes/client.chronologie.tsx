import { createFileRoute } from "@tanstack/react-router";
import { Avatar } from "@/components/ui/design-bits";
import { CheckCircle2, FileText, Home, MessageSquare, Phone, Calendar, FileSignature, Clock, Loader2 } from "lucide-react";
import { useClientData, TimelineEvent } from "@/hooks/use-client-data";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export const Route = createFileRoute("/client/chronologie")({
  component: ClientTimeline,
});

const iconMap: Record<string, any> = {
  INTERACTION: MessageSquare,
  MEETING: Calendar,
  DOCUMENT: FileText,
  CONTRACT: FileSignature,
  STAGE_UPDATE: CheckCircle2,
};

function ClientTimeline() {
  const { data, isLoading } = useClientData();

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center p-12">
        <Loader2 className="animate-spin text-vanilla" size={32} />
      </div>
    );
  }

  const events = data?.timeline || [];

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Ma chronologie</h1>
        <p className="text-sm text-muted-foreground mt-1">Tous les moments clés de votre parcours</p>
      </div>

      {events.length > 0 ? (
        <div className="relative py-4">
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-border -translate-x-1/2" />
          {events.map((e, i) => {
            const Icon = iconMap[e.type] || Clock;
            const left = i % 2 === 0;
            const dateStr = format(new Date(e.date), "d MMM yyyy", { locale: fr });

            return (
              <div key={i} className="relative flex items-center mb-10">
                <div className={`flex-1 ${left ? "text-right pr-8" : "order-3 text-left pl-8"}`}>
                  {left && <div className="text-xs text-muted-foreground mb-1">{dateStr}</div>}
                  {!left && (
                    <div className="neu p-5 rounded-2xl inline-block bg-alice/20">
                      <h3 className="font-semibold">{e.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{e.description}</p>
                      <div className="flex items-center gap-2 mt-3">
                        <Avatar name={e.agentName || "Système"} size={20} />
                        <span className="text-xs">{e.agentName || "Système"}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="relative z-10 w-12 h-12 rounded-full bg-honeydew ring-4 ring-ghost flex items-center justify-center shrink-0 order-2">
                  <Icon size={18} className="text-eerie" />
                </div>

                <div className={`flex-1 ${!left ? "text-right pr-8" : "order-3 pl-8"}`}>
                  {!left && <div className="text-xs text-muted-foreground mb-1">{dateStr}</div>}
                  {left && (
                    <div className="neu p-5 rounded-2xl inline-block text-left bg-alice/20">
                      <h3 className="font-semibold">{e.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{e.description}</p>
                      <div className="flex items-center gap-2 mt-3">
                        <Avatar name={e.agentName || "Système"} size={20} />
                        <span className="text-xs">{e.agentName || "Système"}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-20 text-center neu-inset rounded-3xl">
          <p className="text-muted-foreground">Votre historique commencera dès les premières actions sur votre dossier.</p>
        </div>
      )}
    </div>
  );
}
