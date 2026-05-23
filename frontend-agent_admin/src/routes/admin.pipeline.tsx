import { createFileRoute, Link } from "@tanstack/react-router";
import { NeuCard } from "@/components/ui/neu-card";
import { Avatar, LeadScore, SoftBadge } from "@/components/ui/design-bits";
import { clients, pipelineStages, agents } from "@/lib/mock-data";
import { Flame, Filter } from "lucide-react";
import { toast } from "sonner";


export const Route = createFileRoute("/admin/pipeline")({
  component: PipelinePage,
});

function PipelinePage() {
  return (
    <div className="space-y-6 max-w-[1600px]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Pipeline global</h1>
          <p className="text-sm text-muted-foreground mt-1">Tous les dossiers de l'agence en temps réel</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => toast("Filtres avancés — bientôt")}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl neu-sm text-sm hover:neu-pressable"
          >
            <Filter size={14} /> Filtres
          </button>
          <div className="hidden sm:flex -space-x-2">
            {agents.slice(0, 4).map((a) => (
              <Avatar key={a.id} name={a.name} size={32} />
            ))}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto soft-scroll -mx-4 md:mx-0 px-4 md:px-0">
        <div className="grid grid-cols-6 gap-4 min-w-[1200px]">
        {pipelineStages.map((stage) => {
          const stageClients = clients.filter((c) => c.stage === stage.key);
          return (
            <div key={stage.key} className="space-y-3">
              <div className="neu-sm rounded-xl p-3">
                <div className={`h-1 rounded-full ${stage.color} mb-2`} />
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm">{stage.label}</span>
                  <SoftBadge>{stageClients.length}</SoftBadge>
                </div>
              </div>

              <div className="space-y-3 min-h-[300px]">
                {stageClients.map((c) => (
                  <Link key={c.id} to="/agent/dossier">
                    <NeuCard size="sm" pressable className="group relative">
                      <div className="flex items-start gap-3">
                        <Avatar name={c.name} size={36} />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">{c.name}</div>
                          <div className="text-[10px] text-muted-foreground mt-0.5">{c.lastInteraction}</div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                        <div className="flex items-center gap-1.5">
                          <Avatar name={c.agent} size={20} />
                          <span className="text-[10px] text-muted-foreground truncate">{c.agent.split(" ")[0]}</span>
                        </div>
                        <LeadScore score={c.score} size={32} />
                      </div>
                      {c.score >= 75 && (
                        <div className="absolute top-2 right-2">
                          <Flame size={14} className="text-vanilla fill-vanilla" />
                        </div>
                      )}
                    </NeuCard>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
        </div>
      </div>
    </div>
  );
}
