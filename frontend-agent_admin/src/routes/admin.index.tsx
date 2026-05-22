import { createFileRoute, Link } from "@tanstack/react-router";
import { NeuCard } from "@/components/ui/neu-card";
import { Avatar, SoftBadge } from "@/components/ui/design-bits";
import { agents, pipelineStages } from "@/lib/mock-data";
import { ArrowUpRight, ArrowDownRight, TrendingUp, AlertTriangle, FileDown, FileText, Snowflake, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

const kpis = [
  { label: "Dossiers actifs", value: "127", trend: "+12%", up: true, icon: TrendingUp, tone: "bg-alice" },
  { label: "Clôturés ce mois", value: "23", trend: "+18%", up: true, icon: CheckCircle2, tone: "bg-honeydew" },
  { label: "Leads froids", value: "31", trend: "+4", up: false, icon: Snowflake, tone: "bg-vanilla" },
  { label: "Taux conversion", value: "18%", trend: "+2.4pt", up: true, icon: TrendingUp, tone: "bg-alice" },
];

const alerts = [
  { client: "Karim Benchekroun", agent: "Sara El Idrissi", reason: "Lead chaud sans contact depuis 11j", tone: "warn" as const },
  { client: "Leila Tazi", agent: "Sara El Idrissi", reason: "Contrat en attente de signature depuis 7j", tone: "warn" as const },
  { client: "Omar Slaoui", agent: "Mehdi Bouazza", reason: "Document conformité manquant", tone: "danger" as const },
];

function AdminDashboard() {
  return (
    <div className="space-y-6 md:space-y-8 max-w-[1400px]">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Bonjour Rachid 👋</p>
          <h1 className="text-2xl md:text-3xl font-bold mt-1">Vue d'ensemble de l'agence</h1>
        </div>
        <div className="text-xs text-muted-foreground">Semaine 47 · 18 nov. 2025</div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <NeuCard key={k.label}>
              <div className="flex items-start justify-between">
                <div className={`w-10 h-10 rounded-xl ${k.tone} flex items-center justify-center`}>
                  <Icon size={18} strokeWidth={1.8} />
                </div>
                <span className={`text-xs flex items-center gap-1 font-medium ${k.up ? "text-[oklch(0.55_0.15_145)]" : "text-destructive"}`}>
                  {k.up ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />} {k.trend}
                </span>
              </div>
              <div className="mt-5">
                <div className="text-3xl font-bold tracking-tight">{k.value}</div>
                <div className="text-xs text-muted-foreground mt-1">{k.label}</div>
              </div>
            </NeuCard>
          );
        })}
      </div>

      {/* Pipeline macro */}
      <NeuCard>
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-semibold">Pipeline — vue macro</h2>
          <span className="text-xs text-muted-foreground">127 dossiers répartis</span>
        </div>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {pipelineStages.map((s, i) => {
            const counts = [31, 24, 28, 19, 18, 7];
            return (
              <Link key={s.key} to="/admin/pipeline" className="neu-inset p-3 rounded-xl block hover:neu-sm transition-all">
                <div className={`h-1.5 rounded-full ${s.color} mb-3`} />
                <div className="text-xs text-muted-foreground">{s.label}</div>
                <div className="text-xl md:text-2xl font-bold mt-1">{counts[i]}</div>
              </Link>
            );
          })}
        </div>
      </NeuCard>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Agents perf */}
        <NeuCard>
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold">Performances agents</h2>
            <Link to="/admin/agents" className="text-xs text-muted-foreground hover:text-eerie">Voir tout →</Link>
          </div>
          <div className="space-y-3">
            {agents.slice(0, 5).map((a) => (
              <div key={a.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-alice/40 cursor-pointer transition-colors">
                <Avatar name={a.name} size={40} />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{a.name}</div>
                  <div className="text-xs text-muted-foreground">{a.lastActivity}</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-bold">{a.activeClients}</div>
                  <div className="text-[10px] text-muted-foreground uppercase">Actifs</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-bold text-[oklch(0.55_0.15_145)]">{a.closedThisMonth}</div>
                  <div className="text-[10px] text-muted-foreground uppercase">Clôt.</div>
                </div>
              </div>
            ))}
          </div>
        </NeuCard>

        {/* Alerts */}
        <NeuCard>
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold flex items-center gap-2"><AlertTriangle size={16} /> Alertes & actions</h2>
            <SoftBadge tone="warn">{alerts.length}</SoftBadge>
          </div>
          <div className="space-y-3">
            {alerts.map((a, i) => (
              <div key={i} className="p-4 neu-sm rounded-xl">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{a.client}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">Agent : {a.agent}</div>
                    <div className="text-xs mt-2">{a.reason}</div>
                  </div>
                  <SoftBadge tone={a.tone}>!</SoftBadge>
                </div>
                <button
                  onClick={() => toast.success(`Notification envoyée à ${a.agent}`)}
                  className="mt-3 text-xs font-medium px-3 py-1.5 rounded-lg neu-sm hover:neu-pressable"
                >
                  Alerter l'agent
                </button>
              </div>
            ))}
          </div>
        </NeuCard>
      </div>

      {/* Weekly report */}
      <NeuCard className="bg-alice/40 flex flex-col md:flex-row gap-6 items-center">
        <div className="w-14 h-14 rounded-2xl bg-vanilla flex items-center justify-center shrink-0">
          <FileText size={22} strokeWidth={1.8} />
        </div>
        <div className="flex-1">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Rapport hebdomadaire IA</div>
          <h3 className="font-bold text-lg mt-1">Synthèse semaine 46 disponible</h3>
          <p className="text-sm text-muted-foreground mt-1">Généré lundi à 08:00 · 4 pages · 12 insights stratégiques</p>
        </div>
        <button
          onClick={() => toast.success("Téléchargement du rapport hebdomadaire…")}
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-eerie text-ghost text-sm font-medium hover:opacity-90"
        >
          <FileDown size={16} /> Télécharger PDF
        </button>
      </NeuCard>
    </div>
  );
}
