import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { NeuCard } from "@/components/ui/neu-card";
import { Avatar, SoftBadge, StageBadge } from "@/components/ui/design-bits";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  Eye,
  Pencil,
  Power,
  RotateCw,
  Phone,
  Mail,
  X,
  Check,
  Grid3X3,
  List,
  ArrowUpDown,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  createAdminAgent,
  fetchAdminAgentDetail,
  fetchAdminAgents,
  updateAdminAgent,
  updateAdminAgentStatus,
  type AdminAgentDetailDto,
  type AdminAgentDto,
  type AdminAgentSortDirection,
  type AdminAgentSortKey,
} from "@/api/adminDashboardApi";

export const Route = createFileRoute("/admin/agents")({
  component: AgentsPage,
});

type Mode = "view" | "edit";
type Agent = AdminAgentDto;
type SortKey = AdminAgentSortKey;
type SortDirection = AdminAgentSortDirection;
type ViewMode = "cards" | "list";

function AgentsPage() {
  const [list, setList] = useState<Agent[]>([]);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("view");
  const [creating, setCreating] = useState(false);
  const [savingCreate, setSavingCreate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("workload");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const [agentDetail, setAgentDetail] = useState<AdminAgentDetailDto | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [savingAgent, setSavingAgent] = useState(false);

  const detail = list.find((a) => a.id === detailId) ?? null;

  const upsertAgent = useCallback((agent: Agent) => {
    setList((prev) => {
      const exists = prev.some((a) => a.id === agent.id);
      if (!exists) return [agent, ...prev];
      return prev.map((a) => (a.id === agent.id ? agent : a));
    });
  }, []);

  const loadAgents = useCallback(async () => {
    setLoading(true);
    try {
      const agents = await fetchAdminAgents(sortKey, sortDirection);
      setList(agents);
      setError(null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Impossible de charger les agents.";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [sortKey, sortDirection]);

  useEffect(() => {
    loadAgents();
  }, [loadAgents]);

  const loadAgentDetail = useCallback(async (id: string) => {
    setDetailLoading(true);
    try {
      const data = await fetchAdminAgentDetail(id);
      setAgentDetail(data);
      upsertAgent(data.agent);
    } catch (err) {
      setAgentDetail(null);
      toast.error(
        err instanceof Error ? err.message : "Impossible de charger le profil agent.",
      );
    } finally {
      setDetailLoading(false);
    }
  }, [upsertAgent]);

  useEffect(() => {
    if (!detailId) {
      setAgentDetail(null);
      return;
    }
    loadAgentDetail(detailId);
  }, [detailId, loadAgentDetail]);

  const toggleActive = async (id: string) => {
    if (actionId) return;
    const a =
      list.find((x) => x.id === id) ??
      (agentDetail?.agent.id === id ? agentDetail.agent : undefined);
    if (!a) {
      toast.error("Agent introuvable.");
      return;
    }
    setActionId(id);
    try {
      const updated = await updateAdminAgentStatus(id, !a.active);
      upsertAgent(updated);
      setAgentDetail((prev) =>
        prev?.agent.id === id ? { ...prev, agent: updated } : prev,
      );
      if (detailId === id) await loadAgentDetail(id);
      toast.success(
        updated.active
          ? `${updated.name} a été réactivé.`
          : `${updated.name} a été désactivé.`,
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Mise à jour impossible.");
    } finally {
      setActionId(null);
    }
  };

  const openDetail = (a: Agent) => {
    setDetailId(a.id);
    setMode("view");
  };

  const saveAgent = async (data: Agent) => {
    if (savingAgent) return;
    setSavingAgent(true);
    try {
      const updated = await updateAdminAgent(data.id, {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone ?? "",
        active: data.active,
      });
      upsertAgent(updated);
      setMode("view");
      if (detailId === data.id) await loadAgentDetail(data.id);
      toast.success("Profil mis à jour");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Mise a jour impossible.");
    } finally {
      setSavingAgent(false);
    }
  };

  const createAgent = async (data: Omit<Agent, "id"> & { password: string }) => {
    setSavingCreate(true);
    try {
      const created = await createAdminAgent({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone ?? "",
        password: data.password,
        active: data.active,
      });
      upsertAgent(created);
      setCreating(false);
      toast.success(`${created.name} ajoute a l'equipe`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Creation impossible.");
      throw err;
    } finally {
      setSavingCreate(false);
    }
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

      {loading && (
        <NeuCard className="p-6 text-sm text-muted-foreground">
          Chargement des agents...
        </NeuCard>
      )}

      {!loading && error && (
        <NeuCard className="p-6">
          <p className="text-sm font-medium">Agents indisponibles</p>
          <p className="text-sm text-muted-foreground mt-1">{error}</p>
        </NeuCard>
      )}

      {!loading && !error && (
      <>
      <AgentToolbar
        sortKey={sortKey}
        sortDirection={sortDirection}
        viewMode={viewMode}
        onSortChange={setSortKey}
        onSortDirectionChange={setSortDirection}
        onViewChange={setViewMode}
      />
      {viewMode === "cards" ? (
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
                type="button"
                onClick={() => openDetail(a)}
                className="flex flex-1 items-center justify-center gap-1 rounded-lg py-2 text-xs neu-sm hover:neu-pressable"
              >
                <Eye size={14} /> Détails
              </button>
              <button
                type="button"
                onClick={() => {
                  setDetailId(a.id);
                  window.setTimeout(() => setMode("edit"), 0);
                }}
                className="flex h-10 w-10 items-center justify-center rounded-lg neu-sm hover:neu-pressable"
                aria-label="Modifier"
              >
                <Pencil size={14} />
              </button>
              <AgentPowerToggle
                active={a.active}
                loading={actionId === a.id}
                onToggle={() => toggleActive(a.id)}
              />
            </div>
          </NeuCard>
        ))}
      </div>
      ) : (
        <AgentListTable
          agents={list}
          actionId={actionId}
          onOpen={openDetail}
          onEdit={(agent) => {
            setDetailId(agent.id);
            window.setTimeout(() => setMode("edit"), 0);
          }}
          onToggleActive={toggleActive}
        />
      )}
      </>
      )}

      {/* Side panel — Agent detail */}
      <AgentSidePanel
        agent={detail}
        detail={agentDetail}
        loading={detailLoading}
        saving={savingAgent}
        mode={mode}
        onClose={() => {
          setDetailId(null);
          setMode("view");
        }}
        onEdit={() => setMode("edit")}
        onCancelEdit={() => setMode("view")}
        onSave={saveAgent}
        onToggleActive={toggleActive}
        togglingId={actionId}
      />

      {/* Modal — Create agent */}
      {creating && (
        <CreateAgentModal
          submitting={savingCreate}
          onClose={() => {
            if (!savingCreate) setCreating(false);
          }}
          onCreate={createAgent}
        />
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────── */

function AgentPowerToggle({
  active,
  loading = false,
  size = "md",
  labeled = false,
  onToggle,
}: {
  active: boolean;
  loading?: boolean;
  size?: "sm" | "md";
  labeled?: boolean;
  onToggle: () => void;
}) {
  const iconOnly = !labeled;
  const dim = iconOnly ? (size === "sm" ? "h-9 w-9" : "h-10 w-10") : "flex-1 py-2.5";

  return (
    <button
      type="button"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        if (!loading) onToggle();
      }}
      disabled={loading}
      title={active ? "Désactiver le compte" : "Réactiver le compte"}
      aria-label={loading ? "Mise à jour en cours" : active ? "Désactiver le compte" : "Réactiver le compte"}
      aria-busy={loading}
      className={cn(
        "flex items-center justify-center gap-1.5 text-sm font-medium transition-all duration-300",
        iconOnly ? "rounded-full neu-sm" : "flex-1 rounded-xl neu-sm hover:neu-pressable",
        dim,
        loading && "cursor-wait opacity-90",
        !loading && "hover:neu-pressable",
        active
          ? "bg-honeydew text-[oklch(0.42_0.16_145)] shadow-[inset_0_0_0_1px_oklch(0.78_0.1_145)]"
          : "bg-destructive/15 text-destructive shadow-[inset_0_0_0_1px_rgba(220,38,38,0.25)]",
      )}
    >
      {loading ? (
        <RotateCw
          size={14}
          className="animate-spin"
          strokeWidth={2.2}
          aria-hidden
        />
      ) : (
        <>
          <Power size={14} strokeWidth={2.2} aria-hidden />
          {labeled ? (active ? "Désactiver" : "Réactiver") : null}
        </>
      )}
    </button>
  );
}

function AgentToolbar({
  sortKey,
  sortDirection,
  viewMode,
  onSortChange,
  onSortDirectionChange,
  onViewChange,
}: {
  sortKey: SortKey;
  sortDirection: SortDirection;
  viewMode: ViewMode;
  onSortChange: (value: SortKey) => void;
  onSortDirectionChange: (value: SortDirection) => void;
  onViewChange: (value: ViewMode) => void;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
        <div className="w-full sm:w-64">
          <Select value={sortKey} onValueChange={(value) => onSortChange(value as SortKey)}>
            <SelectTrigger className="h-11 rounded-xl neu-sm border-0 bg-ghost">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="workload">Trier par charge clients</SelectItem>
              <SelectItem value="closed">Trier par clôtures (semaine)</SelectItem>
              <SelectItem value="status">Trier par statut</SelectItem>
              <SelectItem value="name">Trier par nom</SelectItem>
              <SelectItem value="activity">Trier par activité</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="w-full sm:w-44">
          <Select
            value={sortDirection}
            onValueChange={(value) => onSortDirectionChange(value as SortDirection)}
          >
            <SelectTrigger className="h-11 rounded-xl neu-sm border-0 bg-ghost">
              <span className="flex items-center gap-2">
                <ArrowUpDown size={14} />
                <SelectValue />
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="desc">Décroissant</SelectItem>
              <SelectItem value="asc">Croissant</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="inline-flex w-fit rounded-xl neu-inset p-1">
        <button
          type="button"
          onClick={() => onViewChange("cards")}
          className={cn(
            "h-9 w-10 rounded-lg flex items-center justify-center transition",
            viewMode === "cards" && "bg-ghost neu-sm",
          )}
          aria-label="Vue cartes"
          title="Vue cartes"
        >
          <Grid3X3 size={16} />
        </button>
        <button
          type="button"
          onClick={() => onViewChange("list")}
          className={cn(
            "h-9 w-10 rounded-lg flex items-center justify-center transition",
            viewMode === "list" && "bg-ghost neu-sm",
          )}
          aria-label="Vue liste"
          title="Vue liste"
        >
          <List size={16} />
        </button>
      </div>
    </div>
  );
}

function AgentListTable({
  agents,
  actionId,
  onOpen,
  onEdit,
  onToggleActive,
}: {
  agents: Agent[];
  actionId: string | null;
  onOpen: (agent: Agent) => void;
  onEdit: (agent: Agent) => void;
  onToggleActive: (id: string) => void;
}) {
  return (
    <NeuCard className="p-2 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[220px]">Agent</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Telephone</TableHead>
            <TableHead className="text-right">Clients</TableHead>
            <TableHead className="text-right">Clotures</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead>Activite</TableHead>
            <TableHead className="w-[140px] text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {agents.map((agent) => (
            <TableRow key={agent.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar name={agent.name} size={36} />
                  <div className="min-w-0">
                    <div className="font-semibold truncate">{agent.name}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {agent.firstName} {agent.lastName}
                    </div>
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground">{agent.email}</TableCell>
              <TableCell className="text-muted-foreground">{agent.phone || "-"}</TableCell>
              <TableCell className="text-right font-semibold">{agent.activeClients}</TableCell>
              <TableCell className="text-right font-semibold text-[oklch(0.55_0.15_145)]">
                {agent.closedThisMonth}
              </TableCell>
              <TableCell>
                <SoftBadge tone={agent.active ? "success" : "neutral"}>
                  {agent.active ? "Actif" : "Inactif"}
                </SoftBadge>
              </TableCell>
              <TableCell className="text-muted-foreground">{agent.lastActivity}</TableCell>
              <TableCell>
                <div className="flex justify-end gap-1.5">
                  <button
                    type="button"
                    onClick={() => onOpen(agent)}
                    className="h-9 w-9 rounded-lg neu-sm hover:neu-pressable flex items-center justify-center"
                    aria-label="Details"
                    title="Details"
                  >
                    <Eye size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onEdit(agent)}
                    className="flex h-9 w-9 items-center justify-center rounded-lg neu-sm hover:neu-pressable"
                    aria-label="Modifier"
                    title="Modifier"
                  >
                    <Pencil size={14} />
                  </button>
                  <AgentPowerToggle
                    active={agent.active}
                    loading={actionId === agent.id}
                    size="sm"
                    onToggle={() => onToggleActive(agent.id)}
                  />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </NeuCard>
  );
}

const STAGE_META: { key: string; label: string; bar: string }[] = [
  { key: "froid", label: "Froid", bar: "bg-alice" },
  { key: "tiede", label: "Tiède", bar: "bg-honeydew" },
  { key: "chaud", label: "Chaud", bar: "bg-vanilla" },
  { key: "negociation", label: "Négociation", bar: "bg-[oklch(0.82_0.1_55)]" },
  { key: "cloture", label: "Clôturé", bar: "bg-[oklch(0.7_0.15_145)]" },
  { key: "perdu", label: "Perdu", bar: "bg-muted" },
];

function dealStageToUi(stage: string): string {
  const map: Record<string, string> = {
    COLD: "froid",
    WARM: "tiede",
    HOT: "chaud",
    NEGOTIATION: "negociation",
    CLOSED: "cloture",
    LOST: "perdu",
  };
  return map[stage] ?? stage.toLowerCase();
}

function clientTypeLabel(type: string) {
  return type === "BUYER" ? "Acheteur" : "Vendeur";
}

function AgentSidePanel({
  agent,
  detail,
  loading,
  saving,
  mode,
  onClose,
  onEdit,
  onCancelEdit,
  onSave,
  onToggleActive,
  togglingId,
}: {
  agent: Agent | null;
  detail: AdminAgentDetailDto | null;
  loading: boolean;
  saving: boolean;
  mode: Mode;
  onClose: () => void;
  onEdit: () => void;
  onCancelEdit: () => void;
  onSave: (a: Agent) => Promise<void>;
  onToggleActive: (id: string) => void;
  togglingId: string | null;
}) {
  const open = !!agent;
  const profile = detail?.agent ?? agent;
  const stageBuckets = detail?.stageCounts ?? {};
  const dossiers = detail?.dossiers ?? [];
  const max = Math.max(1, ...STAGE_META.map((s) => stageBuckets[s.key] ?? 0));
  const scrollRef = useRef<HTMLDivElement>(null);
  const editFormRef = useRef<HTMLFormElement>(null);
  const [editFooterReady, setEditFooterReady] = useState(false);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (mode === "edit") {
      scrollRef.current?.scrollTo({ top: 0, behavior: "auto" });
      const timer = window.setTimeout(() => setEditFooterReady(true), 100);
      return () => window.clearTimeout(timer);
    }
    setEditFooterReady(false);
  }, [mode]);

  const handleEditClick = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    onEdit();
  };

  const handleSaveClick = () => {
    editFormRef.current?.requestSubmit();
  };

  const panel = (
    <>
      <div
        onClick={onClose}
        className={cn(
          "fixed inset-0 z-[90] bg-eerie/40 transition-opacity",
          open ? "opacity-100" : "opacity-0 pointer-events-none",
        )}
      />
      <aside
        className={cn(
          "fixed inset-y-0 right-0 z-[100] flex w-full max-w-[440px] flex-col overflow-hidden border-l border-border bg-ghost shadow-2xl",
          "h-dvh max-h-dvh",
          open ? "translate-x-0" : "translate-x-full pointer-events-none",
        )}
        aria-hidden={!open}
      >
        {agent && profile && (
          <>
            <div className="shrink-0 border-b border-border p-5 sm:p-6">
              <div className="flex items-start gap-4">
                <Avatar name={profile.name} size={56} />
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    {mode === "edit" ? "Modification" : "Profil agent"}
                  </p>
                  <h2 className="truncate text-lg font-bold">{profile.name}</h2>
                  <div className="truncate text-xs text-muted-foreground">{profile.email}</div>
                  <div className="text-xs text-muted-foreground">{profile.phone ?? "—"}</div>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full neu-sm"
                  aria-label="Fermer"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div
              ref={scrollRef}
              className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-5 sm:p-6 soft-scroll"
            >
              {loading && mode === "view" ? (
                <div className="space-y-4 animate-pulse">
                  <div className="grid grid-cols-3 gap-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-16 rounded-lg bg-muted/30" />
                    ))}
                  </div>
                  <div className="h-32 rounded-xl bg-muted/20" />
                  <div className="h-40 rounded-xl bg-muted/20" />
                </div>
              ) : mode === "view" ? (
                <>
                  <div className="grid grid-cols-3 gap-2">
                    <Stat label="Dossiers" value={profile.activeClients} />
                    <Stat label="Clôt." value={profile.closedThisMonth} tone="success" />
                    <Stat label="Conv." value={`${detail?.conversionRatePercent ?? 0}%`} />
                  </div>

                  <section className="mt-6">
                    <h3 className="mb-3 text-sm font-semibold">Charge par étape</h3>
                    <div className="space-y-2.5">
                      {STAGE_META.map((s) => {
                        const v = stageBuckets[s.key] ?? 0;
                        return (
                          <div
                            key={s.key}
                            className="grid grid-cols-[80px_1fr_24px] items-center gap-3 text-xs"
                          >
                            <span className="text-muted-foreground">{s.label}</span>
                            <div className="h-2.5 overflow-hidden rounded-full neu-inset">
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

                  <section className="mt-6">
                    <h3 className="mb-3 text-sm font-semibold">
                      {Math.min(5, dossiers.length)} derniers dossiers
                    </h3>
                    <div className="space-y-2">
                      {dossiers.slice(0, 5).map((d) => (
                        <div
                          key={d.idDeal}
                          className="flex items-center gap-3 rounded-xl p-2.5 neu-sm"
                        >
                          <Avatar name={d.clientName} size={32} />
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-medium">{d.clientName}</div>
                            <div className="text-[10px] text-muted-foreground">
                              {clientTypeLabel(d.clientType)}
                              {d.aiLeadScore != null ? ` · Score ${d.aiLeadScore}` : ""}
                              {d.urgent ? " · Urgent" : ""}
                            </div>
                          </div>
                          <StageBadge stage={dealStageToUi(d.stage)} />
                        </div>
                      ))}
                      {!loading && dossiers.length === 0 && (
                        <p className="py-4 text-center text-xs text-muted-foreground">
                          Aucun dossier assigné.
                        </p>
                      )}
                    </div>
                  </section>

                  <p className="mt-6 text-xs text-muted-foreground">
                    Dernière activité : {profile.lastActivity}
                  </p>
                </>
              ) : (
                <EditAgentForm
                  key={`${profile.id}-edit`}
                  formRef={editFormRef}
                  agent={profile}
                  saving={saving}
                  showActions={false}
                  onCancel={onCancelEdit}
                  onSave={onSave}
                />
              )}
            </div>

            <div className="shrink-0 border-t border-border bg-ghost p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-5">
              {mode === "view" && !loading ? (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleEditClick}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-medium neu-sm hover:neu-pressable"
                  >
                    <Pencil size={14} /> Modifier
                  </button>
                  <AgentPowerToggle
                    active={profile.active}
                    loading={togglingId === profile.id}
                    labeled
                    onToggle={() => onToggleActive(profile.id)}
                  />
                </div>
              ) : mode === "edit" && editFooterReady ? (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleSaveClick}
                    disabled={saving}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-eerie py-2.5 text-sm font-medium text-ghost hover:opacity-90 disabled:opacity-60"
                  >
                    <Check size={14} /> {saving ? "Enregistrement…" : "Enregistrer"}
                  </button>
                  <button
                    type="button"
                    onClick={onCancelEdit}
                    disabled={saving}
                    className="rounded-xl px-5 py-2.5 text-sm font-medium neu-sm disabled:opacity-60"
                  >
                    Annuler
                  </button>
                </div>
              ) : null}
            </div>
          </>
        )}
      </aside>
    </>
  );

  if (typeof document === "undefined") return null;
  return createPortal(panel, document.body);
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
  formRef,
  saving = false,
  showActions = true,
  onCancel,
  onSave,
}: {
  agent: Agent;
  formRef?: React.RefObject<HTMLFormElement | null>;
  saving?: boolean;
  showActions?: boolean;
  onCancel: () => void;
  onSave: (a: Agent) => Promise<void>;
}) {
  const [firstName, setFirstName] = useState(agent.firstName ?? "");
  const [lastName, setLastName] = useState(agent.lastName ?? "");
  const [email, setEmail] = useState(agent.email ?? "");
  const [phone, setPhone] = useState(agent.phone ?? "");
  const [active, setActive] = useState(agent.active);

  useEffect(() => {
    setFirstName(agent.firstName ?? "");
    setLastName(agent.lastName ?? "");
    setEmail(agent.email ?? "");
    setPhone(agent.phone ?? "");
    setActive(agent.active);
  }, [agent.id, agent.firstName, agent.lastName, agent.email, agent.phone, agent.active]);

  return (
    <form
      ref={formRef}
      onSubmit={async (e) => {
        e.preventDefault();
        if (saving) return;
        await onSave({
          ...agent,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          name: `${firstName.trim()} ${lastName.trim()}`.trim(),
          email: email.trim(),
          phone: phone.trim(),
          active,
        });
      }}
      className="space-y-4"
    >
      <div className="grid sm:grid-cols-2 gap-3">
        <Field label="Prenom">
          <input
            required
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="input-neu"
          />
        </Field>
        <Field label="Nom">
          <input
            required
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="input-neu"
          />
        </Field>
      </div>
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
      {showActions ? (
        <div className="flex gap-2 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-eerie py-2.5 text-sm font-medium text-ghost disabled:opacity-60"
          >
            <Check size={14} /> {saving ? "Enregistrement…" : "Enregistrer"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="rounded-xl px-5 py-2.5 text-sm font-medium neu-sm disabled:opacity-60"
          >
            Annuler
          </button>
        </div>
      ) : null}
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
  submitting,
}: {
  onClose: () => void;
  onCreate: (a: Omit<Agent, "id"> & { password: string }) => Promise<void>;
  submitting: boolean;
}) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [active, setActive] = useState(true);
  const [submitError, setSubmitError] = useState<string | null>(null);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      onClick={() => {
        if (!submitting) onClose();
      }}
    >
      <div className="absolute inset-0 bg-eerie/60 backdrop-blur-sm" />
      <div
        className="relative bg-ghost rounded-3xl max-w-md w-full p-7 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          disabled={submitting}
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
          onSubmit={async (e) => {
            e.preventDefault();
            setSubmitError(null);
            try {
              await onCreate({
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                name: `${firstName} ${lastName}`.trim(),
                email: email.trim(),
                phone: phone.trim(),
                password,
                active,
                activeClients: 0,
                closedThisMonth: 0,
                lastActivity: "a l'instant",
              });
            } catch (err) {
              setSubmitError(
                err instanceof Error ? err.message : "Impossible de creer l'agent.",
              );
            }
          }}
          className="mt-5 space-y-4"
        >
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Prenom">
              <input
                required
                autoFocus
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="ex : Sara"
                className="input-neu"
              />
            </Field>
            <Field label="Nom">
              <input
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="ex : El Idrissi"
                className="input-neu"
              />
            </Field>
          </div>
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
          <Field label="Mot de passe initial">
            <input
              required
              minLength={6}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="6 caracteres minimum"
              className="input-neu"
            />
          </Field>
          <label className="flex items-center gap-3 text-sm cursor-pointer select-none">
            <button
              type="button"
              disabled={submitting}
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
          {submitError && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
              {submitError}
            </p>
          )}
          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2.5 rounded-xl bg-eerie text-ghost text-sm font-medium disabled:opacity-60"
            >
              Ajouter à l'équipe
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl neu-sm text-sm font-medium disabled:opacity-60"
            >
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
