import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { NeuCard } from "@/components/ui/neu-card";
import { Avatar, LeadScore, StageBadge } from "@/components/ui/design-bits";
import { clients } from "@/lib/mock-data";
import { Phone, Calendar, FileText, MessageSquarePlus, CheckCircle2, Clock, Users, FolderCheck, Sparkles } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/agent/")({
  component: AgentDashboard,
});

const meetings = [
  { time: "09:30", client: "Karim Benchekroun", type: "Visite — Anfa" },
  { time: "11:00", client: "Imane Bennani", type: "Appel découverte" },
  { time: "14:30", client: "Leila Tazi", type: "Signature compromis" },
  { time: "16:00", client: "Nadia Cherkaoui", type: "Visite — Bourgogne" },
];

const tasks = [
  { type: "Appel", client: "Youssef Amrani", time: "10:00", done: false },
  { type: "Suivi", client: "Karim Benchekroun", time: "13:00", done: true },
  { type: "Visite", client: "Imane Bennani", time: "15:30", done: false },
];

const kpis = [
  { label: "Mes clients actifs", value: 18, icon: Users },
  { label: "RDV cette semaine", value: 12, icon: Calendar },
  { label: "Contrats en attente", value: 3, icon: FileText },
  { label: "Score moyen leads", value: 71, icon: FolderCheck },
];

function AgentDashboard() {
  const priorities = [...clients].filter((c) => c.agent === "Sara El Idrissi").sort((a, b) => b.score - a.score);
  const [taskList, setTaskList] = useState(tasks);

  return (
    <div className="space-y-6 md:space-y-8 max-w-[1400px]">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Bonjour Sara 🌿</p>
          <h1 className="text-2xl md:text-3xl font-bold mt-1">Votre journée commence bien</h1>
        </div>
        <div className="neu-sm rounded-full px-4 py-2 text-sm">
          Score mensuel : <span className="font-bold">87</span>
        </div>
      </div>

      {/* Planning du jour */}
      <div className="glass-dark rounded-3xl p-4 md:p-6">
        <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
          <h2 className="font-semibold text-ghost flex items-center gap-2"><Clock size={16} /> Aujourd'hui · 4 rendez-vous</h2>
          <span className="text-xs text-ghost/60">Mardi 18 novembre</span>
        </div>
        <div className="relative overflow-x-auto soft-scroll">
          <div className="absolute left-0 right-0 top-1/2 h-px bg-ghost/20" />
          <div className="relative flex justify-between gap-4 min-w-[480px]">
            {meetings.map((m, i) => (
              <Link key={i} to="/agent/dossier" className="flex flex-col items-center gap-3 group flex-1 min-w-[100px]">
                <div className="glass rounded-2xl px-3 py-1.5 text-xs font-semibold">{m.time}</div>
                <div className="w-3 h-3 rounded-full bg-vanilla ring-4 ring-eerie" />
                <div className="text-center">
                  <Avatar name={m.client} size={36} />
                  <div className="text-xs font-medium text-ghost mt-2">{m.client}</div>
                  <div className="text-[10px] text-ghost/60">{m.type}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {kpis.map((k) => {
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
            {priorities.slice(0, 5).map((c) => (
              <Link key={c.id} to="/agent/dossier" className="flex flex-wrap items-center gap-3 md:gap-4 p-3 rounded-xl hover:bg-alice/40 transition-colors">
                <Avatar name={c.name} size={44} />
                <div className="flex-1 min-w-[140px]">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">{c.name}</span>
                    <StageBadge stage={c.stage} />
                  </div>
                  <p className="text-xs text-muted-foreground italic mt-0.5">→ {c.recommendation}</p>
                  <div className="text-[10px] text-muted-foreground mt-1">Dernière interaction : {c.lastInteraction}</div>
                </div>
                <LeadScore score={c.score} size={48} />
                <div className="flex gap-1" onClick={(e) => e.preventDefault()}>
                  <button onClick={() => toast(`Dossier ${c.name}`)} className="w-9 h-9 rounded-lg neu-sm hover:neu-pressable flex items-center justify-center" aria-label="Dossier"><FileText size={14} /></button>
                  <button onClick={() => toast.success(`Message envoyé à ${c.name}`)} className="w-9 h-9 rounded-lg neu-sm hover:neu-pressable flex items-center justify-center" aria-label="Message"><MessageSquarePlus size={14} /></button>
                  <button onClick={() => toast(`Appel vers ${c.phone}…`)} className="w-9 h-9 rounded-lg neu-sm hover:neu-pressable flex items-center justify-center" aria-label="Appeler"><Phone size={14} /></button>
                </div>
              </Link>
            ))}
          </div>
        </NeuCard>

        {/* Tasks */}
        <NeuCard>
          <h2 className="font-semibold mb-5">Tâches du jour</h2>
          <div className="space-y-3">
            {taskList.map((t, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl neu-sm">
                <button
                  onClick={() => setTaskList((prev) => prev.map((x, j) => j === i ? { ...x, done: !x.done } : x))}
                  className={`w-6 h-6 rounded-md flex items-center justify-center transition-colors ${t.done ? "bg-honeydew" : "neu-inset hover:bg-honeydew/30"}`}
                  aria-label="Toggle tâche"
                >
                  {t.done && <CheckCircle2 size={14} />}
                </button>
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-medium ${t.done ? "line-through text-muted-foreground" : ""}`}>{t.type} — {t.client}</div>
                  <div className="text-xs text-muted-foreground">{t.time}</div>
                </div>
              </div>
            ))}
          </div>
        </NeuCard>
      </div>
    </div>
  );
}
