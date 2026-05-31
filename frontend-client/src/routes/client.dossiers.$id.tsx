import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { useDossiers, useDossier, useDossierActivity } from "@/hooks/use-dossiers";
import { NeuCard } from "@/components/ui/neu-card";
import { SoftBadge, Avatar } from "@/components/ui/design-bits";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Building2, 
  FileText, 
  History, 
  TrendingUp, 
  MapPin, 
  Banknote, 
  Maximize2, 
  Layers, 
  Calendar, 
  Clock, 
  ChevronRight,
  Download,
  AlertTriangle,
  CheckCircle2,
  Info,
  Map as MapIcon,
  X,
  FileSignature,
  ArrowRight
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/client/dossiers/$id")({
  component: DossierDetailPage,
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

const STEPS = ["Nouveau", "Froid", "Tiède", "Chaud", "Négociation", "Contrat", "Clôturé"];
const stageToIdx: Record<string, number> = {
  NEW: 0, COLD: 1, WARM: 2, HOT: 3, NEGOTIATION: 4, CONTRACT: 5, CLOSED: 6,
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

function DossierDetailPage() {
  const { id } = useParams({ from: "/client/dossiers/$id" });
  const { data: dossier, isLoading: loadingDossier } = useDossier(id);
  const { data: activity, isLoading: loadingActivity } = useDossierActivity(id);
  const [mapUrl, setMapUrl] = useState<string | null>(null);

  if (loadingDossier) {
    return (
      <div className="space-y-6 max-w-[1200px]">
        <Skeleton className="h-12 w-3/4" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-[200px] md:col-span-2" />
          <Skeleton className="h-[200px]" />
        </div>
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (!dossier) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4 text-center">
        <h2 className="text-2xl font-bold text-destructive">Dossier introuvable</h2>
        <Link to="/client/dossiers" className="text-eerie hover:underline font-medium">
          Retour à la liste
        </Link>
      </div>
    );
  }

  const currentStepIdx = stageToIdx[dossier.stage] ?? 0;
  const isLost = dossier.stage === "LOST";

  const formatCurrency = (amount?: number) => {
    if (amount === undefined || amount === null) return "-- MAD";
    return amount.toLocaleString("fr-MA") + " MAD";
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "--";
    return format(new Date(dateStr), "d MMMM yyyy", { locale: fr });
  };

  return (
    <div className="space-y-8 max-w-[1200px] pb-12">
      {/* Header */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              <SoftBadge tone={dossier.clientType === 'BUYER' ? 'info' : 'success'}>
                {dossier.clientType === 'BUYER' ? 'ACHETEUR' : 'VENDEUR'}
              </SoftBadge>
              {dossier.isUrgent && (
                <SoftBadge tone="danger" className="animate-pulse">URGENT</SoftBadge>
              )}
            </div>
            <h1 className="text-3xl font-bold tracking-tight">
              {dossier.clientType === "BUYER" ? "Dossier Acheteur" : "Dossier Vendeur"} — {PROPERTY_TYPES[dossier.propertyType] || dossier.propertyType} à Casablanca
            </h1>
            <div className="flex items-center gap-3 text-muted-foreground">
              <Avatar name={dossier.assignedAgentName || "A"} size={24} />
              <span className="text-sm">Agent : <span className="font-semibold text-eerie">{dossier.assignedAgentName || 'En attente'}</span></span>
            </div>
          </div>
          <Link 
            to="/client/dossiers"
            className="text-sm font-bold text-muted-foreground hover:text-eerie flex items-center gap-1 transition-colors"
          >
            <ChevronRight size={14} className="rotate-180" /> Retour aux dossiers
          </Link>
        </div>

        {/* Progress Bar */}
        <NeuCard className="bg-ghost/50">
          <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4 px-1">
            <span>Début</span>
            <span>En cours</span>
            <span>Clôture</span>
          </div>
          <div className="relative h-3 bg-border rounded-full overflow-hidden">
            <div 
              className={cn(
                "absolute top-0 left-0 h-full transition-all duration-1000 ease-out",
                isLost ? "bg-gray-400 w-full opacity-30" : "bg-vanilla"
              )}
              style={{ width: isLost ? "100%" : `${(currentStepIdx / (STEPS.length - 1)) * 100}%` }}
            />
          </div>
          <div className="flex justify-between mt-3 overflow-x-auto soft-scroll pb-1 gap-4">
            {STEPS.map((label, i) => {
              const active = i === currentStepIdx;
              const done = i < currentStepIdx;
              return (
                <div key={label} className="flex flex-col items-center gap-1 min-w-fit">
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    isLost ? "bg-gray-300" : active ? "bg-vanilla ring-4 ring-vanilla/20" : done ? "bg-vanilla/60" : "bg-border"
                  )} />
                  <span className={cn(
                    "text-[10px] font-bold whitespace-nowrap",
                    isLost ? "text-gray-400" : active ? "text-eerie" : "text-muted-foreground/60"
                  )}>
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
        </NeuCard>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <NeuCard className="md:col-span-1 space-y-4">
          <h3 className="font-bold flex items-center gap-2 border-b pb-2">
            <Info size={16} /> Profil du projet
          </h3>
          <div className="space-y-4 pt-2">
            {dossier.clientType === "BUYER" ? (
              <>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Budget</p>
                  <p className="font-bold text-eerie">{formatCurrency(dossier.budgetMin)} — {formatCurrency(dossier.budgetMax)}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Type</p>
                    <p className="text-sm font-semibold">{PROPERTY_TYPES[dossier.propertyType] || dossier.propertyType}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Surface</p>
                    <p className="text-sm font-semibold">{dossier.preferredSizeM2 ? `${dossier.preferredSizeM2} m²` : "Non spécifié"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Étage</p>
                    <p className="text-sm font-semibold">
                      {dossier.preferredFloor === 0 ? "RDC" : dossier.preferredFloor === -1 ? "Tout étage" : `Étage ${dossier.preferredFloor}`}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Zone</p>
                    <p className="text-sm font-semibold">{dossier.preferredArea || "Grand Casablanca"}</p>
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Type de bien en vente</p>
                <p className="text-sm font-semibold">{PROPERTY_TYPES[dossier.propertyType] || dossier.propertyType}</p>
              </div>
            )}
          </div>
        </NeuCard>

        {/* AI Insight Card */}
        <NeuCard className="md:col-span-2 bg-vanilla/20 border-vanilla/30 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <SoftBadge tone="warn">Intelligence Artificielle</SoftBadge>
            <div className="flex items-center gap-2 text-xs font-bold text-vanilla-foreground">
              Score IA : {dossier.aiLeadScore || '--'}%
            </div>
          </div>
          
          <div className="space-y-4 flex-1">
            <div className="space-y-2">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <TrendingUp size={18} className="text-vanilla" /> 
                {dossier.clientFriendlyAction || "Analyse en cours..."}
              </h3>
              {dossier.aiSummary ? (
                <p className="text-sm text-eerie/80 leading-relaxed italic">
                  "{dossier.aiSummary}"
                </p>
              ) : (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                </div>
              )}
            </div>
          </div>

          {dossier.aiRecommendedAction && (
            <div className="mt-6 pt-4 border-t border-vanilla/20">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Action recommandée</p>
              <p className="text-sm font-bold text-eerie">{dossier.aiRecommendedAction}</p>
            </div>
          )}
        </NeuCard>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="properties" className="w-full">
        <TabsList className="w-full justify-start h-auto p-0 bg-transparent border-b rounded-none gap-6 overflow-x-auto soft-scroll no-scrollbar">
          {dossier.clientType === "BUYER" && (
            <>
              <TabsTrigger 
                value="properties" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-eerie data-[state=active]:bg-transparent px-2 py-4 font-bold text-sm transition-all"
              >
                BIENS PROPOSÉS
              </TabsTrigger>
              <TabsTrigger 
                value="offers" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-eerie data-[state=active]:bg-transparent px-2 py-4 font-bold text-sm transition-all"
              >
                MES OFFRES
              </TabsTrigger>
            </>
          )}
          <TabsTrigger 
            value="contracts" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-eerie data-[state=active]:bg-transparent px-2 py-4 font-bold text-sm transition-all"
          >
            CONTRATS
          </TabsTrigger>
          <TabsTrigger 
            value="activity" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-eerie data-[state=active]:bg-transparent px-2 py-4 font-bold text-sm transition-all"
          >
            ACTIVITÉ
          </TabsTrigger>
        </TabsList>

        {/* Properties Tab */}
        <TabsContent value="properties" className="pt-6">
          {!dossier.properties || dossier.properties.length === 0 ? (
            <div className="py-20 text-center space-y-4">
              <div className="w-16 h-16 bg-alice rounded-full flex items-center justify-center mx-auto">
                <Building2 className="text-muted-foreground" size={32} />
              </div>
              <p className="text-muted-foreground">Votre agent n'a pas encore sélectionné de biens.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {dossier.properties.map((prop: any) => (
                <NeuCard key={prop.idProperty} className="p-0 overflow-hidden group flex flex-col">
                  <div className="relative h-48 overflow-hidden">
                    <img 
                      src={prop.imageUrls?.[0] || "https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=1000&auto=format&fit=crop"} 
                      alt={prop.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3">
                      {prop.visitStatus === "VISITED" ? (
                        <SoftBadge tone="success">VISITÉ</SoftBadge>
                      ) : prop.visitStatus === "VISIT_PLANNED" ? (
                        <SoftBadge tone="info">VISITE PLANIFIÉE</SoftBadge>
                      ) : null}
                    </div>
                  </div>
                  <div className="p-5 flex-1 flex flex-col">
                    <h4 className="font-bold text-lg mb-1">{prop.title}</h4>
                    <div className="flex items-center gap-1 text-muted-foreground text-xs mb-4">
                      <MapPin size={12} /> {prop.city || 'Casablanca'}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-y-3 mb-6">
                      <div className="flex items-center gap-2 text-xs font-semibold">
                        <Maximize2 size={14} className="text-muted-foreground" /> {prop.surfaceM2} m²
                      </div>
                      <div className="flex items-center gap-2 text-xs font-semibold">
                        <Layers size={14} className="text-muted-foreground" /> {prop.numRooms} pièces
                      </div>
                      <div className="flex items-center gap-2 text-xs font-semibold">
                        <Building2 size={14} className="text-muted-foreground" /> {prop.floor === 0 ? "RDC" : `Étage ${prop.floor}`}
                      </div>
                    </div>

                    <div className="mt-auto pt-4 border-t flex items-center justify-between">
                      <span className="text-lg font-bold text-eerie">{formatCurrency(prop.price)}</span>
                      <button 
                        onClick={() => setMapUrl(`https://www.google.com/maps/embed/v1/place?key=YOUR_API_KEY&q=${encodeURIComponent(prop.address + ' ' + prop.city)}`)}
                        className="p-2 rounded-lg neu-sm hover:neu-pressable text-muted-foreground hover:text-eerie transition-all"
                      >
                        <MapIcon size={18} />
                      </button>
                    </div>
                  </div>
                </NeuCard>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Offers Tab */}
        <TabsContent value="offers" className="pt-6">
          {!dossier.offers || dossier.offers.length === 0 ? (
            <div className="py-20 text-center space-y-4">
              <div className="w-16 h-16 bg-alice rounded-full flex items-center justify-center mx-auto">
                <Banknote className="text-muted-foreground" size={32} />
              </div>
              <p className="text-muted-foreground">Aucune offre soumise.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {dossier.offers.map((offer: any) => {
                const diff = offer.propertyPrice ? ((offer.offerAmount - offer.propertyPrice) / offer.propertyPrice) * 100 : 0;
                const isSignificantDiff = Math.abs(diff) > 2;
                
                return (
                  <NeuCard key={offer.idOffer} className="flex gap-4 group hover:neu-pressable transition-all">
                    <div className="w-24 h-24 rounded-xl overflow-hidden shrink-0 shadow-inner">
                      <img 
                        src={offer.propertyImage || "https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=1000&auto=format&fit=crop"} 
                        alt="Property" 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="font-black truncate pr-2 text-eerie">{offer.propertyTitle}</h4>
                        <SoftBadge tone={
                          offer.status === 'ACCEPTED' ? 'success' : 
                          offer.status === 'REJECTED' ? 'danger' : 
                          offer.status === 'WITHDRAWN' ? 'warn' : 'info'
                        } className="text-[9px] px-2 py-0.5 font-black uppercase">
                          {offer.status === 'ACCEPTED' ? 'ACCEPTEE' : 
                           offer.status === 'REJECTED' ? 'REFUSEE' : 
                           offer.status === 'WITHDRAWN' ? 'RETIREE' : 'EN EXAMEN'}
                        </SoftBadge>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-lg font-black text-eerie">{formatCurrency(offer.offerAmount)}</span>
                        {isSignificantDiff && (
                          <span className={cn(
                            "text-[10px] font-black px-1.5 py-0.5 rounded flex items-center gap-0.5",
                            diff > 0 ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                          )}>
                            {diff > 0 ? <TrendingUp size={10} /> : <TrendingUp size={10} className="rotate-180" />}
                            {diff > 0 ? '+' : ''}{diff.toFixed(1)}%
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">Prix demandé :</span>
                        <span className="text-[10px] font-black text-muted-foreground/80 line-through">{formatCurrency(offer.propertyPrice)}</span>
                      </div>
                      <div className="flex items-center justify-between mt-4">
                        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Soumise le {formatDate(offer.createdAt)}</span>
                        {offer.status === 'ACCEPTED' && (
                          <div className="flex items-center gap-1 text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full animate-pulse">
                            <CheckCircle2 size={10} /> ÉTAPE CONTRAT
                          </div>
                        )}
                      </div>
                    </div>
                  </NeuCard>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Contracts Tab */}
        <TabsContent value="contracts" className="pt-6">
          {!dossier.contracts || dossier.contracts.length === 0 ? (
            <div className="py-20 text-center space-y-4">
              <div className="w-16 h-16 bg-alice rounded-full flex items-center justify-center mx-auto">
                <FileSignature className="text-muted-foreground" size={32} />
              </div>
              <p className="text-muted-foreground">Aucun contrat pour ce dossier.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {dossier.contracts.map((contract: any) => (
                <NeuCard key={contract.idContract} className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <h4 className="font-bold">Contrat de vente</h4>
                      <p className="text-xs text-muted-foreground">Créé le {formatDate(contract.createdAt)}</p>
                    </div>
                    <SoftBadge tone={
                      contract.status === 'RECEIVED_SIGNED' ? 'success' : 
                      contract.status === 'SENT' ? 'info' : 
                      contract.status === 'ARCHIVED' ? 'warn' : 'neutral'
                    }>
                      {contract.status === 'RECEIVED_SIGNED' ? 'SIGNÉ' : 
                       contract.status === 'SENT' ? 'ENVOYÉ' : 
                       contract.status === 'ARCHIVED' ? 'ARCHIVÉ' : 'BROUILLON'}
                    </SoftBadge>
                  </div>

                  <div className="grid grid-cols-2 gap-4 py-2">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Prix convenu</p>
                      <p className="text-sm font-bold">{formatCurrency(contract.agreedPrice)}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Acompte</p>
                      <p className="text-sm font-bold">{formatCurrency(contract.depositAmount)}</p>
                    </div>
                  </div>

                  {contract.aiRiskSummary ? (
                    <div className="bg-honeydew/30 border border-honeydew/50 rounded-xl p-4 flex gap-3">
                      <CheckCircle2 size={18} className="text-green-600 shrink-0" />
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-green-800">✓ Contrat analysé par IA</p>
                        <p className="text-xs text-green-700 leading-relaxed">{contract.aiRiskSummary}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-2/3" />
                    </div>
                  )}

                  {contract.filePath && (
                    <button 
                      onClick={() => window.open(`http://localhost:8081/api/client/contracts/${contract.idContract}/download`, '_blank')}
                      className="w-full mt-2 py-3 rounded-xl neu-sm hover:neu-pressable text-sm font-bold flex items-center justify-center gap-2 transition-all"
                    >
                      <Download size={16} /> Télécharger le contrat (PDF)
                    </button>
                  )}
                </NeuCard>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="pt-6">
          {loadingActivity ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full" />)}
            </div>
          ) : !activity || activity.length === 0 ? (
            <div className="py-20 text-center space-y-4">
              <div className="w-16 h-16 bg-alice rounded-full flex items-center justify-center mx-auto">
                <History className="text-muted-foreground" size={32} />
              </div>
              <p className="text-muted-foreground">Aucune activité enregistrée.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activity.map((event: any, i: number) => (
                <div key={i} className="flex gap-4 group">
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full neu-inset flex items-center justify-center text-eerie shrink-0 group-hover:neu-sm transition-all">
                      {event.type === 'INTERACTION' ? <Clock size={16} /> : 
                       event.type === 'MEETING' ? <Calendar size={16} /> : 
                       event.type === 'DOCUMENT' ? <FileText size={16} /> : 
                       event.type === 'CONTRACT' ? <FileSignature size={16} /> : 
                       <TrendingUp size={16} />}
                    </div>
                    {i < activity.length - 1 && <div className="w-0.5 h-full bg-border my-1" />}
                  </div>
                  <div className="pb-8 pt-1 flex-1">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-bold text-sm">{event.title}</h4>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">{formatDate(event.date)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{event.description}</p>
                    {event.agentName && (
                      <div className="mt-2 text-[10px] font-semibold text-eerie/60 italic">
                        — {event.agentName}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div className="pt-4 border-t">
                <Link 
                  to="/client/chronologie"
                  className="text-sm font-bold text-eerie hover:underline flex items-center gap-1"
                >
                  Voir toute la chronologie <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Map Modal */}
      {mapUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-eerie/60 backdrop-blur-sm" onClick={() => setMapUrl(null)} />
          <div className="relative w-full max-w-4xl bg-ghost rounded-3xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-4 flex justify-between items-center border-b">
              <h3 className="font-bold">Localisation du bien</h3>
              <button 
                onClick={() => setMapUrl(null)}
                className="w-10 h-10 rounded-xl neu-sm flex items-center justify-center hover:neu-pressable transition-all"
              >
                <X size={18} />
              </button>
            </div>
            <div className="aspect-video">
              <iframe
                width="100%"
                height="100%"
                frameBorder="0"
                style={{ border: 0 }}
                src={mapUrl}
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
