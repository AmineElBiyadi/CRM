import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { useDossiers, useDossier, useDossierActivity } from "@/hooks/use-dossiers";
import { useClientData, useOfferActions } from "@/hooks/use-client-data";
import { documentApi } from "@/api/documentApi";
import { toast } from "sonner";
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
  ArrowRight,
  Phone,
  Image as ImageIcon,
  Clock4,
  ExternalLink,
  Loader2
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/client/dossiers/$id")({
  component: DossierDetailPage,
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

const STEPS = ["Nouveau", "Froid", "Tiède", "Chaud", "Négociation", "Contrat", "Clôturé"];
const stageToIdx: Record<string, number> = {
  NEW: 0, COLD: 1, WARM: 2, HOT: 3, NEGOTIATION: 4, CONTRACT: 5, CLOSED: 6,
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
  COTTAGE: "Chalet",
  FARMHOUSE: "Ferme",
};

const MEETING_TYPE_MAP: Record<string, { label: string; icon: any; color: string }> = {
  PROPERTY_VISIT: { label: "Visite", icon: MapPin, color: "text-blue-600 bg-blue-50" },
  PHONE_CALL: { label: "Appel", icon: Phone, color: "text-purple-600 bg-purple-50" },
  OFFICE_APPOINTMENT: { label: "RDV Agence", icon: Building2, color: "text-amber-600 bg-amber-50" },
  CONTRACT_SIGNING: { label: "Signature", icon: FileSignature, color: "text-emerald-600 bg-emerald-50" },
};

const MEETING_STATUS_CONFIG: Record<string, { label: string; tone: "success" | "info" | "warn" | "danger" | "neutral" }> = {
  SCHEDULED:   { label: "Confirmé",    tone: "success" },
  PENDING:     { label: "En attente",  tone: "info" },
  RESCHEDULED: { label: "Reprogrammé", tone: "warn" },
  POSTPONED:   { label: "Reporté",     tone: "warn" },
  CANCELED:    { label: "Annulé",      tone: "danger" },
  COMPLETED:   { label: "Terminé",     tone: "success" },
};

function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-xl bg-gradient-to-r from-muted via-alice to-muted animate-pulse", className)} />
  );
}

function DossierDetailPage() {
  const { id } = useParams({ from: "/client/dossiers/$id" });
  const { data: dossier, isLoading: loadingDossier, refetch: refetchDossier } = useDossier(id);
  const { data: activity, isLoading: loadingActivity } = useDossierActivity(id);
  const { data: clientData, isLoading: loadingClientData, refetch: refetchClientData } = useClientData();
  const { accept: acceptOffer, reject: rejectOffer, withdraw: withdrawOffer } = useOfferActions();
  
  // Get documents directly from dossier object
  const documents = dossier?.documents || [];
  const contracts = dossier?.contracts || [];
  const loadingDocuments = loadingDossier;
  const refetchDocuments = refetchDossier;

  const [mapUrl, setMapUrl] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [previewDocUrl, setPreviewDocUrl] = useState<string | null>(null);
  const [uploadingDocId, setUploadingDocId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (type: string, file: File, idDocument: string) => {
    if (!dossier?.idDeal) return;
    
    setUploadingDocId(idDocument);
    try {
      await documentApi.uploadDocument(dossier.idDeal, type, file);
      toast.success("Document téléchargé avec succès");
      refetchDocuments();
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Erreur lors du téléchargement du document");
    } finally {
      setUploadingDocId(null);
    }
  };

  if (loadingDossier) {
    return (
      <div className="space-y-6 max-w-full pb-12">
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
        <h2 className="text-2xl font-black text-danger">Dossier introuvable</h2>
        <Link to="/client/dossiers" className="text-eerie hover:underline font-bold uppercase tracking-widest text-xs">
          Retour à la liste des dossiers
        </Link>
      </div>
    );
  }

  const currentStepIdx = stageToIdx[dossier.stage] ?? 0;
  const isLost = dossier.stage === "LOST";

  // Problem 5: Mapping translations for activity types
  const ACTIVITY_TRANSLATIONS: Record<string, string> = {
    PROPERTY_VISIT: "Visite du bien",
    CONTRACT_SIGNING: "Signature du contrat",
    OFFICE_APPOINTMENT: "Rendez-vous agence",
    PHONE_CALL: "Appel téléphonique",
    EMAIL: "Échange d'email",
    MEETING: "Rendez-vous",
    INTERACTION: "Interaction",
    DOCUMENT: "Document ajouté",
    CONTRACT: "Contrat généré",
    OFFER: "Offre soumise",
  };

  // Filter meetings: exclude DRAFT and MISSED
  const filteredMeetings = dossier.meetings?.filter((m: any) =>
    m.status !== 'DRAFT' && m.status !== 'MISSED'
  ) || [];

  const formatCurrency = (amount?: number) => {
    if (amount === undefined || amount === null) return "-- MAD";
    return amount.toLocaleString("fr-MA") + " MAD";
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "--";
    return format(new Date(dateStr), "d MMMM yyyy", { locale: fr });
  };

  return (
    <div className="space-y-8 max-w-full pb-12">
      {/* Header & Agent Info */}
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <SoftBadge tone={dossier.clientType === 'BUYER' ? 'info' : 'success'} className="font-black tracking-widest text-[9px]">
                {dossier.clientType === 'BUYER' ? 'ACHETEUR' : 'VENDEUR'}
              </SoftBadge>
              {dossier.isUrgent && (
                <SoftBadge tone="danger" className="animate-pulse font-black tracking-widest text-[9px]">URGENT</SoftBadge>
              )}
              <SoftBadge tone={STAGE_CONFIG[dossier.stage || "NEW"]?.tone as any} className="font-black tracking-widest text-[9px]">
                {STAGE_CONFIG[dossier.stage || "NEW"]?.label}
              </SoftBadge>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-eerie leading-tight">
              {dossier.propertyTitle || (dossier.clientType === "BUYER" ? `Achat — ${PROPERTY_TYPES[dossier.propertyType || "APARTMENT"] || dossier.propertyType}` : `Vente — ${PROPERTY_TYPES[dossier.propertyType || "APARTMENT"] || dossier.propertyType}`)}
            </h1>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-3 px-4 py-2 bg-white rounded-2xl border border-border/40 shadow-sm">
                <Avatar name={dossier.assignedAgentName || "A"} size={32} className="ring-2 ring-vanilla/20" />
                <div className="min-w-0">
                  <p className="text-[9px] font-black text-muted-foreground/60 uppercase tracking-tighter">Agent responsable</p>
                  <p className="text-xs font-black text-eerie truncate">{dossier.assignedAgentName || 'En attente'}</p>
                </div>
                {dossier.assignedAgentPhone && (
                  <div className="flex flex-col ml-4 pl-4 border-l-2 border-vanilla/30">
                    <p className="text-[8px] font-black text-muted-foreground/50 uppercase tracking-widest mb-0.5">Contact direct</p>
                    <a
                      href={`tel:${dossier.assignedAgentPhone}`}
                      className="text-sm font-black text-vanilla hover:text-eerie transition-colors flex items-center gap-1.5"
                    >
                      <Phone size={10} className="fill-vanilla/20" /> {dossier.assignedAgentPhone}
                    </a>
                  </div>
                )}
              </div>
              {dossier.city && (
                <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                  <MapPin size={14} className="text-vanilla" /> {dossier.address ? `${dossier.address}, ` : ''}{dossier.city}
                </div>
              )}
            </div>
          </div>
          <Link
            to="/client/dossiers"
            className="group px-6 py-3 bg-white border border-border/40 text-muted-foreground rounded-2xl font-black text-[10px] tracking-widest hover:text-eerie transition-all flex items-center gap-2 active:scale-95 shadow-sm"
          >
            <ArrowRight size={14} className="rotate-180 group-hover:-translate-x-1 transition-transform" /> RETOUR AUX DOSSIERS
          </Link>
        </div>

        {/* Progress Bar */}
        <NeuCard className="bg-ghost/30 border-none">
          <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 mb-6 px-1">
            <span>Début du projet</span>
            <span>En cours</span>
            <span>Finalisation</span>
          </div>

          <div className="relative px-6"> {/* Added padding to align with labels */}
            {/* Background Track */}
            <div className="absolute top-1/2 -translate-y-1/2 left-6 right-6 h-1.5 bg-white/50 rounded-full shadow-inner border border-white" />

            {/* Progress Fill */}
            <div
              className={cn(
                "absolute top-1/2 -translate-y-1/2 left-6 h-1.5 transition-all duration-1000 ease-out rounded-full z-10",
                isLost ? "bg-danger/40 w-[calc(100%-48px)]" : "bg-vanilla shadow-[0_0_10px_rgba(232,232,87,0.5)]"
              )}
              style={{ width: isLost ? "calc(100% - 48px)" : `calc(${(currentStepIdx / (STEPS.length - 1)) * 100}%)` }}
            />

            <div className="relative flex justify-between items-center z-20">
              {STEPS.map((label, i) => {
                const active = i === currentStepIdx;
                const done = i < currentStepIdx;
                return (
                  <div key={label} className="flex flex-col items-center min-w-fit">
                    <div className={cn(
                      "w-4 h-4 rounded-full transition-all duration-500 border-2 flex items-center justify-center",
                      isLost ? "bg-danger/20 border-danger/40" :
                        active ? "bg-vanilla border-white ring-4 ring-vanilla/30 scale-125 shadow-[0_0_15px_rgba(232,232,87,0.6)]" :
                          done ? "bg-vanilla border-vanilla/40" :
                            "bg-white border-border shadow-inner"
                    )} />
                    <div className="absolute -bottom-8 flex flex-col items-center whitespace-nowrap">
                      <span className={cn(
                        "text-[9px] font-black uppercase tracking-tighter transition-all duration-300",
                        isLost ? "text-danger/60" : active ? "text-eerie scale-110 font-black" : "text-muted-foreground/40"
                      )}>
                        {label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="h-10" /> {/* Spacer for absolute labels */}
        </NeuCard>

        <div className="h-4" /> {/* Smaller spacer */}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Main Details Card */}
        <div className="lg:col-span-2 space-y-8">
          <NeuCard className="p-8 space-y-8">
            <div className="flex items-center justify-between border-b border-border/40 pb-4">
              <h3 className="text-sm font-black uppercase tracking-widest text-eerie flex items-center gap-2">
                <Building2 size={18} className="text-vanilla" /> Caractéristiques du bien
              </h3>
              {dossier.clientType === "SELLER" ? (
                <div className="text-right">
                  <p className="text-[9px] font-black text-muted-foreground/60 uppercase tracking-widest">
                    Prix demandé
                  </p>
                  <p className="text-2xl font-black text-vanilla">{formatCurrency(dossier.askingPrice || 0)}</p>
                </div>
              ) : (
                <div className="text-right">
                  <p className="text-[9px] font-black text-muted-foreground/60 uppercase tracking-widest">
                    Budget cible
                  </p>
                  <p className="text-xl font-black text-vanilla">
                    {formatCurrency(dossier.budgetMin || 0)} - {formatCurrency(dossier.budgetMax || 0)}
                  </p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="space-y-1.5">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-50">Type</p>
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-alice rounded-xl text-eerie shadow-sm">
                    <Layers size={14} />
                  </div>
                  <p className="text-sm font-black text-eerie">{PROPERTY_TYPES[dossier.propertyType || "APARTMENT"] || dossier.propertyType || "Non défini"}</p>
                </div>
              </div>
              <div className="space-y-1.5">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-50">Superficie</p>
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-alice rounded-xl text-eerie shadow-sm">
                    <Maximize2 size={14} />
                  </div>
                  <p className="text-sm font-black text-eerie">{dossier.propertySurfaceM2 || dossier.preferredSizeM2 || "--"} m²</p>
                </div>
              </div>
              <div className="space-y-1.5">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-50">Étage</p>
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-alice rounded-xl text-eerie shadow-sm">
                    <Building2 size={14} />
                  </div>
                  <p className="text-sm font-black text-eerie">
                    {dossier.propertyFloor !== undefined && dossier.propertyFloor !== null ? (dossier.propertyFloor === 0 ? "RDC" : `Étage ${dossier.propertyFloor}`) :
                      (dossier.preferredFloor === 0 ? "RDC" : dossier.preferredFloor === -1 ? "Tout étage" : dossier.preferredFloor ? `Étage ${dossier.preferredFloor}` : "--")}
                  </p>
                </div>
              </div>
              <div className="space-y-1.5">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-50">
                  {dossier.clientType === 'BUYER' ? "Quartier souhaité" : "Pièces"}
                </p>
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-alice rounded-xl text-eerie shadow-sm">
                    {dossier.clientType === 'BUYER' ? <MapPin size={14} /> : <Layers size={14} />}
                  </div>
                  <p className="text-sm font-black text-eerie">
                    {dossier.clientType === 'BUYER' 
                      ? (dossier.preferredArea || "Non spécifié") 
                      : (dossier.numRooms || "--") + " pièces"}
                  </p>
                </div>
              </div>
            </div>

            {/* Photos Gallery (Only for Sellers) */}
            {dossier.clientType === 'SELLER' && dossier.propertyImageUrls && dossier.propertyImageUrls.length > 0 && (
              <div className="space-y-4 pt-4 border-t border-border/40">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 flex items-center gap-2">
                  <ImageIcon size={14} /> Galerie photos ({dossier.propertyImageUrls.length})
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {dossier.propertyImageUrls.map((url: string, idx: number) => (
                    <div
                      key={idx}
                      className="aspect-square rounded-2xl overflow-hidden cursor-pointer group relative shadow-sm hover:shadow-md transition-all active:scale-95 border-2 border-white"
                      onClick={() => setSelectedImage(url)}
                    >
                      <img src={url} alt={`Property ${idx}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-eerie/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Maximize2 className="text-white" size={20} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </NeuCard>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
            {/* AI Recommandation Card */}
            <NeuCard className="p-8 bg-eerie text-white border-none shadow-xl overflow-hidden relative group">
              <div className="absolute -right-12 -top-12 w-40 h-40 bg-vanilla/10 rounded-full blur-3xl group-hover:bg-vanilla/20 transition-all duration-1000" />

              <div className="flex flex-col justify-between gap-6 mb-8">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-vanilla/20 rounded-xl">
                    <TrendingUp size={20} className="text-vanilla" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-tight">Analyse Stratégique IA</h3>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-white/10 px-3 py-1.5 rounded-xl border border-white/10 w-fit">
                  <span className="text-[9px] font-black uppercase tracking-widest text-white/60">Score</span>
                  <span className="text-xl font-black text-vanilla">{dossier.aiLeadScore || '--'}%</span>
                </div>
              </div>

              <div className="space-y-6 relative z-10">
                <div className="p-4 bg-white/5 rounded-xl border border-white/5 backdrop-blur-sm">
                  <p className="text-[9px] font-bold text-vanilla mb-2 flex items-center gap-2 uppercase tracking-widest">
                    <Info size={10} /> Résumé
                  </p>
                  <p className="text-xs leading-relaxed text-white/80 font-medium italic">
                    "{dossier.aiSummary || "Analyse en cours..."}"
                  </p>
                </div>

                {dossier.aiRecommendedAction && (
                  <div className="flex items-start gap-3 p-4 bg-vanilla/10 rounded-xl border border-vanilla/20">
                    <AlertTriangle className="text-vanilla shrink-0" size={16} />
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-vanilla mb-1">Action</p>
                      <p className="text-xs font-black text-white">{dossier.aiRecommendedAction}</p>
                    </div>
                  </div>
                )}
              </div>
            </NeuCard>

            {/* Quick Activity Feed */}
            <NeuCard className="p-6 space-y-6">
              <h3 className="text-sm font-black uppercase tracking-widest text-eerie flex items-center gap-2 border-b border-border/40 pb-4">
                <History size={18} className="text-vanilla" /> Activité récente
              </h3>
              <div className="space-y-6">
                {loadingActivity ? (
                  [1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)
                ) : !activity || activity.length === 0 ? (
                  <p className="text-[10px] font-bold text-muted-foreground text-center py-4 uppercase tracking-widest">Aucun historique</p>
                ) : (
                  activity.slice(0, 5).map((event: any, i: number) => (
                    <div key={i} className="flex gap-3 relative">
                      {i < Math.min(activity.length, 5) - 1 && (
                        <div className="absolute left-[13px] top-8 bottom-[-24px] w-[1px] bg-border/40" />
                      )}
                      <div className="w-7 h-7 rounded-full bg-alice flex items-center justify-center text-muted-foreground shrink-0 z-10 border border-white">
                        {event.type === 'INTERACTION' ? <Clock size={12} /> :
                          event.type === 'MEETING' ? <Calendar size={12} /> :
                            <Info size={12} />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-black text-eerie truncate uppercase tracking-tighter">
                          {ACTIVITY_TRANSLATIONS[event.title] || event.title}
                        </p>
                        <p className="text-[9px] font-bold text-muted-foreground/60">{formatDate(event.date)}</p>
                      </div>
                    </div>
                  ))
                )}
                <Link
                  to="/client/chronologie"
                  className="block text-center py-3 border-t border-border/40 text-[9px] font-black text-muted-foreground hover:text-vanilla uppercase tracking-widest transition-colors"
                >
                  Voir tout l'historique
                </Link>
              </div>
            </NeuCard>
          </div>
        </div>

        {/* Sidebar: Meetings */}
        <div className="space-y-8">
          {/* Meetings Section */}
          <NeuCard className="p-6 space-y-6">
            <h3 className="text-sm font-black uppercase tracking-widest text-eerie flex items-center gap-2 border-b border-border/40 pb-4">
              <Calendar size={18} className="text-vanilla" /> Rendez-vous ({filteredMeetings.length})
            </h3>

            <div className="space-y-4">
              {filteredMeetings.length === 0 ? (
                <div className="py-8 text-center bg-alice/30 rounded-2xl border border-dashed border-border/60">
                  <Clock4 className="text-muted-foreground/40 mx-auto mb-2" size={24} />
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Aucun rendez-vous</p>
                </div>
              ) : (
                filteredMeetings.map((m: any) => {
                  const mConfig = MEETING_TYPE_MAP[m.type] || { label: m.type, icon: Calendar, color: "bg-ghost", borderColor: "border-gray-200" };
                  const borderColor = m.type === 'PROPERTY_VISIT' ? 'border-l-blue-500' :
                    m.type === 'PHONE_CALL' ? 'border-l-purple-500' :
                      m.type === 'OFFICE_APPOINTMENT' ? 'border-l-amber-500' :
                        m.type === 'CONTRACT_SIGNING' ? 'border-l-emerald-500' : 'border-l-gray-300';
                  const MIcon = mConfig.icon;
                  const isFuture = new Date(m.scheduledAt) > new Date();

                  return (
                    <div key={m.idMeeting} className={cn(
                      "p-4 bg-white rounded-2xl border border-border/40 border-l-4 shadow-sm hover:shadow-md transition-all group cursor-default relative overflow-hidden",
                      borderColor
                    )}>
                      <div className="absolute top-3 right-3">
                        <SoftBadge tone={MEETING_STATUS_CONFIG[m.status]?.tone || "info"} className="text-[7px] px-1.5 py-0 font-black uppercase">
                          {MEETING_STATUS_CONFIG[m.status]?.label || m.status}
                        </SoftBadge>
                      </div>
                      <div className="mb-3">
                        <div className={cn("px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest w-fit", mConfig.color)}>
                          {mConfig.label}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-alice rounded-xl text-eerie group-hover:bg-vanilla/10 transition-colors">
                          <MIcon size={16} />
                        </div>
                        <div>
                          <p className="text-xs font-black text-eerie">
                            {format(new Date(m.scheduledAt), "d MMMM yyyy", { locale: fr })}
                          </p>
                          <p className="text-[10px] font-bold text-muted-foreground">
                            {format(new Date(m.scheduledAt), "HH:mm", { locale: fr })}
                          </p>
                        </div>
                      </div>
                      {isFuture && (
                        <Link
                          to="/client/rendez-vous"
                          className="mt-3 w-full py-2 bg-ghost/40 hover:bg-vanilla/10 rounded-xl text-[9px] font-black uppercase tracking-widest text-muted-foreground hover:text-vanilla flex items-center justify-center gap-1.5 transition-all"
                        >
                          Gérer <ExternalLink size={10} />
                        </Link>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </NeuCard>
        </div>
      </div>

      {/* Secondary Tabs (Offers, Contracts, Documents) */}
      <div className="mt-12">
        <Tabs defaultValue={dossier.clientType === 'BUYER' ? "offers" : "contracts"} className="w-full">
          <TabsList className="w-full justify-start h-auto p-0 bg-transparent border-b border-border/40 rounded-none gap-8 overflow-x-auto no-scrollbar text-nowrap">
            {dossier.clientType === 'BUYER' && (
              <TabsTrigger
                value="offers"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-vanilla data-[state=active]:bg-transparent px-2 py-4 font-black text-[10px] tracking-widest uppercase transition-all"
              >
                Mes Offres ({dossier.offers?.length || 0})
              </TabsTrigger>
            )}
            <TabsTrigger
              value="contracts"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-vanilla data-[state=active]:bg-transparent px-2 py-4 font-black text-[10px] tracking-widest uppercase transition-all"
            >
              Mes Contrats ({contracts?.length || 0})
            </TabsTrigger>
            <TabsTrigger
              value="documents"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-vanilla data-[state=active]:bg-transparent px-2 py-4 font-black text-[10px] tracking-widest uppercase transition-all"
            >
              Documents Administratifs ({documents?.length || 0})
            </TabsTrigger>
          </TabsList>

          {/* Offers Tab */}
          {dossier.clientType === 'BUYER' && (
            <TabsContent value="offers" className="pt-8">
              {!dossier.offers || dossier.offers.length === 0 ? (
                <div className="py-20 text-center space-y-4 bg-alice/10 rounded-3xl border border-dashed border-border/40">
                  <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm border border-border/20">
                    <Banknote className="text-muted-foreground/30" size={32} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-black text-eerie uppercase tracking-widest">Aucune offre pour ce dossier</p>
                    <p className="text-xs font-bold text-muted-foreground/60">Les offres soumises apparaîtront ici</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {dossier.offers.map((offer: any) => {
                    const diff = offer.propertyPrice ? ((offer.offerAmount - offer.propertyPrice) / offer.propertyPrice) * 100 : 0;
                    const isSignificantDiff = Math.abs(diff) > 2;

                    return (
                      <NeuCard key={offer.idOffer} className="flex flex-col group hover:neu-pressable transition-all p-6 space-y-6">
                        <div className="flex gap-6">
                          <div className="w-28 h-28 rounded-2xl overflow-hidden shrink-0 shadow-inner border-2 border-white">
                            <img
                              src={offer.propertyImage || "https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=1000&auto=format&fit=crop"}
                              alt="Property"
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                          </div>
                          <div className="flex-1 min-w-0 flex flex-col justify-between">
                            <div className="flex justify-between items-start mb-1">
                              <h4 className="font-black truncate pr-2 text-eerie text-base group-hover:text-vanilla transition-colors">{offer.propertyTitle}</h4>
                              <SoftBadge tone={
                                offer.status === 'ACCEPTED' ? 'success' :
                                  offer.status === 'REJECTED' ? 'danger' :
                                    offer.status === 'WITHDRAW' ? 'neutral' : 'info'
                              } className="text-[8px] px-2 py-0.5 font-black uppercase tracking-widest">
                                {offer.status === 'ACCEPTED' ? 'ACCEPTÉE' :
                                  offer.status === 'REJECTED' ? 'REFUSÉE' :
                                    offer.status === 'WITHDRAW' ? 'RETIRÉE' : 'EN EXAMEN'}
                              </SoftBadge>
                            </div>
                            <div>
                              <div className="flex items-baseline gap-2">
                                <span className="text-xl font-black text-eerie">{formatCurrency(offer.offerAmount)}</span>
                                {isSignificantDiff && (
                                  <span className={cn(
                                    "text-[9px] font-black px-1.5 py-0.5 rounded-lg flex items-center gap-0.5",
                                    diff > 0 ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                                  )}>
                                    {diff > 0 ? <TrendingUp size={10} /> : <TrendingUp size={10} className="rotate-180" />}
                                    {diff > 0 ? '+' : ''}{diff.toFixed(1)}%
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest opacity-40">Prix demandé :</span>
                                <span className="text-[9px] font-black text-muted-foreground/60 line-through">{formatCurrency(offer.propertyPrice)}</span>
                              </div>
                            </div>
                            <div className="flex items-center justify-between mt-4">
                              <span className="text-[8px] font-black text-muted-foreground/60 uppercase tracking-widest">Soumise le {formatDate(offer.createdAt)}</span>
                              {offer.status === 'ACCEPTED' && (
                                <div className="flex items-center gap-1 text-[8px] font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full animate-pulse tracking-widest">
                                  <CheckCircle2 size={10} /> ÉTAPE CONTRAT
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {offer.status === 'PENDING' && (
                          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/40">
                            <button
                              onClick={() => {
                                acceptOffer.mutate(offer.idOffer, {
                                  onSuccess: () => {
                                    toast.success("Offre acceptée avec succès !");
                                    refetchDossier();
                                  },
                                  onError: () => toast.error("Erreur lors de l'acceptation de l'offre")
                                });
                              }}
                              disabled={acceptOffer.isPending || rejectOffer.isPending}
                              className="py-3 bg-eerie text-white rounded-xl font-black text-[9px] tracking-widest flex items-center justify-center gap-2 hover:bg-eerie/90 transition-all active:scale-95 shadow-md disabled:opacity-50"
                            >
                              {acceptOffer.isPending ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} className="text-vanilla" />}
                              ACCEPTER L'OFFRE
                            </button>
                            <button
                              onClick={() => {
                                rejectOffer.mutate(offer.idOffer, {
                                  onSuccess: () => {
                                    toast.success("Offre refusée");
                                    refetchDossier();
                                  },
                                  onError: () => toast.error("Erreur lors du refus de l'offre")
                                });
                              }}
                              disabled={acceptOffer.isPending || rejectOffer.isPending}
                              className="py-3 bg-alice text-danger rounded-xl font-black text-[9px] tracking-widest flex items-center justify-center gap-2 hover:bg-danger/5 transition-all active:scale-95 border border-danger/10 disabled:opacity-50"
                            >
                              {rejectOffer.isPending ? <Loader2 size={12} className="animate-spin" /> : <X size={12} />}
                              REFUSER
                            </button>
                          </div>
                        )}

                        {offer.status === 'ACCEPTED' && (
                          <div className="pt-2 border-t border-border/40">
                            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 flex items-center gap-3">
                              <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-white shrink-0">
                                <CheckCircle2 size={16} />
                              </div>
                              <div>
                                <p className="text-[10px] font-black text-emerald-900 uppercase tracking-widest">Offre acceptée</p>
                                <p className="text-[9px] font-bold text-emerald-700/70 uppercase">L'agent prépare actuellement le contrat de vente.</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </NeuCard>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          )}

          {/* Contracts Tab */}
          <TabsContent value="contracts" className="pt-8">
            {loadingDocuments ? (
              <div className="py-20 flex flex-col items-center justify-center gap-4 bg-alice/10 rounded-3xl border border-dashed border-border/40">
                <Loader2 className="animate-spin text-vanilla" size={32} />
                <p className="text-sm font-black text-eerie uppercase tracking-widest">Chargement des contrats...</p>
              </div>
            ) : contracts.length === 0 ? (
              <div className="py-20 text-center space-y-4 bg-alice/10 rounded-3xl border border-dashed border-border/40">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm border border-border/20">
                  <FileSignature className="text-muted-foreground/30" size={32} />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-black text-eerie uppercase tracking-widest">Aucun contrat pour ce dossier</p>
                  <p className="text-xs font-bold text-muted-foreground/60">Les contrats officiels apparaîtront ici</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {contracts.map((contract: any) => (
                  <NeuCard key={contract.idContract} className="p-8 space-y-6 relative overflow-hidden group">
                    <div className="absolute right-0 top-0 p-3">
                      <SoftBadge tone={
                        contract.status === 'RECEIVED_SIGNED' ? 'success' :
                          contract.status === 'SENT' ? 'info' :
                            contract.status === 'ARCHIVED' ? 'warn' : 'neutral'
                      } className="font-black text-[8px] tracking-widest uppercase">
                        {contract.status === 'RECEIVED_SIGNED' ? 'SIGNÉ' :
                          contract.status === 'SENT' ? 'ENVOYÉ' :
                            contract.status === 'ARCHIVED' ? 'ARCHIVÉ' : 'BROUILLON'}
                      </SoftBadge>
                    </div>

                    <div className="space-y-1">
                      <h4 className="font-black text-lg text-eerie group-hover:text-vanilla transition-colors">Contrat de vente immobilière</h4>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Émis le {formatDate(contract.createdAt)}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-8 py-4 border-y border-border/40">
                      <div className="space-y-1">
                        <p className="text-[9px] font-black text-muted-foreground/60 uppercase tracking-widest">Prix convenu</p>
                        <p className="text-lg font-black text-eerie">{formatCurrency(contract.agreedPrice)}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[9px] font-black text-muted-foreground/60 uppercase tracking-widest">Acompte</p>
                        <p className="text-lg font-black text-vanilla">{formatCurrency(contract.depositAmount)}</p>
                      </div>
                    </div>

                    {contract.aiRiskSummary && (
                      <div className="bg-vanilla/5 border border-vanilla/20 rounded-2xl p-5 space-y-3">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-vanilla/20 rounded-lg flex items-center justify-center">
                            <CheckCircle2 size={12} className="text-vanilla" />
                          </div>
                          <p className="text-[10px] font-black text-eerie uppercase tracking-widest">Résumé d'analyse IA</p>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed font-medium">{contract.aiRiskSummary}</p>
                      </div>
                    )}

                    <div className="flex flex-col gap-3 pt-2">
                      <button
                        onClick={() => setPreviewDocUrl(contract.pdfUrl)}
                        disabled={!contract.pdfUrl}
                        className={cn(
                          "w-full py-4 rounded-2xl font-black text-[10px] tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg",
                          contract.pdfUrl
                            ? "bg-eerie text-white hover:bg-eerie/90"
                            : "bg-alice text-muted-foreground/40 cursor-not-allowed border border-border/20"
                        )}
                      >
                        <Download size={14} className={contract.pdfUrl ? "text-vanilla" : "text-muted-foreground/20"} />
                        {contract.pdfUrl ? "VISUALISER LE CONTRAT" : "CONTRAT EN ATTENTE"}
                      </button>
                    </div>
                  </NeuCard>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="pt-8">
            {loadingDocuments ? (
              <div className="py-20 flex flex-col items-center justify-center gap-4 bg-alice/10 rounded-3xl border border-dashed border-border/40">
                <Loader2 className="animate-spin text-vanilla" size={32} />
                <p className="text-sm font-black text-eerie uppercase tracking-widest">Chargement des documents...</p>
              </div>
            ) : documents.length === 0 ? (
              <div className="py-20 text-center space-y-4 bg-alice/10 rounded-3xl border border-dashed border-border/40">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm border border-border/20">
                  <FileText className="text-muted-foreground/30" size={32} />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-black text-eerie uppercase tracking-widest">Aucun document administratif</p>
                  <p className="text-xs font-bold text-muted-foreground/60">Vos documents à fournir apparaîtront ici</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {documents.map((doc: any) => (
                  <NeuCard key={doc.idDocument} className="p-6 flex flex-col justify-between group hover:neu-pressable transition-all">
                    <div className="space-y-4">
                      <div className="flex justify-between items-start">
                        <div className={cn(
                          "p-3 rounded-2xl shadow-sm border border-white",
                          doc.filePath ? "bg-vanilla/20 text-vanilla" : "bg-alice text-muted-foreground/40"
                        )}>
                          <FileText size={20} />
                        </div>
                        <SoftBadge tone={doc.filePath ? "success" : "warn"} className="text-[8px] font-black tracking-widest uppercase">
                          {doc.filePath ? "COMPLÉTÉ" : "À FOURNIR"}
                        </SoftBadge>
                      </div>

                      <div className="space-y-1">
                        <h4 className="font-black text-sm text-eerie uppercase tracking-tight">{doc.documentType.replace(/_/g, ' ')}</h4>
                        <p className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest">
                          {doc.filePath ? `Ajouté le ${formatDate(doc.createdAt)}` : "Action requise"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-6">
                      {doc.filePath ? (
                        <button
                          onClick={() => setPreviewDocUrl(doc.filePath)}
                          className="w-full py-3 bg-alice text-eerie rounded-xl font-black text-[9px] tracking-widest flex items-center justify-center gap-2 hover:bg-vanilla/10 transition-all active:scale-95 border border-border/20"
                        >
                          <ExternalLink size={12} /> VISUALISER LE DOCUMENT
                        </button>
                      ) : (
                        <div className="space-y-3">
                          <p className="text-[9px] font-bold text-center text-danger uppercase tracking-widest bg-danger/5 py-2 rounded-lg border border-danger/10">
                            Veuillez uploader ce document
                          </p>
                          <label className="cursor-pointer">
                            <div className={cn(
                              "w-full py-3 bg-eerie text-white rounded-xl font-black text-[9px] tracking-widest flex items-center justify-center gap-2 hover:bg-eerie/90 transition-all active:scale-95 shadow-md",
                              uploadingDocId === doc.idDocument && "opacity-50 cursor-not-allowed"
                            )}>
                              {uploadingDocId === doc.idDocument ? (
                                <Loader2 size={12} className="animate-spin" />
                              ) : (
                                <Download size={12} className="text-vanilla rotate-180" />
                              )}
                              {uploadingDocId === doc.idDocument ? "TÉLÉCHARGEMENT..." : "CHOISIR ET UPLOADER"}
                            </div>
                            <input
                              type="file"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleUpload(doc.documentType, file, doc.idDocument);
                              }}
                              disabled={uploadingDocId === doc.idDocument}
                              accept=".pdf,.jpg,.jpeg,.png"
                            />
                          </label>
                        </div>
                      )}
                    </div>
                  </NeuCard>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Modals */}
      {previewDocUrl && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-eerie/90 backdrop-blur-md" onClick={() => setPreviewDocUrl(null)} />
          <div className="relative max-w-5xl w-full h-[85vh] bg-white rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 border-4 border-white/10 flex flex-col">
            <div className="p-4 flex justify-between items-center border-b border-border/40 bg-ghost/30">
              <h3 className="font-black uppercase tracking-widest text-xs">Prévisualisation du document</h3>
              <div className="flex items-center gap-2">
                <a
                  href={previewDocUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-alice hover:bg-vanilla/20 text-eerie rounded-xl flex items-center justify-center transition-all active:scale-90"
                  title="Ouvrir dans un nouvel onglet"
                >
                  <ExternalLink size={18} />
                </a>
                <button
                  onClick={() => setPreviewDocUrl(null)}
                  className="w-10 h-10 bg-danger/10 hover:bg-danger/20 text-danger rounded-xl flex items-center justify-center transition-all active:scale-90"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            <div className="flex-1 bg-alice/20 overflow-hidden relative">
              {previewDocUrl.toLowerCase().includes('.pdf') ? (
                <embed
                  src={previewDocUrl}
                  type="application/pdf"
                  className="w-full h-full border-none"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center p-4 overflow-auto">
                  <img src={previewDocUrl} alt="Preview" className="max-w-full max-h-full object-contain shadow-lg rounded-lg" />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {selectedImage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-eerie/90 backdrop-blur-md" onClick={() => setSelectedImage(null)} />
          <div className="relative max-w-5xl w-full aspect-video rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 border-4 border-white/10">
            <img src={selectedImage} alt="Gallery view" className="w-full h-full object-contain bg-black/20" />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-6 right-6 w-12 h-12 bg-white/10 hover:bg-white/20 text-white rounded-2xl backdrop-blur-md flex items-center justify-center transition-all active:scale-90"
            >
              <X size={24} />
            </button>
          </div>
        </div>
      )}

      {mapUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-eerie/60 backdrop-blur-sm" onClick={() => setMapUrl(null)} />
          <div className="relative w-full max-w-4xl bg-ghost rounded-3xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 flex justify-between items-center border-b border-border/40">
              <h3 className="font-black uppercase tracking-widest text-sm">Localisation du bien</h3>
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
