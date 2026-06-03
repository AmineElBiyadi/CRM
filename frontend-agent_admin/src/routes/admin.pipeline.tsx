import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { NeuCard } from "@/components/ui/neu-card";
import { Avatar, LeadScore, SoftBadge } from "@/components/ui/design-bits";
import { pipelineStages } from "@/lib/mock-data";
import {
  fetchAdminAgents,
  fetchAdminPipeline,
  type AdminAgentDto,
  type AdminPipelineDealDto,
} from "@/api/adminDashboardApi";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { ChevronsUpDown, Flame, Search, ShieldAlert, X } from "lucide-react";

export const Route = createFileRoute("/admin/pipeline")({
  component: PipelinePage,
});

const STAGE_COLORS = Object.fromEntries(pipelineStages.map((s) => [s.key, s.color]));
const DEALS_PREVIEW_LIMIT = 6;

function clientTypeLabel(type: AdminPipelineDealDto["clientType"]) {
  return type === "BUYER" ? "Acheteur" : "Vendeur";
}

function AgentSearchFilter({
  agents,
  value,
  onChange,
}: {
  agents: AdminAgentDto[];
  value: string;
  onChange: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = value === "all" ? null : agents.find((a) => a.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          className="flex h-11 w-full min-w-[260px] max-w-sm items-center gap-2 rounded-xl neu-sm bg-ghost px-3 text-sm hover:neu-pressable"
        >
          <Search size={14} className="shrink-0 text-muted-foreground" />
          <span className="flex-1 truncate text-left">
            {selected ? selected.name : "Tous les agents"}
          </span>
          {selected ? (
            <span
              role="button"
              tabIndex={0}
              className="rounded-full p-0.5 hover:bg-muted/60"
              onClick={(e) => {
                e.stopPropagation();
                onChange("all");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  e.stopPropagation();
                  onChange("all");
                }
              }}
              aria-label="Effacer le filtre agent"
            >
              <X size={14} className="text-muted-foreground" />
            </span>
          ) : (
            <ChevronsUpDown size={14} className="shrink-0 text-muted-foreground opacity-60" />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0" align="end">
        <Command>
          <CommandInput placeholder="Rechercher un agent par nom…" />
          <CommandList className="max-h-[280px]">
            <CommandEmpty>Aucun agent trouvé.</CommandEmpty>
            <CommandGroup heading="Filtrer le pipeline">
              <CommandItem
                value="tous les agents"
                onSelect={() => {
                  onChange("all");
                  setOpen(false);
                }}
              >
                Tous les agents
              </CommandItem>
              {agents.map((agent) => (
                <CommandItem
                  key={agent.id}
                  value={`${agent.name} ${agent.email}`}
                  onSelect={() => {
                    onChange(agent.id);
                    setOpen(false);
                  }}
                  className="flex items-center gap-2"
                >
                  <Avatar name={agent.name} size={24} />
                  <span className="flex-1 truncate">{agent.name}</span>
                  {!agent.active ? (
                    <span className="text-[10px] text-muted-foreground">Inactif</span>
                  ) : null}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function PipelineDealCard({ deal }: { deal: AdminPipelineDealDto }) {
  return (
    <Link
      to="/admin/dossier"
      search={{ id: deal.idProfile }}
      className="block"
    >
      <NeuCard size="sm" pressable className="group relative">
        <div className="flex items-start gap-3">
          <Avatar name={deal.clientName} size={36} />
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm truncate">{deal.clientName}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">
              {clientTypeLabel(deal.clientType)} · {deal.lastInteraction}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
          <div className="flex items-center gap-1.5 min-w-0">
            <Avatar name={deal.agentName} size={20} />
            <span className="text-[10px] text-muted-foreground truncate">
              {deal.agentName.split(" ")[0]}
            </span>
          </div>
          {deal.aiLeadScore != null ? (
            <LeadScore score={deal.aiLeadScore} size={32} />
          ) : (
            <span className="text-[10px] text-muted-foreground">—</span>
          )}
        </div>
        {(deal.aiLeadScore ?? 0) >= 75 || deal.urgent ? (
          <div className="absolute top-2 right-2">
            <Flame size={14} className="text-vanilla fill-vanilla" />
          </div>
        ) : null}
      </NeuCard>
    </Link>
  );
}

function PipelineStageColumn({
  stageKey,
  stageLabel,
  stageColor,
  count,
  deals,
  isLoading,
}: {
  stageKey: string;
  stageLabel: string;
  stageColor: string;
  count: number;
  deals: AdminPipelineDealDto[];
  isLoading: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const hasMore = deals.length > DEALS_PREVIEW_LIMIT;
  const visibleDeals = expanded ? deals : deals.slice(0, DEALS_PREVIEW_LIMIT);
  const hiddenCount = deals.length - DEALS_PREVIEW_LIMIT;

  return (
    <div className="flex flex-col min-h-0">
      <div className="neu-sm rounded-xl p-3 shrink-0">
        <div className={`h-1 rounded-full ${STAGE_COLORS[stageKey] ?? stageColor} mb-2`} />
        <div className="flex items-center justify-between">
          <span className="font-semibold text-sm">{stageLabel}</span>
          <SoftBadge>{count}</SoftBadge>
        </div>
      </div>

      <div
        className={cn(
          "mt-3 space-y-3 min-h-[120px]",
          expanded && "max-h-[min(520px,58vh)] overflow-y-auto soft-scroll pr-0.5",
        )}
      >
        {isLoading &&
          [1, 2].map((i) => (
            <div key={i} className="h-28 rounded-2xl bg-muted/20 animate-pulse" />
          ))}

        {!isLoading && visibleDeals.map((deal) => (
          <PipelineDealCard key={deal.idDeal} deal={deal} />
        ))}

        {!isLoading && deals.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-8">Aucun dossier</p>
        )}
      </div>

      {!isLoading && hasMore && !expanded && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="mt-2 w-full rounded-xl py-2 text-xs font-medium text-muted-foreground neu-sm hover:neu-pressable hover:text-eerie"
        >
          +{hiddenCount} autre{hiddenCount > 1 ? "s" : ""} dossier{hiddenCount > 1 ? "s" : ""}
        </button>
      )}

      {!isLoading && expanded && hasMore && (
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className="mt-2 w-full rounded-xl py-2 text-xs font-medium text-muted-foreground neu-sm hover:neu-pressable"
        >
          Réduire
        </button>
      )}
    </div>
  );
}

function PipelinePage() {
  const [agentFilter, setAgentFilter] = useState<string>("all");

  const { data: agents = [] } = useQuery({
    queryKey: ["admin-agents", "name"],
    queryFn: () => fetchAdminAgents("name", "asc"),
    staleTime: 60_000,
  });

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["admin-pipeline", agentFilter],
    queryFn: () =>
      fetchAdminPipeline(agentFilter === "all" ? undefined : agentFilter),
    staleTime: 30_000,
  });

  const dealsByStage = useMemo(() => {
    const map: Record<string, AdminPipelineDealDto[]> = Object.fromEntries(
      pipelineStages.map((s) => [s.key, []]),
    );
    for (const deal of data?.deals ?? []) {
      if (map[deal.stageKey]) map[deal.stageKey].push(deal);
    }
    return map;
  }, [data?.deals]);

  const stageCounts = useMemo(() => {
    const fromApi = Object.fromEntries((data?.stages ?? []).map((s) => [s.key, s.count]));
    return pipelineStages.map((s) => ({
      ...s,
      count: fromApi[s.key] ?? dealsByStage[s.key]?.length ?? 0,
    }));
  }, [data?.stages, dealsByStage]);

  const selectedAgent = agentFilter === "all" ? null : agents.find((a) => a.id === agentFilter);

  return (
    <div className="space-y-6 max-w-[1600px]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Pipeline global</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isLoading
              ? "Chargement des dossiers…"
              : selectedAgent
                ? `${data?.totalDeals ?? 0} dossier(s) · ${selectedAgent.name}`
                : `${data?.totalDeals ?? 0} dossier(s) dans l'agence`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <AgentSearchFilter
            agents={agents}
            value={agentFilter}
            onChange={setAgentFilter}
          />
          {selectedAgent ? (
            <Avatar name={selectedAgent.name} size={36} />
          ) : (
            agents.filter((a) => a.active).length > 0 && (
              <div className="hidden sm:flex -space-x-2">
                {agents
                  .filter((a) => a.active)
                  .slice(0, 4)
                  .map((a) => (
                    <Avatar key={a.id} name={a.name} size={32} />
                  ))}
              </div>
            )
          )}
        </div>
      </div>

      {isError && (
        <NeuCard className="p-6 text-center">
          <ShieldAlert className="mx-auto mb-3 text-destructive" size={28} />
          <p className="font-medium">Pipeline indisponible</p>
          <p className="text-sm text-muted-foreground mt-1">
            {error instanceof Error ? error.message : "Erreur de chargement"}
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-4 px-4 py-2 rounded-xl bg-eerie text-ghost text-sm"
          >
            Réessayer
          </button>
        </NeuCard>
      )}

      {!isError && (
        <div className="overflow-x-auto soft-scroll -mx-4 md:mx-0 px-4 md:px-0">
          <div className="grid grid-cols-6 gap-4 min-w-[1200px] items-start">
            {stageCounts.map((stage) => (
              <PipelineStageColumn
                key={stage.key}
                stageKey={stage.key}
                stageLabel={stage.label}
                stageColor={stage.color}
                count={stage.count}
                deals={dealsByStage[stage.key] ?? []}
                isLoading={isLoading}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
