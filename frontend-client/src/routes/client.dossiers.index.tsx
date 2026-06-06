import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useDossiers, Dossier } from "@/hooks/use-dossiers";
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
  Building2,
  Filter,
  ArrowUpDown,
  Search,
  X,
  Plus
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useClientData } from "@/hooks/use-client-data";
import { MurshidChatbot } from "@/components/ai/MurshidChatbot";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/client/dossiers/")({
  component: DossiersListPage,
});

const STAGE_CONFIG: Record<string, { label: string; tone: "info" | "success" | "warn" | "danger" | "neutral" }> = {
  NEW: { label: "Nouveau", tone: "info" },
  COLD: { label: "Froid", tone: "neutral" },
  WARM: { label: "Tiède", tone: "warn" },
  HOT: { label: "Chaud", tone: "warn" },
  NEGOTIATION: { label: "Négociation", tone: "info" },
  CONTRACT: { label: "Contrat", tone: "success" },
  CLOSED: { label: "Clôturé", tone: "success" },
  LOST: { label: "Perdu", tone: "danger" },
};

const PROPERTY_TYPES: Record<string, string> = {
  APARTMENT: "Appartement",
  VILLA: "Villa",
  OFFICE: "Bureau",
  LAND: "Terrain",
  STUDIO: "Studio",
  DUPLEX: "Duplex",
  PENTHOUSE: "Penthouse",
  HOUSE: "Maison",
  MANSION: "Manoir",
  COTTAGE: "Cottage",
  FARMHOUSE: "Ferme",
};

function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-xl bg-gradient-to-r from-muted via-alice to-muted animate-pulse", className)} />
  );
}

export function DossiersListPage() {
  const { data: dossiers, isLoading, isError, refetch: refetchDossiers } = useDossiers();
  const { data: clientData } = useClientData();
  const navigate = useNavigate();

  const [showMurshidModal, setShowMurshidModal] = useState(false);

  // Filtres
  const [filterType, setFilterType] = useState<string>("ALL");
  const [filterAgent, setFilterAgent] = useState<string>("ALL");
  const [filterStage, setFilterStage] = useState<string>("ALL");
  const [sortOrder, setSortOrder] = useState<"recent" | "old">("recent");

  // Liste unique des agents pour le filtre
  const agents = useMemo(() => {
    if (!dossiers) return [];
    const uniqueAgents = Array.from(new Set(dossiers.map(d => d.assignedAgentName).filter(Boolean)));
    return uniqueAgents;
  }, [dossiers]);

  const filteredDossiers = useMemo(() => {
    if (!dossiers) return [];
    
    let result = dossiers.filter(d => {
      const status = d.status?.toUpperCase();
      const isActive = status === 'ACTIVE'; // Strictly show only active dossiers
      const matchType = filterType === "ALL" || d.clientType === filterType;
      const matchAgent = filterAgent === "ALL" || d.assignedAgentName === filterAgent;
      const matchStage = filterStage === "ALL" || d.stage === filterStage;
      return isActive && matchType && matchAgent && matchStage;
    });

    return result.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return sortOrder === "recent" ? dateB - dateA : dateA - dateB;
    });
  }, [dossiers, filterType, filterAgent, filterStage, sortOrder]);

  useEffect(() => {
    if (dossiers && dossiers.length === 1 && filterType === "ALL" && filterAgent === "ALL" && filterStage === "ALL") {
      navigate({ 
        to: "/client/dossiers/$id", 
        params: { id: dossiers[0].idProfile } 
      });
    }
  }, [dossiers, navigate, filterType, filterAgent, filterStage]);

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-full pb-12">
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
            onClick={() => refetchDossiers()}
            className="px-6 py-2 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors"
          >
            Réessayer
          </button>
        </NeuCard>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-full pb-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-black tracking-tight text-eerie">Mes dossiers</h1>
          <p className="text-muted-foreground font-medium">Retrouvez l'ensemble de vos projets immobiliers en cours.</p>
        </div>
        <div className="flex items-center gap-4">
          <Dialog open={showMurshidModal} onOpenChange={setShowMurshidModal}>
            <DialogTrigger asChild>
              <button className="flex items-center gap-2 px-4 py-2 bg-eerie text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-vanilla hover:text-eerie transition-all shadow-lg shadow-eerie/10">
                <Plus size={14} /> OUVRIR AUTRE DOSSIER
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] p-0 border-none bg-transparent shadow-none">
              <DialogHeader className="sr-only">
                <DialogTitle>Murshid Dossier</DialogTitle>
              </DialogHeader>
              <MurshidChatbot 
                mode="dossier_only" 
                initialData={clientData?.profile ? {
                  clientId: clientData.profile.idClient,
                  firstName: clientData.profile.firstName,
                  lastName: clientData.profile.lastName,
                  email: clientData.profile.email,
                  phone: clientData.profile.phone
                } : undefined}
                onCompleted={() => {
                  setTimeout(() => {
                    setShowMurshidModal(false);
                    refetchDossiers();
                  }, 3000);
                }}
              />
            </DialogContent>
          </Dialog>

          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-muted-foreground/60 bg-alice/30 px-4 py-2 rounded-full border border-border/20">
            <Folder size={14} className="text-vanilla" /> {filteredDossiers.length} dossiers trouvés
          </div>
        </div>
      </header>

      {/* Barre de Filtres */}
      <NeuCard className="p-4 flex flex-wrap items-center gap-4 border-none shadow-sm">
        <div className="flex items-center gap-2 px-3 py-2 bg-ghost/40 rounded-xl border border-border/20">
          <Filter size={14} className="text-muted-foreground" />
          <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground/70">Filtrer par</span>
        </div>

        <select 
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="bg-white border border-border/40 rounded-xl px-4 py-2 text-xs font-bold text-eerie focus:outline-none focus:ring-2 ring-vanilla/20 transition-all cursor-pointer"
        >
          <option value="ALL">Tous les types</option>
          <option value="BUYER">Acheteur</option>
          <option value="SELLER">Vendeur</option>
        </select>

        <select 
          value={filterAgent}
          onChange={(e) => setFilterAgent(e.target.value)}
          className="bg-white border border-border/40 rounded-xl px-4 py-2 text-xs font-bold text-eerie focus:outline-none focus:ring-2 ring-vanilla/20 transition-all cursor-pointer"
        >
          <option value="ALL">Tous les agents</option>
          {agents.map(agent => (
            <option key={agent} value={agent}>{agent}</option>
          ))}
        </select>

        <select 
          value={filterStage}
          onChange={(e) => setFilterStage(e.target.value)}
          className="bg-white border border-border/40 rounded-xl px-4 py-2 text-xs font-bold text-eerie focus:outline-none focus:ring-2 ring-vanilla/20 transition-all cursor-pointer"
        >
          <option value="ALL">Tous les états</option>
          {Object.entries(STAGE_CONFIG).map(([key, config]) => (
            <option key={key} value={key}>{config.label}</option>
          ))}
        </select>

        <div className="h-6 w-[1px] bg-border/40 mx-2 hidden md:block" />

        <button 
          onClick={() => setSortOrder(prev => prev === "recent" ? "old" : "recent")}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-border/40 rounded-xl text-xs font-bold text-eerie hover:bg-alice/20 transition-all active:scale-95"
        >
          <ArrowUpDown size={14} className="text-vanilla" />
          {sortOrder === "recent" ? "Plus récent → Plus ancien" : "Plus ancien → Plus récent"}
        </button>

        {(filterType !== "ALL" || filterAgent !== "ALL" || filterStage !== "ALL") && (
          <button 
            onClick={() => { setFilterType("ALL"); setFilterAgent("ALL"); setFilterStage("ALL"); }}
            className="ml-auto flex items-center gap-1.5 text-[10px] font-black text-danger hover:underline uppercase tracking-widest"
          >
            <X size={12} /> Réinitialiser
          </button>
        )}
      </NeuCard>

      {filteredDossiers.length === 0 ? (
        <div className="h-[40vh] flex flex-col items-center justify-center gap-4 text-center">
          <div className="w-16 h-16 rounded-full bg-alice flex items-center justify-center mb-2">
            <Search className="text-muted-foreground/40" size={32} />
          </div>
          <h2 className="text-xl font-bold text-eerie">Aucun résultat</h2>
          <p className="text-muted-foreground text-sm max-w-xs font-medium">
            Aucun dossier ne correspond à vos critères de recherche. Essayez d'ajuster vos filtres.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDossiers.map((dossier: Dossier) => {
            const stage = STAGE_CONFIG[dossier.stage] || { label: dossier.stage, tone: "neutral" };
            const propertyType = PROPERTY_TYPES[dossier.propertyType] || dossier.propertyType;
            const title = dossier.clientType === "BUYER" 
              ? `Achat — ${propertyType}`
              : `Vente — ${propertyType}`;

            return (
              <Link 
                key={dossier.idProfile} 
                to="/client/dossiers/$id"
                params={{ id: dossier.idProfile }}
                className="group"
              >
                <NeuCard className="h-full flex flex-col hover:neu-pressable transition-all border-transparent hover:border-vanilla/30 p-6">
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex flex-wrap gap-2">
                      <SoftBadge tone={dossier.clientType === 'BUYER' ? 'info' : 'success'} className="font-black text-[9px] px-2.5 py-1 tracking-widest uppercase">
                        {dossier.clientType === 'BUYER' ? 'ACHETEUR' : 'VENDEUR'}
                      </SoftBadge>
                      {dossier.isUrgent && (
                        <SoftBadge tone="danger" className="animate-pulse font-black text-[9px] px-2.5 py-1 tracking-widest">URGENT</SoftBadge>
                      )}
                    </div>
                    <SoftBadge tone={stage.tone as any} className="font-bold text-[9px] px-2.5 py-1 uppercase tracking-wider">
                      {stage.label}
                    </SoftBadge>
                  </div>

                  <div className="space-y-1 mb-4">
                    <h3 className="font-black text-xl text-eerie group-hover:text-vanilla transition-colors leading-tight">
                      {title}
                    </h3>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                      {dossier.createdAt && new Date(dossier.createdAt).getTime() > 0
                        ? `Créé le ${format(new Date(dossier.createdAt), "d MMMM yyyy", { locale: fr })}`
                        : "Date de création inconnue"}
                    </p>
                  </div>

                  <div className="flex items-center gap-2.5 p-3 bg-alice/30 rounded-2xl border border-alice mb-6">
                    <div className="w-8 h-8 rounded-full bg-vanilla/10 flex items-center justify-center text-vanilla shrink-0">
                      <User size={16} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9px] font-black text-muted-foreground/60 uppercase tracking-tighter">Agent assigné</p>
                      <p className="text-xs font-bold text-eerie truncate">{dossier.assignedAgentName || 'En attente'}</p>
                    </div>
                  </div>

                  <div className="mt-auto pt-6 border-t border-border/40 flex items-center justify-between">
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center gap-1.5" title="Propriétés">
                        <div className="w-9 h-9 rounded-xl neu-inset flex items-center justify-center text-eerie group-hover:text-vanilla transition-colors">
                          <Building2 size={16} />
                        </div>
                        <span className="text-[10px] font-black text-muted-foreground">{dossier.propertyCount || dossier.properties?.length || 0}</span>
                      </div>
                      <div className="flex flex-col items-center gap-1.5" title="Documents">
                        <div className="w-9 h-9 rounded-xl neu-inset flex items-center justify-center text-eerie group-hover:text-vanilla transition-colors">
                          <FileText size={16} />
                        </div>
                        <span className="text-[10px] font-black text-muted-foreground">{dossier.documentCount || dossier.documents?.length || 0}</span>
                      </div>
                      <div className="flex flex-col items-center gap-1.5" title="Rendez-vous">
                        <div className="w-9 h-9 rounded-xl neu-inset flex items-center justify-center text-eerie group-hover:text-vanilla transition-colors">
                          <Calendar size={16} />
                        </div>
                        <span className="text-[10px] font-black text-muted-foreground">{dossier.meetingCount || dossier.meetings?.length || 0}</span>
                      </div>
                    </div>

                    <div className="relative w-14 h-14 flex items-center justify-center group/score">
                      <svg className="w-14 h-14 -rotate-90">
                        <circle
                          cx="28"
                          cy="28"
                          r="24"
                          fill="transparent"
                          stroke="currentColor"
                          strokeWidth="5"
                          className="text-muted/10"
                        />
                        <circle
                          cx="28"
                          cy="28"
                          r="24"
                          fill="transparent"
                          stroke="currentColor"
                          strokeWidth="5"
                          strokeDasharray={150.8}
                          strokeDashoffset={150.8 * (1 - (dossier.aiLeadScore || 0) / 100)}
                          className="text-vanilla transition-all duration-1000"
                        />
                      </svg>
                      <div className="absolute flex flex-col items-center justify-center">
                        <span className="text-[11px] font-black text-eerie">{dossier.aiLeadScore || '--'}</span>
                        <span className="text-[7px] font-black text-muted-foreground/60 uppercase tracking-tighter -mt-1">Score</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex items-center justify-end text-[10px] font-black text-muted-foreground group-hover:text-vanilla transition-colors uppercase tracking-widest">
                    Ouvrir le dossier <ChevronRight size={14} className="ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </NeuCard>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
