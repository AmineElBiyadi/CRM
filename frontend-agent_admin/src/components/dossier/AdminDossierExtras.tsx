import React, { useState } from "react";
import { NeuCard } from "@/components/ui/neu-card";
import { Avatar } from "@/components/ui/design-bits";
import { UserRound, UserPlus } from "lucide-react";
import { type DossierDetail, fetchAdminAgents, updateDossier } from "@/api/dossiersApi";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ReassignAgentModal } from "./ReassignAgentModal";

/**
 * Admin-only blocks on the dossier page. Add new sections here — they won't appear on the agent view.
 */
export function AdminDossierExtras({ dossier }: { dossier: DossierDetail }) {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data: agents, isLoading: loadingAgents } = useQuery({
    queryKey: ["admin", "agents"],
    queryFn: fetchAdminAgents,
    enabled: isModalOpen,
  });

  const reassignMutation = useMutation({
    mutationFn: ({ agentId, reason }: { agentId: string; reason: string }) => 
      updateDossier((dossier.idDeal || dossier.idProfile), { 
        assignedAgentId: agentId,
        reassignReason: reason,
        type: dossier.clientType
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dossier", (dossier.idDeal || dossier.idProfile)] });
      toast.success("Agent réassigné avec succès");
      setIsModalOpen(false);
    },
    onError: () => {
      toast.error("Échec de la réassignation");
    }
  });

  const handleReassign = (agentId: string, reason: string) => {
    reassignMutation.mutate({ agentId, reason });
  };

  return (
    <NeuCard className="max-w-[1500px]">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl neu-sm">
            <UserRound size={18} className="text-muted-foreground" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Vue administrateur
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <Avatar name={dossier.assignedAgentName} size={28} />
              <span className="text-sm font-medium">{dossier.assignedAgentName}</span>
              <span className="text-xs text-muted-foreground">· Agent assigné</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-3 py-1.5 rounded-lg neu-sm text-xs font-bold hover:bg-alice transition-all flex items-center gap-1.5"
          >
            <UserPlus size={14} /> Changer l'agent
          </button>
        </div>

        <ReassignAgentModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          agents={agents}
          isLoadingAgents={loadingAgents}
          currentAgentName={dossier.assignedAgentName}
          onConfirm={handleReassign}
          isPending={reassignMutation.isPending}
        />
      </div>
    </NeuCard>
  );
}
