import React, { useState } from "react";
import { NeuCard } from "@/components/ui/neu-card";
import { Avatar } from "@/components/ui/design-bits";
import { UserRound, UserPlus, Loader2, Check } from "lucide-react";
import { type DossierDetail, fetchAdminAgents, updateDossier } from "@/api/dossiersApi";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

/**
 * Admin-only blocks on the dossier page. Add new sections here — they won't appear on the agent view.
 */
export function AdminDossierExtras({ dossier }: { dossier: DossierDetail }) {
  const queryClient = useQueryClient();
  const [isChanging, setIsChanging] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState(dossier.assignedAgentId || "");
  const [reassignReason, setReassignReason] = useState("");

  const { data: agents, isLoading: loadingAgents } = useQuery({
    queryKey: ["admin", "agents"],
    queryFn: fetchAdminAgents,
    enabled: isChanging,
  });

  const reassignMutation = useMutation({
    mutationFn: (agentId: string) => 
      updateDossier((dossier.idDeal || dossier.idProfile), { 
        assignedAgentId: agentId,
        reassignReason: reassignReason || "Réaffectation par l'administrateur",
        type: dossier.clientType
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dossier", (dossier.idDeal || dossier.idProfile)] });
      toast.success("Agent réassigné avec succès");
      setIsChanging(false);
      setReassignReason("");
    },
    onError: () => {
      toast.error("Échec de la réassignation");
    }
  });
  const handleReassign = () => {
    if (!selectedAgentId || selectedAgentId === dossier.assignedAgentId) {
      setIsChanging(false);
      setReassignReason("");
      return;
    }
    if (!reassignReason.trim()) {
      toast.error("Veuillez saisir un motif pour la réaffectation");
      return;
    }
    reassignMutation.mutate(selectedAgentId);
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
            {!isChanging ? (
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <Avatar name={dossier.assignedAgentName} size={28} />
                <span className="text-sm font-medium">{dossier.assignedAgentName}</span>
                <span className="text-xs text-muted-foreground">· Agent assigné</span>
              </div>
            ) : (
              <div className="mt-1 flex flex-wrap items-center gap-2">
                {loadingAgents ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                    <select
                      value={selectedAgentId}
                      onChange={(e) => setSelectedAgentId(e.target.value)}
                      className="text-sm bg-transparent neu-inset px-2 py-1 rounded-lg focus:outline-none min-w-[180px]"
                      disabled={reassignMutation.isPending}
                      title="Changer l'agent"
                    >
                      <option key="default" value="">Choisir un agent...</option>
                      {agents?.map(agent => (
                        <option key={agent.id} value={agent.id}>
                          {agent.firstName} {agent.lastName}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder="Motif de réaffectation (obligatoire)..."
                      value={reassignReason}
                      onChange={(e) => setReassignReason(e.target.value)}
                      className="text-xs bg-transparent neu-inset px-3 py-1.5 rounded-lg focus:outline-none min-w-[250px]"
                      disabled={reassignMutation.isPending}
                      title="Motif"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isChanging ? (
            <button
              onClick={() => setIsChanging(true)}
              className="px-3 py-1.5 rounded-lg neu-sm text-xs font-bold hover:bg-alice transition-all flex items-center gap-1.5"
            >
              <UserPlus size={14} /> Changer l'agent
            </button>
          ) : (
            <>
              <button
                onClick={handleReassign}
                disabled={reassignMutation.isPending || !selectedAgentId || selectedAgentId === dossier.assignedAgentId}
                className="px-3 py-1.5 rounded-lg bg-eerie text-ghost text-xs font-bold hover:opacity-90 disabled:opacity-50 transition-all flex items-center gap-1.5"
              >
                {reassignMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                Confirmer
              </button>
              <button
                onClick={() => setIsChanging(false)}
                disabled={reassignMutation.isPending}
                className="px-3 py-1.5 rounded-lg text-xs font-bold hover:text-warn transition-all"
              >
                Annuler
              </button>
            </>
          )}
        </div>
      </div>
    </NeuCard>
  );
}
