import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { NeuCard } from "@/components/ui/neu-card";
import { Avatar, LeadScore, SoftBadge, StageBadge } from "@/components/ui/design-bits";
import { clients as seedClients, type Client } from "@/lib/mock-data";
import { Search, LayoutGrid, List, Plus, X } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/agent/clients")({
  component: ClientsPage,
});

const STAGE_OPTIONS = [
  { v: "all", label: "Toutes étapes" },
  { v: "chaud", label: "Chaud" },
  { v: "tiede", label: "Tiède" },
  { v: "froid", label: "Froid" },
  { v: "negociation", label: "Négociation" },
  { v: "cloture", label: "Clôturé" },
  { v: "perdu", label: "Perdu" },
] as const;

function ClientsPage() {
  const [view, setView] = useState<"grid" | "list">("grid");
  const [query, setQuery] = useState("");
  const [stage, setStage] = useState<string>("all");
  const [list, setList] = useState<Client[]>(seedClients);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", type: "Acheteur" as Client["type"], budget: "" });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return list.filter((c) => {
      if (stage !== "all" && c.stage !== stage) return false;
      if (!q) return true;
      return c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q);
    });
  }, [list, query, stage]);

  const submit = () => {
    if (!form.name.trim()) return;
    const c: Client = {
      id: String(Date.now()),
      name: form.name.trim(),
      type: form.type,
      email: `${form.name.toLowerCase().replace(/\s+/g, ".")}@mail.com`,
      phone: "+212 6XX XX XX XX",
      budget: form.budget || "—",
      source: "Saisie manuelle",
      agent: "Sara El Idrissi",
      stage: "froid",
      score: 20,
      lastInteraction: "à l'instant",
      recommendation: "Premier contact à planifier",
    };
    setList((prev) => [c, ...prev]);
    setCreating(false);
    setForm({ name: "", type: "Acheteur", budget: "" });
    toast.success(`${c.name} ajouté`);
  };

  return (
    <div className="space-y-6 max-w-[1400px] relative">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Mes clients</h1>
          <p className="text-sm text-muted-foreground mt-1">{filtered.length} / {list.length} dossiers</p>
        </div>
        <div className="flex items-center gap-2 md:gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[180px]">
            <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Chercher un client…"
              className="pl-10 pr-4 py-2.5 rounded-xl neu-inset bg-transparent text-sm w-full md:w-64 focus:outline-none"
            />
          </div>
          <select
            value={stage}
            onChange={(e) => setStage(e.target.value)}
            className="px-4 py-2.5 rounded-xl neu-sm bg-transparent text-sm focus:outline-none"
          >
            {STAGE_OPTIONS.map((s) => <option key={s.v} value={s.v}>{s.label}</option>)}
          </select>
          <div className="neu-sm rounded-xl p-1 flex gap-1">
            <button onClick={() => setView("grid")} aria-label="Grille" className={`w-9 h-9 rounded-lg flex items-center justify-center ${view === "grid" ? "neu-inset" : ""}`}><LayoutGrid size={14} /></button>
            <button onClick={() => setView("list")} aria-label="Liste" className={`w-9 h-9 rounded-lg flex items-center justify-center ${view === "list" ? "neu-inset" : ""}`}><List size={14} /></button>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <NeuCard className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <div className="w-14 h-14 rounded-2xl bg-alice flex items-center justify-center"><Search size={20} /></div>
          <div className="font-semibold">Aucun résultat</div>
          <p className="text-xs text-muted-foreground">Essayez d'autres mots-clés ou changez l'étape.</p>
        </NeuCard>
      ) : view === "grid" ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((c) => (
            <Link key={c.id} to="/agent/dossier">
              <NeuCard pressable className="h-full flex flex-col gap-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar name={c.name} size={48} />
                    <div className="min-w-0">
                      <div className="font-semibold truncate">{c.name}</div>
                      <SoftBadge tone={c.type === "Acheteur" ? "info" : "success"}>{c.type}</SoftBadge>
                    </div>
                  </div>
                  <LeadScore score={c.score} size={44} />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="text-muted-foreground">Budget</div>
                  <div className="font-semibold">{c.budget}</div>
                </div>
                <div className="flex items-center justify-between">
                  <StageBadge stage={c.stage} />
                  <span className="text-xs text-muted-foreground">{c.lastInteraction}</span>
                </div>
              </NeuCard>
            </Link>
          ))}
        </div>
      ) : (
        <NeuCard className="overflow-x-auto p-0 soft-scroll">
          <table className="w-full text-sm min-w-[720px]">
            <thead>
              <tr className="text-left text-xs text-muted-foreground border-b border-border">
                <th className="p-4">Client</th><th className="p-4">Type</th><th className="p-4">Budget</th>
                <th className="p-4">Étape</th><th className="p-4">Score</th><th className="p-4">Dernier contact</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="border-b border-border last:border-0 hover:bg-alice/30 cursor-pointer">
                  <td className="p-4">
                    <Link to="/agent/dossier" className="flex items-center gap-3">
                      <Avatar name={c.name} size={32} />
                      <span className="font-medium">{c.name}</span>
                    </Link>
                  </td>
                  <td className="p-4"><SoftBadge tone={c.type === "Acheteur" ? "info" : "success"}>{c.type}</SoftBadge></td>
                  <td className="p-4 font-semibold">{c.budget}</td>
                  <td className="p-4"><StageBadge stage={c.stage} /></td>
                  <td className="p-4"><LeadScore score={c.score} size={36} /></td>
                  <td className="p-4 text-muted-foreground">{c.lastInteraction}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </NeuCard>
      )}

      <button
        onClick={() => setCreating(true)}
        aria-label="Nouveau client"
        className="fixed bottom-6 right-6 md:bottom-8 md:right-8 w-14 h-14 rounded-full bg-eerie text-ghost shadow-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-transform z-30"
      >
        <Plus size={22} />
      </button>

      {creating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setCreating(false)}>
          <div className="absolute inset-0 bg-eerie/60 backdrop-blur-sm" />
          <div className="relative bg-ghost rounded-3xl max-w-md w-full p-6 md:p-7 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setCreating(false)} className="absolute top-4 right-4 w-9 h-9 rounded-full neu-sm flex items-center justify-center" aria-label="Fermer">
              <X size={16} />
            </button>
            <h2 className="text-xl font-bold">Nouveau client</h2>
            <p className="text-xs text-muted-foreground mt-1">Création rapide — vous pourrez compléter ensuite.</p>
            <div className="mt-5 space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Nom complet</label>
                <input
                  autoFocus
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="ex. Salma Bennani"
                  className="mt-2 w-full px-4 py-3 neu-inset rounded-lg bg-transparent focus:outline-none text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Type</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value as Client["type"] })}
                    className="mt-2 w-full px-4 py-3 neu-inset rounded-lg bg-transparent focus:outline-none text-sm"
                  >
                    <option value="Acheteur">Acheteur</option>
                    <option value="Vendeur">Vendeur</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Budget</label>
                  <input
                    value={form.budget}
                    onChange={(e) => setForm({ ...form, budget: e.target.value })}
                    placeholder="ex. 2.4M MAD"
                    className="mt-2 w-full px-4 py-3 neu-inset rounded-lg bg-transparent focus:outline-none text-sm"
                  />
                </div>
              </div>
            </div>
            <div className="mt-6 flex gap-2">
              <button onClick={submit} disabled={!form.name.trim()} className="flex-1 py-2.5 rounded-xl bg-eerie text-ghost text-sm font-medium disabled:opacity-40">Créer</button>
              <button onClick={() => setCreating(false)} className="px-5 py-2.5 rounded-xl neu-sm text-sm font-medium">Annuler</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
