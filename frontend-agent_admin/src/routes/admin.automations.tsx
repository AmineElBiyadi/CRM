import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { NeuCard } from "@/components/ui/neu-card";
import { SoftBadge } from "@/components/ui/design-bits";
import { Workflow, Mail, Bell, CalendarClock, FileSignature, CheckCircle2, XCircle, X } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/automations")({
  component: AutomationsPage,
});

const initialWorkflows = [
  { id: "w1", name: "Alerte lead froid", desc: "Notifie l'agent si un lead chaud n'est pas contacté depuis 10j", icon: Bell, active: true, last: "il y a 2h" },
  { id: "w2", name: "Email d'intégration", desc: "Envoie un email de bienvenue dès la création d'un client", icon: Mail, active: true, last: "il y a 30 min" },
  { id: "w3", name: "Relance signature", desc: "Relance automatique si contrat non signé après 5 jours", icon: FileSignature, active: true, last: "hier" },
  { id: "w4", name: "Rappel RDV J-1", desc: "SMS et email au client la veille du rendez-vous", icon: CalendarClock, active: false, last: "il y a 8j" },
];

const logs = [
  { date: "18/11 14:32", workflow: "Alerte lead froid", client: "Nadia Cherkaoui", status: "ok", detail: "Email + push envoyés à Sara El Idrissi." },
  { date: "18/11 13:10", workflow: "Email d'intégration", client: "Hicham Drissi", status: "ok", detail: "Template FR · ouverture confirmée." },
  { date: "18/11 11:45", workflow: "Relance signature", client: "Leila Tazi", status: "fail", detail: "Échec SMTP — destinataire injoignable." },
  { date: "18/11 09:20", workflow: "Email d'intégration", client: "Imane Bennani", status: "ok", detail: "Template FR · délai 2.1s." },
];

function AutomationsPage() {
  const [wfs, setWfs] = useState(initialWorkflows);
  const [journal, setJournal] = useState<string | null>(null);

  const toggle = (id: string) => {
    setWfs((prev) => prev.map((w) => (w.id === id ? { ...w, active: !w.active } : w)));
    const w = wfs.find((x) => x.id === id);
    toast.success(`${w?.name} ${w?.active ? "désactivé" : "activé"}`);
  };

  return (
    <div className="space-y-6 md:space-y-8 max-w-[1400px]">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Automatisations</h1>
        <p className="text-sm text-muted-foreground mt-1">Workflows n8n connectés au CRM</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {wfs.map((w) => {
          const Icon = w.icon;
          return (
            <NeuCard key={w.id}>
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${w.active ? "bg-honeydew" : "bg-muted"}`}>
                  <Icon size={20} strokeWidth={1.8} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-semibold truncate">{w.name}</h3>
                    <button
                      onClick={() => toggle(w.id)}
                      className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${w.active ? "bg-honeydew" : "neu-inset"}`}
                      aria-label="Toggle"
                    >
                      <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-ghost shadow transition-transform ${w.active ? "translate-x-5" : "translate-x-0.5"}`} />
                    </button>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{w.desc}</p>
                  <div className="flex items-center justify-between mt-3 text-xs">
                    <span className="text-muted-foreground">Dernière exéc. : {w.last}</span>
                    <button onClick={() => setJournal(w.name)} className="font-medium hover:underline">Voir journal →</button>
                  </div>
                </div>
              </div>
            </NeuCard>
          );
        })}
      </div>

      <NeuCard>
        <h2 className="font-semibold mb-5 flex items-center gap-2"><Workflow size={16} /> Règles métier</h2>
        <div className="grid md:grid-cols-3 gap-5">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Jours avant alerte lead froid</label>
            <input type="number" defaultValue={10} className="mt-2 w-full px-4 py-3 neu-inset rounded-lg bg-transparent focus:outline-none" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Agent de secours</label>
            <select className="mt-2 w-full px-4 py-3 neu-inset rounded-lg bg-transparent focus:outline-none">
              <option>Sara El Idrissi</option>
              <option>Mehdi Bouazza</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Délai relance signature (j)</label>
            <input type="number" defaultValue={5} className="mt-2 w-full px-4 py-3 neu-inset rounded-lg bg-transparent focus:outline-none" />
          </div>
        </div>
        <div className="mt-5">
          <label className="text-xs font-medium text-muted-foreground">Modèle email d'intégration</label>
          <textarea
            rows={4}
            defaultValue="Bonjour {{client_name}}, bienvenue chez Rawabet. Votre agent {{agent_name}} vous contactera sous 24h…"
            className="mt-2 w-full px-4 py-3 neu-inset rounded-lg bg-transparent focus:outline-none text-sm"
          />
        </div>
        <button
          onClick={() => toast.success("Règles sauvegardées")}
          className="mt-5 px-5 py-2.5 rounded-xl bg-eerie text-ghost text-sm font-medium hover:opacity-90"
        >
          Enregistrer
        </button>
      </NeuCard>

      <NeuCard>
        <h2 className="font-semibold mb-5">Journal d'exécution</h2>
        <div className="space-y-2">
          {logs.map((l, i) => (
            <button
              key={i}
              onClick={() => setJournal(l.workflow)}
              className="w-full flex flex-wrap items-center gap-3 md:gap-4 p-3 rounded-lg hover:bg-alice/30 transition-colors text-left"
            >
              <span className="text-xs text-muted-foreground w-24 font-mono">{l.date}</span>
              <span className="flex-1 text-sm font-medium min-w-[140px]">{l.workflow}</span>
              <span className="text-sm text-muted-foreground">{l.client}</span>
              <SoftBadge tone={l.status === "ok" ? "success" : "danger"}>
                {l.status === "ok" ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                {l.status === "ok" ? "Succès" : "Échec"}
              </SoftBadge>
            </button>
          ))}
        </div>
      </NeuCard>

      {journal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setJournal(null)}>
          <div className="absolute inset-0 bg-eerie/60 backdrop-blur-sm" />
          <div className="relative bg-ghost rounded-3xl max-w-xl w-full p-6 md:p-8 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setJournal(null)} className="absolute top-4 right-4 w-9 h-9 rounded-full neu-sm flex items-center justify-center" aria-label="Fermer">
              <X size={16} />
            </button>
            <h2 className="text-xl font-bold mb-1">{journal}</h2>
            <p className="text-xs text-muted-foreground mb-5">Journal des 7 derniers jours</p>
            <div className="space-y-3 max-h-80 overflow-y-auto soft-scroll">
              {logs.map((l, i) => (
                <div key={i} className="neu-sm rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono">{l.date}</span>
                    <SoftBadge tone={l.status === "ok" ? "success" : "danger"}>{l.status === "ok" ? "OK" : "Échec"}</SoftBadge>
                  </div>
                  <div className="text-sm font-medium mt-1">{l.client}</div>
                  <div className="text-xs text-muted-foreground mt-1">{l.detail}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
