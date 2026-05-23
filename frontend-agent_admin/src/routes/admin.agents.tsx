import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { NeuCard } from "@/components/ui/neu-card";
import { Avatar, SoftBadge, StageBadge } from "@/components/ui/design-bits";
import { agents as seedAgents, clients, type Agent } from "@/lib/mock-data";
import { Plus, Eye, Pencil, Power, Phone, Mail, X, Check } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/agents")({
  component: AgentsPage,
});

type Mode = "view" | "edit";

function AgentsPage() {
  const [list, setList] = useState<Agent[]>(seedAgents);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("view");
  const [creating, setCreating] = useState(false);

  const detail = list.find((a) => a.id === detailId) ?? null;

  const toggleActive = (id: string) => {
    setList((prev) =>
      prev.map((a) => (a.id === id ? { ...a, active: !a.active } : a))
    );
    const a = list.find((x) => x.id === id);
    toast.success(`${a?.name} ${a?.active ? "désactivé" : "réactivé"}`);
  };

  const openDetail = (a: Agent) => {
    setDetailId(a.id);
    setMode("view");
  };

  const saveAgent = (data: Agent) => {
    setList((prev) => prev.map((a) => (a.id === data.id ? data : a)));
    setMode("view");
    toast.success("Profil mis à jour");
  };

  const createAgent = (data: Omit<Agent, "id">) => {
    const id = `a${Date.now()}`;
    setList((prev) => [{ ...data, id }, ...prev]);
    setCreating(false);
    toast.success(`${data.name} ajouté à l'équipe`);
  };

  return (
    <div className="space-y-6 md:space-y-8 max-w-[1400px]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Gestion des agents</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {list.length} membres dans votre équipe
          </p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-eerie text-ghost text-sm font-medium hover:opacity-90"
        >
          <Plus size={16} /> Nouvel agent
        </button>
      </div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5 md:gap-6">
        {list.map((a) => (
          <NeuCard
            key={a.id}
            className={cn(
              "flex flex-col gap-4 transition-all",
              detailId === a.id && "ring-2 ring-eerie/30"
            )}
          >
            <div className="flex items-start justify-between">
              <Avatar name={a.name} size={56} />
              <SoftBadge tone={a.active ? "success" : "neutral"}>
                {a.active ? "Actif" : "Inactif"}
              </SoftBadge>
            </div>
            <div>
              <h3 className="font-bold">{a.name}</h3>
              <div className="space-y-1 mt-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-2 truncate">
                  <Mail size={12} /> {a.email}
                </div>
                <div className="flex items-center gap-2">
                  <Phone size={12} /> {a.phone}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="neu-inset rounded-lg p-2 text-center">
                <div className="font-bold">{a.activeClients}</div>
                <div className="text-[10px] uppercase text-muted-foreground">
                  Clients
                </div>
              </div>
              <div className="neu-inset rounded-lg p-2 text-center">
                <div className="font-bold text-[oklch(0.55_0.15_145)]">
                  {a.closedThisMonth}
                </div>
                <div className="text-[10px] uppercase text-muted-foreground">
                  Clôt. mois
                </div>
              </div>
            </div>
            <div className="text-xs text-muted-foreground">
              Dernière activité : {a.lastActivity}
            </div>
            <div className="flex gap-2 pt-2 border-t border-border">
              <button
                onClick={() => openDetail(a)}
                className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg neu-sm hover:neu-pressable text-xs"
              >
                <Eye size={14} /> Détails
              </button>
              <button
                onClick={() => {
                  setDetailId(a.id);
                  setMode("edit");
                }}
                className="w-10 h-10 rounded-lg neu-sm hover:neu-pressable flex items-center justify-center"
                aria-label="Modifier"
              >
                <Pencil size={14} />
              </button>
              <button
                onClick={() => toggleActive(a.id)}
                className="w-10 h-10 rounded-lg neu-sm hover:neu-pressable flex items-center justify-center"
                aria-label="Activer/désactiver"
              >
                <Power size={14} />
              </button>
            </div>
          </NeuCard>
        ))}
      </div>

      {/* Side panel — Agent detail */}
      <AgentSidePanel
        agent={detail}
        mode={mode}
        onClose={() => setDetailId(null)}
        onEdit={() => setMode("edit")}
        onCancelEdit={() => setMode("view")}
        onSave={saveAgent}
        onToggleActive={toggleActive}
      />

      {/* Modal — Create agent */}
      {creating && (
        <CreateAgentModal
          onClose={() => setCreating(false)}
          onCreate={createAgent}
        />
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────── */

function AgentSidePanel({
  agent,
  mode,
  onClose,
  onEdit,
  onCancelEdit,
  onSave,
  onToggleActive,
}: {
  agent: Agent | null;
  mode: Mode;
  onClose: () => void;
  onEdit: () => void;
  onCancelEdit: () => void;
  onSave: (a: Agent) => void;
  onToggleActive: (id: string) => void;
}) {
  const open = !!agent;
  const agentClients = useMemo(
    () => (agent ? clients.filter((c) => c.agent === agent.name) : []),
    [agent]
  );
  const stageBuckets = useMemo(() => {
    const groups: Record<string, number> = {
      froid: 0,
      tiede: 0,
      chaud: 0,
      negociation: 0,
    };
    agentClients.forEach((c) => {
      if (groups[c.stage] !== undefined) groups[c.stage] += 1;
    });
    return groups;
  }, [agentClients]);

  const stageMeta: { key: keyof typeof stageBuckets; label: string; bar: string }[] = [
    { key: "froid", label: "Froid", bar: "bg-alice" },
    { key: "tiede", label: "Tiède", bar: "bg-honeydew" },
    { key: "chaud", label: "Chaud", bar: "bg-vanilla" },
    { key: "negociation", label: "Négociation", bar: "bg-[oklch(0.82_0.1_55)]" },
  ];
  const max = Math.max(1, ...Object.values(stageBuckets));

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={cn(
          "fixed inset-0 z-40 bg-eerie/40 transition-opacity",
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
      />
      {/* Panel */}
      <aside
        className={cn(
          "fixed top-0 right-0 z-50 h-screen w-full sm:w-[440px] bg-ghost/60 backdrop-blur-2xl border-l border-white/30 shadow-2xl flex flex-col transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "translate-x-full"
        )}
        aria-hidden={!open}
      >
        {agent && (
          <>
            <div className="p-6 flex items-start gap-4 border-b border-border">
              <Avatar name={agent.name} size={56} />
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-bold truncate">{agent.name}</h2>
                <div className="text-xs text-muted-foreground truncate">
                  {agent.email}
                </div>
                <div className="text-xs text-muted-foreground">{agent.phone}</div>
              </div>
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-full neu-sm flex items-center justify-center shrink-0"
                aria-label="Fermer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 soft-scroll">
              {mode === "view" ? (
                <>
                  {/* Quick stats */}
                  <div className="grid grid-cols-3 gap-2">
                    <Stat label="Dossiers" value={agent.activeClients} />
                    <Stat
                      label="Clôt."
                      value={agent.closedThisMonth}
                      tone="success"
                    />
                    <Stat
                      label="Conv."
                      value={`${Math.round(
                        (agent.closedThisMonth /
                          Math.max(agent.activeClients, 1)) *
                          100
                      )}%`}
                    />
                  </div>

                  {/* Charge par étape */}
                  <section>
                    <h3 className="font-semibold text-sm mb-3">Charge par étape</h3>
                    <div className="space-y-2.5">
                      {stageMeta.map((s) => {
                        const v = stageBuckets[s.key];
                        return (
                          <div
                            key={s.key}
                            className="grid grid-cols-[80px_1fr_24px] items-center gap-3 text-xs"
                          >
                            <span className="text-muted-foreground">
                              {s.label}
                            </span>
                            <div className="h-2.5 rounded-full neu-inset overflow-hidden">
                              <div
                                className={cn("h-full rounded-full", s.bar)}
                                style={{ width: `${(v / max) * 100}%` }}
                              />
                            </div>
                            <span className="text-right font-semibold">{v}</span>
                          </div>
                        );
                      })}
                    </div>
                  </section>

                  {/* Derniers clients */}
                  <section>
                    <h3 className="font-semibold text-sm mb-3">
                      {Math.min(5, agentClients.length)} derniers clients
                    </h3>
                    <div className="space-y-2">
                      {agentClients.slice(0, 5).map((c) => (
                        <div
                          key={c.id}
                          className="flex items-center gap-3 p-2.5 rounded-xl neu-sm"
                        >
                          <Avatar name={c.name} size={32} />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">
                              {c.name}
                            </div>
                            <div className="text-[10px] text-muted-foreground">
                              {c.type} · {c.budget}
                            </div>
                          </div>
                          <StageBadge stage={c.stage} />
                        </div>
                      ))}
                      {agentClients.length === 0 && (
                        <p className="text-xs text-muted-foreground text-center py-4">
                          Aucun client assigné.
                        </p>
                      )}
                    </div>
                  </section>

                  <p className="text-xs text-muted-foreground">
                    Dernière activité : {agent.lastActivity}
                  </p>
                </>
              ) : (
                <EditAgentForm
                  agent={agent}
                  onCancel={onCancelEdit}
                  onSave={onSave}
                />
              )}
            </div>

            {mode === "view" && (
              <div className="p-5 border-t border-border space-y-2">
                <button
                  onClick={() => {
                    toast.success(
                      `${agentClients.length} client(s) replacés dans la file de réassignation`
                    );
                    onClose();
                  }}
                  className="w-full py-3 rounded-xl bg-eerie text-ghost text-sm font-medium hover:opacity-90"
                >
                  Réassigner tous les clients
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={onEdit}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl neu-sm hover:neu-pressable text-sm font-medium"
                  >
                    <Pencil size={14} /> Modifier
                  </button>
                  <button
                    onClick={() => onToggleActive(agent.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl neu-sm hover:neu-pressable text-sm font-medium"
                  >
                    <Power size={14} /> {agent.active ? "Désactiver" : "Réactiver"}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </aside>
    </>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string | number;
  tone?: "success";
}) {
  return (
    <div className="neu-inset rounded-lg p-3 text-center">
      <div
        className={cn(
          "text-xl font-bold",
          tone === "success" && "text-[oklch(0.55_0.15_145)]"
        )}
      >
        {value}
      </div>
      <div className="text-[10px] uppercase text-muted-foreground">{label}</div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────── */

function EditAgentForm({
  agent,
  onCancel,
  onSave,
}: {
  agent: Agent;
  onCancel: () => void;
  onSave: (a: Agent) => void;
}) {
  const [name, setName] = useState(agent.name);
  const [email, setEmail] = useState(agent.email);
  const [phone, setPhone] = useState(agent.phone);
  const [active, setActive] = useState(agent.active);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave({ ...agent, name, email, phone, active });
      }}
      className="space-y-4"
    >
      <Field label="Nom complet">
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="input-neu"
        />
      </Field>
      <Field label="Email">
        <input
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input-neu"
        />
      </Field>
      <Field label="Téléphone">
        <input
          required
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="input-neu"
        />
      </Field>
      <label className="flex items-center gap-3 text-sm cursor-pointer select-none">
        <button
          type="button"
          onClick={() => setActive((v) => !v)}
          className={cn(
            "w-10 h-6 rounded-full neu-inset flex items-center transition-all",
            active ? "justify-end bg-honeydew" : "justify-start"
          )}
        >
          <span className="w-5 h-5 rounded-full bg-ghost neu-sm m-0.5" />
        </button>
        Compte actif
      </label>
      <div className="flex gap-2 pt-2">
        <button
          type="submit"
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-eerie text-ghost text-sm font-medium"
        >
          <Check size={14} /> Enregistrer
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-2.5 rounded-xl neu-sm text-sm font-medium"
        >
          Annuler
        </button>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

/* ─────────────────────────────────────────────────────────── */

function CreateAgentModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (a: Omit<Agent, "id">) => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [active, setActive] = useState(true);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-eerie/60 backdrop-blur-sm" />
      <div
        className="relative bg-ghost rounded-3xl max-w-md w-full p-7 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 rounded-full neu-sm flex items-center justify-center"
          aria-label="Fermer"
        >
          <X size={16} />
        </button>
        <h2 className="text-xl font-bold">Nouvel agent</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Ajoutez un commercial à votre équipe.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onCreate({
              name,
              email,
              phone,
              active,
              activeClients: 0,
              closedThisMonth: 0,
              lastActivity: "à l'instant",
            });
          }}
          className="mt-5 space-y-4"
        >
          <Field label="Nom complet">
            <input
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ex : Sara El Idrissi"
              className="input-neu"
            />
          </Field>
          <Field label="Email">
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="prenom@smartestate.ma"
              className="input-neu"
            />
          </Field>
          <Field label="Téléphone">
            <input
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+212 6 ..."
              className="input-neu"
            />
          </Field>
          <label className="flex items-center gap-3 text-sm cursor-pointer select-none">
            <button
              type="button"
              onClick={() => setActive((v) => !v)}
              className={cn(
                "w-10 h-6 rounded-full neu-inset flex items-center transition-all",
                active ? "justify-end bg-honeydew" : "justify-start"
              )}
            >
              <span className="w-5 h-5 rounded-full bg-ghost neu-sm m-0.5" />
            </button>
            Activer immédiatement
          </label>
          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-eerie text-ghost text-sm font-medium"
            >
              Ajouter à l'équipe
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl neu-sm text-sm font-medium"
            >
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
