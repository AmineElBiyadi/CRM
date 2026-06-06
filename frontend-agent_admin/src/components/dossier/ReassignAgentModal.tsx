import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Avatar } from "@/components/ui/design-bits";
import { Search, UserRound, ArrowRight, Loader2, Check } from "lucide-react";
import { type AdminAgent } from "@/api/dossiersApi";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";

interface ReassignAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  agents: AdminAgent[] | undefined;
  isLoadingAgents: boolean;
  currentAgentName: string;
  onConfirm: (agentId: string, reason: string) => void;
  isPending: boolean;
}

export function ReassignAgentModal({
  isOpen,
  onClose,
  agents,
  isLoadingAgents,
  currentAgentName,
  onConfirm,
  isPending,
}: ReassignAgentModalProps) {
  const [search, setSearch] = useState("");
  const [selectedAgentId, setSelectedAgentId] = useState("");
  const [reason, setReason] = useState("");

  const filteredAgents = agents?.filter((a) =>
    `${a.firstName} ${a.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
    a.email.toLowerCase().includes(search.toLowerCase())
  );

  const selectedAgent = agents?.find((a) => a.id === selectedAgentId);

  const handleConfirm = () => {
    if (selectedAgentId && reason.trim()) {
      onConfirm(selectedAgentId, reason);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] gap-6">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Réassigner le dossier</DialogTitle>
          <DialogDescription>
            Choisissez un nouvel agent pour reprendre ce dossier et indiquez le motif du transfert.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Transfer Visualization */}
          <div className="flex items-center justify-center gap-6 p-4 rounded-2xl bg-alice/20 border border-alice/30">
            <div className="flex flex-col items-center gap-2">
              <Avatar name={currentAgentName} size={48} />
              <span className="text-[10px] font-bold uppercase text-muted-foreground">Actuel</span>
              <span className="text-xs font-semibold truncate max-w-[80px]">{currentAgentName.split(' ')[0]}</span>
            </div>
            <ArrowRight className="text-muted-foreground opacity-30" size={24} />
            <div className="flex flex-col items-center gap-2">
              {selectedAgent ? (
                <Avatar name={`${selectedAgent.firstName} ${selectedAgent.lastName}`} size={48} />
              ) : (
                <div className="w-12 h-12 rounded-full border-2 border-dashed border-border flex items-center justify-center text-muted-foreground/30">
                  <UserRound size={24} />
                </div>
              )}
              <span className="text-[10px] font-bold uppercase text-muted-foreground">Nouveau</span>
              <span className="text-xs font-semibold truncate max-w-[80px]">
                {selectedAgent ? selectedAgent.firstName : "—"}
              </span>
            </div>
          </div>

          {/* Agent Picker */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <input
                type="text"
                placeholder="Rechercher un agent..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl neu-inset bg-transparent text-sm focus:outline-none"
              />
            </div>

            <div className="max-h-[220px] overflow-y-auto soft-scroll space-y-1 pr-1">
              {isLoadingAgents ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="animate-spin text-muted-foreground" size={24} />
                </div>
              ) : filteredAgents?.length === 0 ? (
                <p className="text-center py-10 text-xs text-muted-foreground">Aucun agent trouvé.</p>
              ) : (
                filteredAgents?.map((agent) => {
                  const isSelected = selectedAgentId === agent.id;
                  return (
                    <button
                      key={agent.id}
                      onClick={() => setSelectedAgentId(agent.id)}
                      className={cn(
                        "w-full flex items-center gap-3 p-2 rounded-xl transition-all border border-transparent",
                        isSelected ? "bg-eerie text-ghost shadow-lg" : "hover:bg-alice/40"
                      )}
                    >
                      <Avatar name={`${agent.firstName} ${agent.lastName}`} size={32} />
                      <div className="flex-1 text-left">
                        <div className="text-sm font-bold">{agent.firstName} {agent.lastName}</div>
                        <div className={cn("text-[10px]", isSelected ? "text-ghost/60" : "text-muted-foreground")}>
                          {agent.email}
                        </div>
                      </div>
                      {isSelected && <Check size={16} className="text-honeydew" />}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Reason Field */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
              Motif de réaffectation <span className="text-destructive">*</span>
            </label>
            <Textarea
              placeholder="Ex: Départ de l'agent actuel, changement de secteur..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="resize-none min-h-[80px] rounded-xl neu-inset bg-transparent border-none focus-visible:ring-0"
            />
          </div>
        </div>

        <DialogFooter className="gap-3 sm:gap-0">
          <button
            onClick={onClose}
            className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-alice transition-all"
          >
            Annuler
          </button>
          <button
            disabled={!selectedAgentId || !reason.trim() || isPending}
            onClick={handleConfirm}
            className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-eerie text-ghost text-sm font-bold shadow-lg hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            {isPending && <Loader2 size={16} className="animate-spin" />}
            Confirmer le transfert
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
