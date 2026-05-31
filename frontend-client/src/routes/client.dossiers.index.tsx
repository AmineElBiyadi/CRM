import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useDossiers } from "@/hooks/use-dossiers";
import { NeuCard } from "@/components/ui/neu-card";
import { SoftBadge } from "@/components/ui/design-bits";
import { 
  Folder, 
  AlertCircle, 
  TrendingUp, 
  FileText, 
  Calendar, 
  ChevronRight, 
  User,
  Building2
} from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/client/dossiers/")({
  component: DossiersListPage,
});

const STAGE_CONFIG: Record<string, { label: string; color: string; text: string }> = {
  NEW: { label: "Nouveau", color: "bg-blue-100", text: "text-blue-600" },
  COLD: { label: "Froid", color: "bg-gray-100", text: "text-gray-600" },
  WARM: { label: "Tiède", color: "bg-[#e8e857]/30", text: "text-[#85851d]" },
  HOT: { label: "Chaud", color: "bg-orange-100", text: "text-orange-600" },
  NEGOTIATION: { label: "Négociation", color: "bg-purple-100", text: "text-purple-600" },
  CONTRACT: { label: "Contrat", color: "bg-emerald-100", text: "text-emerald-600" },
  CLOSED: { label: "Clôturé", color: "bg-green-100", text: "text-green-600" },
  LOST: { label: "Perdu", color: "bg-red-100", text: "text-red-600" },
};

const PROPERTY_TYPES: Record<string, string> = {
  APARTMENT: "Appartement",
  VILLA: "Villa",
  OFFICE: "Bureau",
  LAND: "Terrain",
};

function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-xl bg-gradient-to-r from-muted via-alice to-muted animate-pulse", className)} />
  );
}

export function DossiersListPage() {
  const { data: dossiers, isLoading, isError, refetch } = useDossiers();
  const navigate = useNavigate();

  useEffect(() => {
    if (dossiers && dossiers.length === 1) {
      navigate({ 
        to: "/client/dossiers/$id", 
        params: { id: dossiers[0].idProfile } 
      });
    }
  }, [dossiers, navigate]);

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-[1200px]">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <NeuCard key={i} className="h-[280px] space-y-4">
              <div className="flex justify-between">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-6 w-20" />
              </div>
              <Skeleton className="h-6 w-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
              <div className="pt-4 flex gap-4">
                <Skeleton className="h-8 w-12" />
                <Skeleton className="h-8 w-12" />
                <Skeleton className="h-8 w-12" />
              </div>
            </NeuCard>
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
        <NeuCard className="bg-red-50 border-red-100 p-8 text-center max-w-md">
          <AlertCircle className="mx-auto text-red-500 mb-4" size={48} />
          <h2 className="text-xl font-bold text-red-900 mb-2">Erreur de chargement</h2>
          <p className="text-red-700 mb-6">Nous n'avons pas pu récupérer vos dossiers. Veuillez réessayer.</p>
          <button 
            onClick={() => refetch()}
            className="px-6 py-2 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors"
          >
            Réessayer
          </button>
        </NeuCard>
      </div>
    );
  }

  if (!dossiers || dossiers.length === 0) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4 text-center">
        <div className="w-20 h-20 rounded-full bg-alice flex items-center justify-center mb-4">
          <Folder className="text-muted-foreground" size={40} />
        </div>
        <h2 className="text-2xl font-bold">Aucun dossier trouvé</h2>
        <p className="text-muted-foreground max-w-sm">
          Vous n'avez pas encore de dossier actif. Contactez votre agent pour commencer votre projet immobilier.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-[1200px]">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Mes dossiers</h1>
        <p className="text-muted-foreground">Retrouvez l'ensemble de vos projets immobiliers en cours.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {dossiers.map((dossier: any) => {
          const stage = STAGE_CONFIG[dossier.stage] || { label: dossier.stage, color: "bg-gray-100", text: "text-gray-600" };
          const propertyType = PROPERTY_TYPES[dossier.propertyType] || dossier.propertyType;
          const title = dossier.clientType === "BUYER" 
            ? `Dossier Acheteur — ${propertyType}`
            : `Dossier Vendeur — ${propertyType}`;

          return (
            <Link 
              key={dossier.idProfile} 
              to="/client/dossiers/$id"
              params={{ id: dossier.idProfile }}
              className="group"
            >
              <NeuCard className="h-full flex flex-col hover:neu-pressable transition-all border-transparent hover:border-vanilla/50">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex flex-wrap gap-2">
                    <SoftBadge tone={dossier.clientType === 'BUYER' ? 'info' : 'success'}>
                      {dossier.clientType === 'BUYER' ? 'ACHETEUR' : 'VENDEUR'}
                    </SoftBadge>
                    {dossier.isUrgent && (
                      <SoftBadge tone="danger" className="animate-pulse">URGENT</SoftBadge>
                    )}
                  </div>
                  <div className={cn("px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider", stage.color, stage.text)}>
                    {stage.label}
                  </div>
                </div>

                <h3 className="font-bold text-lg mb-2 group-hover:text-eerie transition-colors">
                  {title}
                </h3>

                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
                  <User size={14} />
                  <span>Agent : {dossier.assignedAgentName || 'En attente'}</span>
                </div>

                <div className="mt-auto pt-6 border-t border-border/40 flex items-center justify-between">
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-9 h-9 rounded-lg neu-inset flex items-center justify-center text-eerie">
                        <Building2 size={16} />
                      </div>
                      <span className="text-[10px] font-bold text-muted-foreground">{dossier.propertyCount || 0}</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-9 h-9 rounded-lg neu-inset flex items-center justify-center text-eerie">
                        <FileText size={16} />
                      </div>
                      <span className="text-[10px] font-bold text-muted-foreground">{dossier.documentCount || 0}</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-9 h-9 rounded-lg neu-inset flex items-center justify-center text-eerie">
                        <Calendar size={16} />
                      </div>
                      <span className="text-[10px] font-bold text-muted-foreground">{dossier.meetingCount || 0}</span>
                    </div>
                  </div>

                  <div className="relative w-12 h-12 flex items-center justify-center">
                    <svg className="w-12 h-12 -rotate-90">
                      <circle
                        cx="24"
                        cy="24"
                        r="20"
                        fill="transparent"
                        stroke="currentColor"
                        strokeWidth="4"
                        className="text-muted/20"
                      />
                      <circle
                        cx="24"
                        cy="24"
                        r="20"
                        fill="transparent"
                        stroke="currentColor"
                        strokeWidth="4"
                        strokeDasharray={125.6}
                        strokeDashoffset={125.6 * (1 - (dossier.aiLeadScore || 0) / 100)}
                        className="text-vanilla transition-all duration-1000"
                      />
                    </svg>
                    <span className="absolute text-[10px] font-bold">{dossier.aiLeadScore || '--'}</span>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-end text-xs font-bold text-muted-foreground group-hover:text-eerie transition-colors">
                  Détails <ChevronRight size={14} className="ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </NeuCard>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
