import { createFileRoute } from "@tanstack/react-router";
import { Avatar } from "@/components/ui/design-bits";
import { CheckCircle2, FileText, Home, MessageSquare, Phone } from "lucide-react";

export const Route = createFileRoute("/client/chronologie")({
  component: ClientTimeline,
});

const events = [
  { date: "16 nov. 2025", icon: Home, title: "Visite — Appartement Anfa", desc: "Visite réalisée avec Sara El Idrissi. Retour très positif.", agent: "Sara El Idrissi", recent: true },
  { date: "14 nov. 2025", icon: Phone, title: "Appel de qualification", desc: "Précision sur les critères et le budget.", agent: "Sara El Idrissi", recent: true },
  { date: "12 nov. 2025", icon: FileText, title: "Mandat signé", desc: "Mandat de recherche officialisé.", agent: "Sara El Idrissi" },
  { date: "08 nov. 2025", icon: MessageSquare, title: "Premier contact", desc: "Formulaire reçu via le site web.", agent: "Équipe agence" },
  { date: "08 nov. 2025", icon: CheckCircle2, title: "Profil créé", desc: "Bienvenue chez SmartEstateHub !", agent: "Système" },
];

function ClientTimeline() {
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Ma chronologie</h1>
        <p className="text-sm text-muted-foreground mt-1">Tous les moments clés de votre parcours</p>
      </div>

      <div className="relative py-4">
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-border -translate-x-1/2" />
        {events.map((e, i) => {
          const Icon = e.icon;
          const left = i % 2 === 0;
          return (
            <div key={i} className="relative flex items-center mb-10">
              <div className={`flex-1 ${left ? "text-right pr-8" : "order-3 text-left pl-8"}`}>
                {left && <div className="text-xs text-muted-foreground mb-1">{e.date}</div>}
                {!left && (
                  <div className={`neu p-5 rounded-2xl inline-block ${e.recent ? "bg-alice/40" : ""}`}>
                    <h3 className="font-semibold">{e.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{e.desc}</p>
                    <div className="flex items-center gap-2 mt-3">
                      <Avatar name={e.agent} size={20} />
                      <span className="text-xs">{e.agent}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="relative z-10 w-12 h-12 rounded-full bg-honeydew ring-4 ring-ghost flex items-center justify-center shrink-0 order-2">
                <Icon size={18} />
              </div>

              <div className={`flex-1 ${!left ? "text-right pr-8" : "order-3 pl-8"}`}>
                {!left && <div className="text-xs text-muted-foreground mb-1">{e.date}</div>}
                {left && (
                  <div className={`neu p-5 rounded-2xl inline-block text-left ${e.recent ? "bg-alice/40" : ""}`}>
                    <h3 className="font-semibold">{e.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{e.desc}</p>
                    <div className="flex items-center gap-2 mt-3">
                      <Avatar name={e.agent} size={20} />
                      <span className="text-xs">{e.agent}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
