import { useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { fetchDossiers, type DossierSummary } from "@/api/dossiersApi";
import { NeuCard } from "@/components/ui/neu-card";
import { LeadScore, SoftBadge, StageBadge } from "@/components/ui/design-bits";
import { Sparkles, Plus, AlertCircle, Clock, ChevronRight } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";

export const Route = createFileRoute("/agent/dossiers/")({
  component: DossiersListing,
});

function DossiersListing() {
  const { data: rawDossiers, isLoading, isError } = useQuery({
    queryKey: ["dossiers"],
    queryFn: fetchDossiers,
  });

  const dossiers = useMemo(() => {
     if (!rawDossiers) return [];
     return [...rawDossiers].sort((a, b) => {
        // 1. New dossiers first
        if (a.newDossier && !b.newDossier) return -1;
        if (!a.newDossier && b.newDossier) return 1;
        
        // 2. Urgent dossiers next
        if (a.isUrgent && !b.isUrgent) return -1;
        if (!a.isUrgent && b.isUrgent) return 1;

        // 3. Then sort by createdAt descending
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
   }, [rawDossiers]);

  if (isLoading) return <div className="p-8 text-center">Chargement des dossiers...</div>;
  if (isError) return <div className="p-8 text-center text-red-500">Erreur lors du chargement des dossiers.</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-eerie">Espace Dossiers</h1>
          <p className="text-muted-foreground text-sm">Gérez vos transactions actives et suivez les priorités IA.</p>
        </div>
        <Link 
          to="/agent/dossiers/create" 
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-eerie text-ghost font-medium hover:opacity-90 transition-all shadow-lg"
        >
          <Plus size={18} /> Nouveau Dossier
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {dossiers?.length === 0 ? (
          <NeuCard className="py-12 text-center text-muted-foreground">
            Aucun dossier actif pour le moment.
          </NeuCard>
        ) : (
          dossiers?.map((dossier) => (
            <DossierRow key={dossier.idDeal || dossier.idProfile} dossier={dossier} />
          ))
        )}
      </div>
    </div>
  );
}

function DossierRow({ dossier }: { dossier: DossierSummary }) {
  return (
    <NeuCard 
      size="sm" 
      className={`relative group transition-all ${dossier.newDossier ? 'border-amber-200 bg-amber-50/30 shadow-sm' : ''}`}
    >
      <div className="flex flex-col md:flex-row items-center gap-6 p-1">
        {/* Score IA */}
        <div className="shrink-0">
          <LeadScore score={dossier.aiLeadScore ?? 0} size={70} />
        </div>
        {/* Info Client & Dossier */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-lg text-eerie truncate">{dossier.clientFullName}</h3>
            {dossier.newDossier && (
              <span className="bg-amber-500 text-ghost text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-tighter shadow-sm">
                NEW
              </span>
            )}
            {dossier.isUrgent && (
              <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full border border-red-100">
                <AlertCircle size={10} /> Urgent
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <SoftBadge tone="info" className="text-[10px]">{dossier.clientType === 'BUYER' ? 'ACHETEUR' : 'VENDEUR'}</SoftBadge>
            <StageBadge stage={dossier.stage} />
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground ml-2">
              <Clock size={12} />
              <span>Dernier échange : {formatRelativeTime(dossier.lastInteractionAt)}</span>
            </div>
          </div>
        </div>

        {/* Action Recommandée */}
        <div className="hidden lg:flex flex-col max-w-[280px] text-right">
          <span className="text-[10px] uppercase font-bold text-muted-foreground mb-1 flex items-center justify-end gap-1">
            <Sparkles size={10} className="text-vanilla" /> Action recommandée
          </span>
          <p className="text-sm font-medium text-eerie line-clamp-2 italic">
            "{dossier.aiRecommendedAction}"
          </p>
        </div>

        {/* Action Button */}
        <div className="shrink-0 w-full md:w-auto flex items-center gap-2">
          {dossier.newDossier ? (
            <Link
              to="/agent/dossiers/create"
              search={{ confirmId: dossier.idProfile }}
              className="px-4 py-3 rounded-xl bg-amber-500 text-ghost text-sm font-bold hover:bg-amber-600 transition-colors shadow-lg shadow-amber-500/20"
            >
              Confirmer
            </Link>
          ) : (
            <Link 
              to="/agent/dossier" 
              search={{ id: dossier.idDeal! }}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl neu-sm hover:neu-pressable text-sm font-bold group-hover:bg-alice/10"
            >
              Détails <ChevronRight size={16} />
            </Link>
          )}
        </div>
      </div>
    </NeuCard>
  );
}
