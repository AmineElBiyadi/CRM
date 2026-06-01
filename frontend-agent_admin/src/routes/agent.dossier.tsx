import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useRef, useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  fetchDossierDetail, 
  fetchInteractions, 
  logInteraction as apiLogInteraction,
  fetchDealMeetings,
  createMeeting as apiCreateMeeting,
  updateDossier as apiUpdateDossier,
  updateDealStage as apiUpdateDealStage,
  updateMeetingStatus as apiUpdateMeetingStatus,
  deleteMeeting as apiDeleteMeeting,
  type InteractionType,
  type CreateInteractionRequest,
  type UpdateDossierRequest,
  type MeetingType,
  type CreateMeetingDto,
  type DealStage,
  type MeetingItem,
  type UpdateMeetingStatusDto
} from "@/api/dossiersApi";
// @ts-ignore
import { getPropertiesByDeal } from "@/api/propertyApi";
// @ts-ignore
import { acceptOffer as apiAcceptOffer } from "@/api/offerApi";
// @ts-ignore
import { deleteContract as apiDeleteContract } from "@/api/contractApi";
import { NeuCard } from "@/components/ui/neu-card";
import { Avatar, LeadScore, SoftBadge } from "@/components/ui/design-bits";
import {
  Phone, Mail, MapPin, Sparkles, RefreshCw, Plus, FileText, CalendarDays, Building2,
  Send, X, Upload, Paperclip, Loader2, Eye, Clock, FileSignature, Check, Trash2, CalendarRange, CheckCircle2, AlertCircle, RotateCcw, ChevronLeft,
} from "lucide-react";
import { toast } from "sonner";
// @ts-ignore
import { ContractForm, ContractStatusTracker } from "@/components/contract/ContractForm";
// @ts-ignore
import { getContractsByDeal, updateContractStatus, markPaymentPaid } from "@/api/contractApi";

type DossierSearch = {
  id?: string;
};

export const Route = createFileRoute("/agent/dossier")({
  validateSearch: (search: Record<string, unknown>): DossierSearch => {
    return {
      id: search.id as string | undefined,
    };
  },
  component: DossierPage,
});

const tabs = ["Interactions", "Propriétés", "Rendez-vous", "Contrats"] as const;

function DossierPage() {
  const { id } = Route.useSearch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<typeof tabs[number]>("Interactions");

  const STAGES: { value: DealStage, label: string }[] = [
    { value: 'COLD', label: 'COLD' },
    { value: 'WARM', label: 'WARM' },
    { value: 'HOT', label: 'HOT' },
    { value: 'NEGOTIATION', label: 'NEGOTIATION' },
    { value: 'CLOSED', label: 'CLOSED' },
    { value: 'LOST', label: 'LOST' },
  ];
  
  const [logging, setLogging] = useState(false);
  const [showContractForm, setShowContractForm] = useState(false);
  const [editingDossier, setEditingDossier] = useState(false);
  const [editForm, setEditForm] = useState<UpdateDossierRequest>({
    type: "BUYER",
    budgetMin: 0,
    budgetMax: 0,
    preferredArea: "",
    preferredSizeM2: 0,
    preferredFloor: -1,
    propertySpecificType: "",
    propertyTitle: "",
    address: "",
    city: "",
    askingPrice: 0,
    propertySurfaceM2: 0,
    numRooms: 0,
    propertyFloor: 0,
  });

  const [propDetail, setPropDetail] = useState<any | null>(null);
  const [contracts, setContracts] = useState<any[]>([]);
  const [linkedProperties, setLinkedProperties] = useState<any[]>([]);
  
  // Interaction form state
  const [newType, setNewType] = useState<InteractionType>("CALL");
  const [newDesc, setNewDesc] = useState("");
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newTime, setNewTime] = useState(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }));
  const [newDurationHrs, setNewDurationHrs] = useState<number>(0);
  const [newDurationMins, setNewDurationMins] = useState<number>(0);

  // Meeting form state
  const [planningMeeting, setPlanningMeeting] = useState(false);
  const [newMeetingType, setNewMeetingType] = useState<MeetingType>("OFFICE_APPOINTMENT");
  const [newMeetingDate, setNewMeetingDate] = useState(new Date().toISOString().split('T')[0]);
  const [newMeetingTime, setNewMeetingTime] = useState("10:00");
  const [newMeetingNotes, setNewMeetingNotes] = useState("");
  const [newMeetingAddress, setNewMeetingAddress] = useState("");

  const [meetingTab, setMeetingTab] = useState<"ALL" | "DRAFT" | "PENDING" | "SCHEDULED" | "IN_PROGRESS" | "HISTORY">("ALL");
  const [reschedulingMeetingId, setReschedulingMeetingId] = useState<string | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("");

  const floorOptions = [
    { value: -1, label: "Indifférent" },
    { value: 0, label: "RDC" },
    ...Array.from({ length: 15 }, (_, i) => ({ value: i + 1, label: `${i + 1}ème` }))
  ];

  const { data: dossier, isLoading: loadingDossier } = useQuery({
    queryKey: ["dossier", id],
    queryFn: () => fetchDossierDetail(id!),
    enabled: !!id,
  });

  const { data: propertyTypes } = useQuery({
    queryKey: ["property-types"],
    queryFn: () => fetch(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:8081"}/api/property-types`).then(res => res.json()),
  });

  const { data: interactions, isLoading: loadingInteractions } = useQuery({
    queryKey: ["interactions", id],
    queryFn: () => fetchInteractions(id!),
    enabled: !!id,
  });

  const { data: meetings, isLoading: loadingMeetings } = useQuery({
    queryKey: ["meetings", id],
    queryFn: () => fetchDealMeetings(id!),
    enabled: !!id,
  });

  const { data: dealProperties } = useQuery({
    queryKey: ["deal-properties", id],
    queryFn: () => getPropertiesByDeal(id!),
    enabled: !!id,
  });

  const mutation = useMutation({
    mutationFn: apiLogInteraction,
    onSuccess: () => {
      toast.success("Interaction loggée avec succès");
      queryClient.invalidateQueries({ queryKey: ["interactions", id] });
      queryClient.invalidateQueries({ queryKey: ["dossier", id] });
      setLogging(false);
      setNewDesc("");
      setNewDurationHrs(0);
      setNewDurationMins(0);
    },
    onError: () => {
      toast.error("Erreur lors de la journalisation");
    }
  });

  const meetingMutation = useMutation({
    mutationFn: apiCreateMeeting,
    onSuccess: () => {
      toast.success("Rendez-vous enregistré avec succès");
      queryClient.invalidateQueries({ queryKey: ["meetings", id] });
      setPlanningMeeting(false);
      setNewMeetingNotes("");
      setNewMeetingAddress("");
    },
    onError: () => {
      toast.error("Erreur lors de l'enregistrement");
    }
  });

  const meetingStatusMutation = useMutation({
    mutationFn: ({ id, request }: { id: string, request: UpdateMeetingStatusDto }) => apiUpdateMeetingStatus(id, request),
    onSuccess: () => {
      toast.success("Statut du rendez-vous mis à jour");
      queryClient.invalidateQueries({ queryKey: ["meetings", id] });
    },
    onError: () => {
      toast.error("Erreur lors de la mise à jour");
    }
  });

  const meetingDeleteMutation = useMutation({
    mutationFn: apiDeleteMeeting,
    onSuccess: () => {
      toast.success("Rendez-vous supprimé");
      queryClient.invalidateQueries({ queryKey: ["meetings", id] });
    },
    onError: () => {
      toast.error("Erreur lors de la suppression");
    }
  });
  
  const stageMutation = useMutation({
    mutationFn: ({ id, stage }: { id: string, stage: DealStage }) => apiUpdateDealStage(id, stage),
    onSuccess: (updated) => {
      toast.success(`Étape mise à jour : ${STAGES.find(s => s.value === updated.stage)?.label}`);
      queryClient.invalidateQueries({ queryKey: ["dossier", id] });
    },
    onError: () => {
      toast.error("Erreur lors de la mise à jour de l'étape");
    }
  });

  const updateDossierMutation = useMutation({
    mutationFn: (request: UpdateDossierRequest) => apiUpdateDossier(id!, request),
    onSuccess: () => {
      toast.success("Dossier mis à jour avec succès");
      queryClient.invalidateQueries({ queryKey: ["dossier", id] });
      setEditingDossier(false);
    },
    onError: (e: any) => {
      toast.error("Erreur lors de la mise à jour : " + e.message);
    }
  });

  const acceptOfferMutation = useMutation({
    mutationFn: apiAcceptOffer,
    onSuccess: () => {
      toast.success("Offre acceptée !");
      queryClient.invalidateQueries({ queryKey: ["deal-properties", id] });
      queryClient.invalidateQueries({ queryKey: ["dossier", id] });
      fetchDossierData();
    },
    onError: (e: any) => {
      toast.error("Erreur : " + e.message);
    }
  });

  /* documents */
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [docs, setDocs] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loadingContext, setLoadingContext] = useState(true);
  const [newDocType, setNewDocType] = useState<string>("OTHER");

  const fetchDossierData = async () => {
    if (!id) return;
    setLoadingContext(true);
    try {
      const [contractsList, props, documents] = await Promise.all([
        getContractsByDeal(id),
        getPropertiesByDeal(id),
        fetch(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:8081"}/api/documents/deal/${id}`, { 
          credentials: 'include', 
          cache: 'no-store' 
        }).then(res => res.json())
      ]);
      setContracts(contractsList || []);
      setLinkedProperties(props || []);
      setDocs(documents || []);
    } catch (e: any) {
      toast.error("Erreur de chargement : " + e.message);
    } finally {
      setLoadingContext(false);
    }
  };

  useEffect(() => {
    fetchDossierData();
  }, [id]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0 || !id || !newDocType) return;
    
    setUploading(true);
    try {
      // 1. Direct Upload to Cloudinary (Frontend)
      const formData = new FormData();
      formData.append("file", files[0]);
      formData.append("upload_preset", import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "Rawabet");
      formData.append("folder", "documents");
      
      // Optionnel : Générer le nom comme avant
      const clientName = (dossier?.clientName || "Document").replace(/\s+/g, '_');
      const extension = files[0].name.split('.').pop()?.toLowerCase() || 'pdf';
      
      // IMPORTANT : Ne pas mettre d'extension dans le public_id si on utilise resource_type "image"
      const publicId = `${newDocType}_${clientName}_${Date.now()}`;
      formData.append("public_id", publicId);

      const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "dam3isgtd";
      // On force "image" pour les PDF pour permettre la visualisation directe dans le navigateur
      const resourceType = extension === 'pdf' ? 'image' : 'auto';
      const resCloud = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`, {
        method: "POST",
        body: formData
      });
      
      if (!resCloud.ok) throw new Error("Erreur lors de l'upload Cloudinary");
      const cloudData = await resCloud.json();
      const uploadedUrl = cloudData.secure_url;

      // 2. Save only the URL in our Backend
      const resBackend = await fetch(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:8081"}/api/documents/save-info?dealId=${id}&type=${newDocType}&url=${encodeURIComponent(uploadedUrl)}`, {
        method: "POST",
        credentials: "include"
      });

      if (!resBackend.ok) throw new Error(await resBackend.text());
      
      toast.success("Document versionné avec succès");
      fetchDossierData();
    } catch (e: any) {
      toast.error("Échec de l'opération : " + e.message);
    } finally {
      setUploading(false);
    }
    e.target.value = "";
  };

  const handleRequestDocument = async () => {
    if (!id || !newDocType) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:8081"}/api/documents/request?dealId=${id}&type=${newDocType}`, {
        method: "POST",
        credentials: "include"
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success("Demande de document enregistrée");
      fetchDossierData();
    } catch (e: any) {
      toast.error("Échec de la demande : " + e.message);
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    if (!confirm("Voulez-vous vraiment supprimer ce document ?")) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:8081"}/api/documents/${docId}`, {
        method: "DELETE",
        credentials: "include"
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success("Document supprimé");
      fetchDossierData();
    } catch (e: any) {
      toast.error("Échec de la suppression : " + e.message);
    }
  };

  const handleStatusChange = async (contractId: string, newStatus: string) => {
    try {
      await updateContractStatus(contractId, newStatus);
      setContracts((prev) => prev.map((c) => c.idContract === contractId ? { ...c, status: newStatus } : c));
      toast.success(`Statut → ${newStatus}`);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleMarkPaid = async (contractId: string, paymentId: string) => {
    try {
      await markPaymentPaid(contractId, paymentId);
      setContracts((prev) => prev.map((c) => {
        if (c.idContract === contractId) {
          return {
            ...c,
            payments: c.payments.map((p: any) => p.idPayment === paymentId ? { ...p, isPaid: true } : p)
          };
        }
        return c;
      }));
      toast.success("Versement marqué comme payé !");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleDeleteContract = async (contractId: string) => {
    if (!confirm("Voulez-vous vraiment supprimer ce brouillon de contrat ?")) return;
    try {
      await apiDeleteContract(contractId);
      setContracts((prev) => prev.filter((c) => c.idContract !== contractId));
      toast.success("Contrat supprimé");
    } catch (e: any) {
      toast.error("Erreur : " + e.message);
    }
  };

  const handleLogInteraction = () => {
    if (!newDesc.trim()) {
      toast.error("Veuillez saisir une description");
      return;
    }
    const occurredAt = `${newDate}T${newTime}:00`;
    const totalMinutes = newDurationHrs * 60 + newDurationMins;
    const request: CreateInteractionRequest = {
      idDeal: id!,
      type: newType,
      description: newDesc,
      occurredAt: occurredAt,
      durationMinutes: totalMinutes > 0 ? totalMinutes : undefined,
    };
    mutation.mutate(request);
  };

  const handleOpenEdit = () => {
    if (!dossier) return;
    setEditForm({
      type: dossier.clientType,
      budgetMin: dossier.budgetMin,
      budgetMax: dossier.budgetMax,
      preferredArea: dossier.preferredArea,
      preferredSizeM2: dossier.preferredSizeM2,
      preferredFloor: dossier.preferredFloor ?? -1,
      propertySpecificType: dossier.propertyType,
      propertyTitle: dossier.propertyTitle || "",
      address: dossier.address || "",
      city: dossier.city || "",
      askingPrice: dossier.askingPrice || 0,
      propertySurfaceM2: dossier.propertySurfaceM2 || 0,
      numRooms: dossier.numRooms || 0,
      propertyFloor: dossier.propertyFloor ?? -1,
    });
    setEditingDossier(true);
  };

  const handleUpdateDossier = () => {
    updateDossierMutation.mutate(editForm);
  };

  const handleCreateMeeting = (status: MeetingItem['status'] = 'PENDING') => {
    if (!newMeetingDate || !newMeetingTime) {
      toast.error("Veuillez saisir une date et une heure");
      return;
    }
    const scheduledAt = `${newMeetingDate}T${newMeetingTime}:00`;
    const request: CreateMeetingDto = {
      idDeal: id!,
      type: newMeetingType,
      scheduledAt: scheduledAt,
      notes: newMeetingNotes,
      status: status,
      propertyAddress: (newMeetingType === 'PROPERTY_VISIT' || newMeetingType === 'CONTRACT_SIGNING') 
        ? newMeetingAddress 
        : undefined,
    };
    meetingMutation.mutate(request);
  };


  if (!id) return <div className="p-10 text-center">Aucun dossier sélectionné.</div>;
  
  if (loadingDossier) {
    return (
      <div className="min-h-screen bg-ghost flex flex-col items-center justify-center p-6 text-center gap-4">
        <Loader2 className="animate-spin text-alice" size={48} />
        <div className="animate-pulse">
          <h2 className="text-xl font-bold text-eerie">Chargement du dossier...</h2>
          <p className="text-sm text-muted-foreground mt-1">Nous préparons les informations de votre client.</p>
        </div>
      </div>
    );
  }

  if (!dossier) {
    return (
      <div className="min-h-screen bg-ghost flex flex-col items-center justify-center p-6 text-center gap-4">
        <div className="p-10 text-center neu-sm rounded-3xl bg-white/50">
          <h2 className="text-xl font-bold text-warn">Dossier introuvable</h2>
          <p className="text-sm text-muted-foreground mt-2">Ce dossier n'existe pas ou a été supprimé.</p>
          <button 
            onClick={() => window.history.back()}
            className="mt-6 px-6 py-2 rounded-xl bg-eerie text-ghost text-sm font-medium"
          >
            Retour
          </button>
        </div>
      </div>
    );
  }

  const currentStageIdx = STAGES.findIndex(s => s.value === dossier.stage);
  const acceptedProperty = linkedProperties.find(p => p.offerStatus === 'ACCEPTED');

  const iconMap: Record<string, any> = { 
    CALL: Phone, 
    VISIT: MapPin, 
    EMAIL: Mail, 
    MEETING: CalendarDays,
    NOTE: FileText,
    SYSTEM: Sparkles
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          to="/agent/dossiers"
          className="w-10 h-10 rounded-full neu-sm flex items-center justify-center hover:bg-alice transition-colors"
        >
          <ChevronLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-eerie">Détail du Dossier</h1>
          <p className="text-muted-foreground text-sm">Consultez et gérez les informations de ce dossier client.</p>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-5 md:gap-6 max-w-[1500px]">
      {/* Left — profile */}
      <div className="col-span-12 lg:col-span-3 space-y-5">
        <NeuCard className="text-center relative group">
          <button 
            onClick={handleOpenEdit}
            className="absolute top-4 right-4 p-2 rounded-xl neu-sm text-muted-foreground hover:text-eerie hover:bg-alice/50 transition-all opacity-0 group-hover:opacity-100"
            title="Modifier le dossier"
          >
            <RotateCcw size={14} className="rotate-45" />
          </button>
          <Avatar name={dossier.clientName} size={88} />
          <h2 className="font-bold text-lg mt-3">{dossier.clientName}</h2>
          <SoftBadge tone="info" className="mt-1">{dossier.clientType === 'BUYER' ? 'Acheteur' : 'Vendeur'}</SoftBadge>
          <div className="text-left mt-5 space-y-2 text-sm">
            <a href={`tel:${dossier.clientPhone}`} className="flex items-center gap-2 hover:underline">
              <Phone size={14} /> {dossier.clientPhone}
            </a>
            <a href={`mailto:${dossier.clientEmail}`} className="flex items-center gap-2 hover:underline">
              <Mail size={14} /> {dossier.clientEmail}
            </a>
          </div>
          <div className="mt-5 pt-5 border-t border-border space-y-3 text-left">
            <div>
              <div className="text-xs text-muted-foreground">Budget</div>
              <div className="text-xl font-bold">
                {(dossier.budgetMin || 0).toLocaleString()} - {(dossier.budgetMax || 0).toLocaleString()} MAD
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Source</div>
              <div className="text-sm font-medium">{dossier.clientSource}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Agent assigné</div>
              <div className="flex items-center gap-2 mt-1">
                <Avatar name={dossier.assignedAgentName} size={24} />
                <span className="text-sm">{dossier.assignedAgentName}</span>
              </div>
            </div>
            <button 
              onClick={handleOpenEdit}
              className="w-full mt-4 py-2.5 rounded-xl neu-sm text-xs font-bold text-muted-foreground hover:text-eerie hover:bg-alice/50 transition-all flex items-center justify-center gap-2"
            >
              <RotateCcw size={12} className="rotate-45" /> Modifier dossier
            </button>
          </div>
        </NeuCard>

        <NeuCard className="text-center bg-alice/40">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Lead Score IA</div>
          <div className="my-4 flex justify-center">
            <LeadScore score={dossier.aiLeadScore || 0} size={120} />
          </div>
          <p className="text-xs italic text-muted-foreground">
            {dossier.aiScoreExplanation || "Analyse de score en cours..."}
          </p>
        </NeuCard>
      </div>

      {/* Center — activity */}
      <div className="col-span-12 lg:col-span-6 space-y-5">
        {/* Pipeline Status Bar */}
        <NeuCard size="sm" className="p-1 px-1.5 md:p-1.5">
          <div className="flex items-center justify-between gap-1 overflow-x-auto no-scrollbar py-1">
            {STAGES.map((s, idx) => {
              const isActive = s.value === dossier.stage;
              const isPast = idx < currentStageIdx;
              
              return (
                <button
                  key={s.value}
                  onClick={() => stageMutation.mutate({ id: id!, stage: s.value })}
                  disabled={stageMutation.isPending}
                  className={`relative flex-1 min-w-[75px] py-2 px-1 rounded-lg text-[10px] font-bold uppercase tracking-tight transition-all flex flex-col items-center gap-1.5 ${
                    isActive 
                      ? "bg-eerie text-ghost shadow-lg scale-[1.02] z-10" 
                      : (isPast ? "text-eerie/60 hover:bg-alice/20" : "text-muted-foreground/40 hover:bg-alice/10")
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full ${
                    isActive ? "bg-vanilla animate-pulse" : (isPast ? "bg-honeydew" : "bg-border")
                  }`} />
                  {s.label}
                  {isActive && (
                    <div className="absolute -bottom-1 left-1.2 right-1.2 h-0.5 bg-vanilla rounded-full" />
                  )}
                </button>
              );
            })}
          </div>
        </NeuCard>

        <NeuCard size="sm" className="flex gap-1 md:gap-2 p-2 overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 min-w-[100px] py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${tab === t ? "neu-inset" : "hover:bg-alice/30"}`}
            >
              {t}
            </button>
          ))}
        </NeuCard>

        {tab === "Interactions" && (
          <>
            <NeuCard>
              {!logging ? (
                <button
                  onClick={() => setLogging(true)}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-eerie text-ghost text-sm font-medium hover:opacity-90"
                >
                  <Plus size={16} /> Logger une interaction
                </button>
              ) : (
                <div className="space-y-4">
                   <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {[
                      { label: "Appel", value: "CALL" },
                      { label: "Visite", value: "VISIT" },
                      { label: "Email", value: "EMAIL" },
                      { label: "Réunion", value: "MEETING" },
                      { label: "Note", value: "NOTE" }
                    ].map((t) => (
                      <button
                        key={t.value}
                        onClick={() => setNewType(t.value as InteractionType)}
                        className={`py-2 rounded-lg text-xs font-medium ${newType === t.value ? "neu-inset" : "neu-sm"}`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label htmlFor="interaction-date" className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold px-1">Date</label>
                      <input 
                        id="interaction-date"
                        type="date" 
                        value={newDate} 
                        onChange={(e) => setNewDate(e.target.value)}
                        className="w-full px-3 py-2 neu-inset rounded-lg bg-transparent text-sm" 
                        title="Date de l'interaction"
                      />
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="interaction-time" className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold px-1">Heure</label>
                      <input 
                        id="interaction-time"
                        type="time" 
                        value={newTime} 
                        onChange={(e) => setNewTime(e.target.value)}
                        className="w-full px-3 py-2 neu-inset rounded-lg bg-transparent text-sm" 
                        title="Heure de l'interaction"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="interaction-duration-hrs" className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold px-1 flex items-center gap-1.5"><Clock size={12} /> Durée</label>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-0.5">
                        <div className="text-[10px] text-muted-foreground px-1">Heures</div>
                        <select
                          id="interaction-duration-hrs"
                          value={newDurationHrs}
                          onChange={(e) => setNewDurationHrs(Number(e.target.value))}
                          className="w-full px-3 py-2 neu-inset rounded-lg bg-transparent text-sm cursor-pointer"
                          title="Nombre d'heures"
                        >
                          {Array.from({ length: 13 }, (_, i) => (
                            <option key={i} value={i}>{i}h</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-0.5">
                        <div className="text-[10px] text-muted-foreground px-1">Minutes</div>
                        <select
                          id="interaction-duration-mins"
                          value={newDurationMins}
                          onChange={(e) => setNewDurationMins(Number(e.target.value))}
                          className="w-full px-3 py-2 neu-inset rounded-lg bg-transparent text-sm cursor-pointer"
                          title="Nombre de minutes"
                        >
                          {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((m) => (
                            <option key={m} value={m}>{m}min</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    {(newDurationHrs > 0 || newDurationMins > 0) && (
                      <div className="text-[10px] text-muted-foreground px-1">
                        Total : {newDurationHrs * 60 + newDurationMins} minutes
                      </div>
                    )}
                  </div>

                  <textarea
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    rows={3}
                    placeholder="Décrivez l'échange…"
                    className="w-full px-4 py-3 neu-inset rounded-lg bg-transparent focus:outline-none text-sm"
                    title="Description de l'interaction"
                  />
                  <div className="flex gap-2">
                    <button 
                      onClick={handleLogInteraction} 
                      disabled={mutation.isPending}
                      className="flex-1 py-2.5 rounded-lg bg-eerie text-ghost text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {mutation.isPending && <Loader2 size={16} className="animate-spin" />}
                      Sauvegarder
                    </button>
                    <button onClick={() => setLogging(false)} className="px-5 py-2.5 rounded-lg neu-sm text-sm">Annuler</button>
                  </div>
                </div>
              )}
            </NeuCard>
            
            <div className="relative pl-8 mt-6">
              <div className="absolute left-3 top-2 bottom-2 w-px bg-border " />
              {loadingInteractions ? (
                <div className="text-center py-4 text-sm text-muted-foreground">Chargement de l'historique...</div>
              ) : interactions?.length === 0 ? (
                <div className="text-center py-4 text-sm text-muted-foreground italic">Aucune interaction enregistrée.</div>
              ) : interactions?.map((it) => {
                const Icon = iconMap[it.type] || FileText;
                const formattedDate = new Date(it.occurredAt).toLocaleString('fr-FR', { 
                  day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' 
                });
                return (
                  <div key={it.idInteraction} className="relative mb-4">
                    <div className="absolute -left-8 top-3 w-6 h-6 rounded-full bg-honeydew flex items-center justify-center ring-4 ring-ghost border border-honeydew/20">
                      <Icon size={12} className="text-eerie" />
                    </div>
                    <NeuCard size="sm">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <span className="font-semibold text-sm">{it.type}</span>
                        <span className="text-xs text-muted-foreground">{formattedDate}{it.durationMinutes ? ` · ${it.durationMinutes} min` : ""}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1.5">{it.description}</p>
                      <div className="mt-2 flex items-center gap-1.5 opacity-50">
                        <Avatar name={it.agentName} size={16} />
                        <span className="text-[10px] font-medium">{it.agentName}</span>
                      </div>
                    </NeuCard>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {tab === "Propriétés" && (
          <>
            <div className="flex gap-3 flex-wrap">
              <Link 
                to="/agent/recherche" 
                search={{ 
                  dealId: id,
                  city: dossier.preferredArea || dossier.city || "",
                  maxPrice: dossier.budgetMax || dossier.askingPrice || undefined,
                  propertyType: dossier.propertyType || "",
                  minRooms: dossier.numRooms || undefined
                }} 
                className="flex-1 min-w-[180px] flex items-center justify-center gap-2 py-3 rounded-xl neu-sm hover:neu-pressable text-sm font-medium"
              >
                <Building2 size={16} /> Rechercher biens
              </Link>
              <button
                onClick={() => toast.success("Données synchronisées avec la DB")}
                className="flex-1 min-w-[180px] flex items-center justify-center gap-2 py-3 rounded-xl bg-vanilla text-eerie text-sm font-medium hover:opacity-90"
              >
                <Sparkles size={16} /> Recommandation IA
              </button>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {linkedProperties.map((p) => (
                <NeuCard key={p.idProperty} size="sm" pressable onClick={() => setPropDetail(p)}>
                  <div className="relative">
                    <img src={p.imageUrls?.[0] || p.images?.[0]?.imageUrl || "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80"} alt={p.address} className="w-full h-32 object-cover rounded-lg mb-3" />
                    {p.offerStatus === 'ACCEPTED' && (
                      <div className="absolute top-2 right-2 bg-honeydew text-eerie text-[10px] font-bold px-2 py-1 rounded-full shadow-lg flex items-center gap-1">
                        <Check size={10} /> ACCEPTEE
                      </div>
                    )}
                  </div>
                  <div className="font-medium text-sm">{p.address}</div>
                  <div className="text-xs text-muted-foreground">{p.surfaceM2} m² · {p.numRooms} pcs</div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="font-bold text-sm">{p.price?.toLocaleString('en-US')} $</span>
                    <SoftBadge tone={p.isAvailable ? "success" : (p.offerStatus === 'ACCEPTED' ? 'success' : 'warn')}>
                      {p.offerStatus === 'ACCEPTED' ? "Vendu" : (p.isAvailable ? "Disponible" : "Rejetée")}
                    </SoftBadge>
                  </div>
                  
                  {p.offerStatus === 'PENDING' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        acceptOfferMutation.mutate(p.idOffer);
                      }}
                      disabled={acceptOfferMutation.isPending}
                      className="w-full mt-3 py-2 rounded-lg bg-honeydew text-eerie text-xs font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2"
                    >
                      {acceptOfferMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                      Accepter l'offre
                    </button>
                  )}
                </NeuCard>
              ))}
              {linkedProperties.length === 0 && !loadingContext && (
                <p className="col-span-2 text-center py-10 text-xs text-muted-foreground">Aucune propriété liée à ce dossier.</p>
              )}
            </div>
          </>
        )}

        {tab === "Rendez-vous" && (
          <div className="space-y-4">
            <NeuCard>
              {!planningMeeting ? (
                <button
                  onClick={() => setPlanningMeeting(true)}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-eerie text-ghost text-sm font-medium hover:opacity-90"
                >
                  <Plus size={16} /> Planifier un rendez-vous
                </button>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label htmlFor="meeting-type" className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold px-1">Type</label>
                      <select 
                        id="meeting-type"
                        value={newMeetingType} 
                        onChange={(e) => setNewMeetingType(e.target.value as MeetingType)}
                        className="w-full px-3 py-2 neu-inset rounded-lg bg-transparent text-sm cursor-pointer"
                        title="Type de rendez-vous"
                      >
                        <option value="OFFICE_APPOINTMENT">RDV Agence</option>
                        <option value="PROPERTY_VISIT">Visite immobilière</option>
                        <option value="PHONE_CALL">Appel téléphonique</option>
                        <option value="CONTRACT_SIGNING">Signature de contrat</option>
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                       <div className="space-y-1">
                        <label htmlFor="meeting-date" className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold px-1">Date</label>
                        <input 
                          id="meeting-date"
                          type="date" 
                          value={newMeetingDate} 
                          onChange={(e) => setNewMeetingDate(e.target.value)}
                          className="w-full px-2 py-2 neu-inset rounded-lg bg-transparent text-xs" 
                          title="Date du rendez-vous"
                        />
                      </div>
                      <div className="space-y-1">
                        <label htmlFor="meeting-time" className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold px-1">Heure</label>
                        <input 
                          id="meeting-time"
                          type="time" 
                          value={newMeetingTime} 
                          onChange={(e) => setNewMeetingTime(e.target.value)}
                          className="w-full px-2 py-2 neu-inset rounded-lg bg-transparent text-xs" 
                          title="Heure du rendez-vous"
                        />
                      </div>
                    </div>
                  </div>

                  {(newMeetingType === 'PROPERTY_VISIT' || newMeetingType === 'CONTRACT_SIGNING') && (
                    <div className="space-y-1 animate-in fade-in slide-in-from-top-1">
                      <label htmlFor="meeting-address" className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold px-1">Adresse du bien</label>
                      <select 
                        id="meeting-address"
                        value={newMeetingAddress} 
                        onChange={(e) => setNewMeetingAddress(e.target.value)}
                        className="w-full px-3 py-2 neu-inset rounded-lg bg-transparent text-sm cursor-pointer"
                        title="Sélectionner l'adresse du bien"
                      >
                        <option value="">Sélectionner un bien...</option>
                        {dealProperties?.map((p: any) => (
                          <option key={p.idProperty} value={p.address}>{p.address}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <textarea
                    value={newMeetingNotes}
                    onChange={(e) => setNewMeetingNotes(e.target.value)}
                    rows={2}
                    placeholder="Notes (ex: objectifs, points à aborder)…"
                    className="w-full px-4 py-3 neu-inset rounded-lg bg-transparent focus:outline-none text-sm"
                    title="Notes du rendez-vous"
                  />

                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleCreateMeeting('DRAFT')} 
                      disabled={meetingMutation.isPending}
                      className="px-4 py-2.5 rounded-lg neu-sm text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      Brouillon
                    </button>
                    <button 
                      onClick={() => handleCreateMeeting('PENDING')} 
                      disabled={meetingMutation.isPending}
                      className="flex-1 py-2.5 rounded-lg bg-eerie text-ghost text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {meetingMutation.isPending && <Loader2 size={16} className="animate-spin" />}
                      Confirmer le RDV
                    </button>
                    <button onClick={() => setPlanningMeeting(false)} className="px-4 py-2.5 rounded-lg neu-sm hover:text-warn text-sm">Annuler</button>
                  </div>
                </div>
              )}
            </NeuCard>

            {/* Status Navigation Bar */}
            <div className="flex justify-center gap-1.5 overflow-x-auto no-scrollbar py-1">
              {[
                { id: "ALL", label: "Tous" },
                { id: "DRAFT", label: "Brouillons" },
                { id: "PENDING", label: "En attente" },
                { id: "SCHEDULED", label: "Planifiés" },
                { id: "IN_PROGRESS", label: "En cours" },
                { id: "HISTORY", label: "Historique" }
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMeetingTab(m.id as any)}
                  className={`px-3.5 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-tight transition-all whitespace-nowrap ${meetingTab === m.id ? "bg-eerie text-ghost" : "neu-sm text-muted-foreground"}`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              {loadingMeetings ? (
                <div className="flex justify-center py-5"><Loader2 className="animate-spin text-muted-foreground" size={20} /></div>
              ) : meetings?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm italic">Aucun rendez-vous.</div>
              ) : (
                (() => {
                  const filtered = meetings?.filter(m => {
                    if (meetingTab === 'ALL') return true;
                    if (meetingTab === 'DRAFT') return m.status === 'DRAFT';
                    if (meetingTab === 'PENDING') return m.status === 'PENDING';
                    if (meetingTab === 'SCHEDULED') return ['SCHEDULED', 'RESCHEDULED', 'POSTPONED'].includes(m.status);
                    if (meetingTab === 'IN_PROGRESS') return m.status === 'IN_PROGRESS';
                    if (meetingTab === 'HISTORY') return ['COMPLETED', 'CANCELED', 'MISSED'].includes(m.status);
                    return true;
                  });

                  if (filtered?.length === 0) return <div className="text-center py-8 text-muted-foreground text-xs italic">Aucun rendez-vous dans cette catégorie.</div>;

                  return filtered?.map((r) => (
                    <div key={r.idMeeting} className="flex flex-col gap-3 p-3 rounded-lg neu-sm animate-in fade-in slide-in-from-bottom-2">
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-lg shrink-0 ${
                          r.status === 'COMPLETED' ? 'bg-honeydew/20 text-honeydew' : 
                          r.status === 'CANCELED' ? 'bg-warn/10 text-warn' :
                          r.status === 'DRAFT' ? 'bg-alice/50 text-muted-foreground' :
                          'bg-vanilla/20 text-vanilla'
                        }`}>
                          <CalendarDays size={18} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate flex items-center gap-2">
                            {r.type}
                            {r.propertyAddress && <span className="text-[10px] bg-alice/50 px-1.5 py-0.5 rounded text-muted-foreground truncate max-w-[150px]">{r.propertyAddress}</span>}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(r.scheduledAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <SoftBadge tone={
                            r.status === 'COMPLETED' ? 'success' : 
                            r.status === 'SCHEDULED' || r.status === 'RESCHEDULED' ? 'info' :
                            r.status === 'IN_PROGRESS' ? 'success' :
                            r.status === 'PENDING' ? 'warn' :
                            r.status === 'DRAFT' ? 'info' :
                            'info'
                          }>
                            {r.status === 'SCHEDULED' ? 'Planifié' : 
                             r.status === 'COMPLETED' ? 'Terminé' :
                             r.status === 'PENDING' ? 'En attente' :
                             r.status === 'DRAFT' ? 'Brouillon' :
                             r.status === 'IN_PROGRESS' ? 'En cours' :
                             r.status === 'RESCHEDULED' ? 'Reporté' :
                             r.status === 'POSTPONED' ? 'À fixer' :
                             r.status === 'CANCELED' ? 'Annulé' :
                             r.status === 'MISSED' ? 'Manqué' : r.status}
                          </SoftBadge>
                        </div>
                      </div>

                      {/* Action buttons based on status */}
                      <div className="flex gap-2 flex-wrap pt-1 border-t border-border/10 justify-end">
                        {r.status === 'DRAFT' && (
                          <>
                            <button 
                              onClick={() => meetingStatusMutation.mutate({ id: r.idMeeting, request: { newStatus: 'PENDING' } })}
                              className="px-3 py-1.5 rounded-lg bg-alice/50 text-eerie text-[11px] font-bold flex items-center gap-1 hover:bg-alice transition-colors"
                            >
                              <Check size={12} /> Confirmer
                            </button>
                            <button 
                              onClick={() => meetingDeleteMutation.mutate(r.idMeeting)}
                              className="px-3 py-1.5 rounded-lg text-warn/70 hover:text-warn text-[11px] font-bold flex items-center gap-1 transition-colors"
                            >
                              <Trash2 size={12} /> Supprimer
                            </button>
                          </>
                        )}

                        {(r.status === 'SCHEDULED' || r.status === 'RESCHEDULED') && (
                          <>
                             <button 
                              onClick={() => {
                                if (new Date(r.scheduledAt) > new Date()) {
                                  toast.error("La date et l’heure du rendez-vous ne sont pas encore atteintes");
                                  return;
                                }
                                meetingStatusMutation.mutate({ id: r.idMeeting, request: { newStatus: 'IN_PROGRESS' } });
                              }}
                              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors ${
                                new Date(r.scheduledAt) > new Date() 
                                  ? "bg-alice/20 text-muted-foreground/50 cursor-not-allowed" 
                                  : "bg-honeydew/20 text-honeydew hover:bg-honeydew/30"
                              }`}
                            >
                              <CheckCircle2 size={12} /> Marquer en cours
                            </button>
                            <button 
                              onClick={() => {
                                setReschedulingMeetingId(r.idMeeting);
                                setRescheduleDate(r.scheduledAt.split('T')[0]);
                                setRescheduleTime(r.scheduledAt.split('T')[1].substring(0,5));
                              }}
                              className="px-3 py-1.5 rounded-lg bg-alice/50 text-eerie text-[11px] font-bold flex items-center gap-1 hover:bg-alice transition-colors"
                            >
                              <CalendarRange size={12} /> Reporter
                            </button>
                            <button 
                              onClick={() => meetingStatusMutation.mutate({ id: r.idMeeting, request: { newStatus: 'POSTPONED' } })}
                              className="px-3 py-1.5 rounded-lg bg-vanilla/20 text-vanilla text-[11px] font-bold flex items-center gap-1 hover:bg-vanilla/30 transition-colors"
                            >
                              <Clock size={12} /> Reporter (sans date)
                            </button>
                            <button 
                              onClick={() => meetingStatusMutation.mutate({ id: r.idMeeting, request: { newStatus: 'CANCELED' } })}
                              className="px-3 py-1.5 rounded-lg text-warn/70 hover:text-warn text-[11px] font-bold flex items-center gap-1 transition-colors"
                            >
                              <X size={12} /> Annuler
                            </button>
                          </>
                        )}

                        {r.status === 'PENDING' && (
                          <>
                            <button 
                              onClick={() => meetingStatusMutation.mutate({ id: r.idMeeting, request: { newStatus: 'SCHEDULED' } })}
                              className="px-3 py-1.5 rounded-lg bg-alice/50 text-eerie text-[11px] font-bold flex items-center gap-1 hover:bg-alice transition-colors"
                            >
                              <Check size={12} /> Confirmer (OK client)
                            </button>
                            <button 
                              onClick={() => meetingStatusMutation.mutate({ id: r.idMeeting, request: { newStatus: 'CANCELED' } })}
                              className="px-3 py-1.5 rounded-lg text-warn/70 hover:text-warn text-[11px] font-bold flex items-center gap-1 transition-colors"
                            >
                              <X size={12} /> Annuler
                            </button>
                          </>
                        )}

                        {r.status === 'IN_PROGRESS' && (
                          <>
                            <button 
                              onClick={() => meetingStatusMutation.mutate({ id: r.idMeeting, request: { newStatus: 'COMPLETED' } })}
                              className="px-3 py-1.5 rounded-lg bg-honeydew text-eerie text-[11px] font-bold flex items-center gap-1 hover:opacity-90 transition-colors"
                            >
                              <CheckCircle2 size={12} /> Terminer
                            </button>
                            <button 
                              onClick={() => meetingStatusMutation.mutate({ id: r.idMeeting, request: { newStatus: 'MISSED' } })}
                              className="px-3 py-1.5 rounded-lg bg-warn/10 text-warn text-[11px] font-bold flex items-center gap-1 hover:bg-warn/20 transition-colors"
                            >
                              <AlertCircle size={12} /> Marquer manqué
                            </button>
                          </>
                        )}

                         {r.status === 'POSTPONED' && (
                          <>
                            <button 
                              onClick={() => {
                                setReschedulingMeetingId(r.idMeeting);
                                setRescheduleDate(new Date().toISOString().split('T')[0]);
                                setRescheduleTime("10:00");
                              }}
                              className="px-3 py-1.5 rounded-lg bg-alice/50 text-eerie text-[11px] font-bold flex items-center gap-1 hover:bg-alice transition-colors"
                            >
                              <CalendarRange size={12} /> Fixer une date
                            </button>
                            <button 
                              onClick={() => meetingStatusMutation.mutate({ id: r.idMeeting, request: { newStatus: 'CANCELED' } })}
                              className="px-3 py-1.5 rounded-lg text-warn/70 hover:text-warn text-[11px] font-bold flex items-center gap-1 transition-colors"
                            >
                              <X size={12} /> Annuler
                            </button>
                          </>
                        )}

                        {r.status === 'MISSED' && (
                          <button 
                            onClick={() => {
                              setReschedulingMeetingId(r.idMeeting);
                              setRescheduleDate(new Date().toISOString().split('T')[0]);
                              setRescheduleTime("10:00");
                            }}
                            className="px-3 py-1.5 rounded-lg bg-alice/50 text-eerie text-[11px] font-bold flex items-center gap-1 hover:bg-alice transition-colors"
                          >
                            <RotateCcw size={12} /> Replanifier
                          </button>
                        )}
                      </div>

                      {/* Reschedule UI (Inline) */}
                      {reschedulingMeetingId === r.idMeeting && (
                        <div className="mt-2 p-3 bg-alice/30 rounded-lg space-y-3 animate-in zoom-in-95">
                          <div className="text-[10px] font-bold uppercase tracking-widest px-1">Nouvelle date et heure</div>
                          <div className="grid grid-cols-2 gap-2">
                             <input 
                                type="date" 
                                value={rescheduleDate} 
                                onChange={(e) => setRescheduleDate(e.target.value)}
                                className="w-full px-2 py-2 neu-inset rounded-lg bg-transparent text-xs" 
                              />
                              <input 
                                type="time" 
                                value={rescheduleTime} 
                                onChange={(e) => setRescheduleTime(e.target.value)}
                                className="w-full px-2 py-2 neu-inset rounded-lg bg-transparent text-xs" 
                              />
                          </div>
                          <div className="flex gap-2">
                            <button 
                              onClick={() => {
                                meetingStatusMutation.mutate({ 
                                  id: r.idMeeting, 
                                  request: { 
                                    newStatus: r.status === 'POSTPONED' || r.status === 'MISSED' ? 'SCHEDULED' : 'RESCHEDULED',
                                    newScheduledAt: `${rescheduleDate}T${rescheduleTime}:00`
                                  } 
                                });
                                setReschedulingMeetingId(null);
                              }}
                              className="flex-1 py-1.5 rounded-lg bg-eerie text-ghost text-[11px] font-bold"
                            >
                              Sauvegarder
                            </button>
                            <button 
                              onClick={() => setReschedulingMeetingId(null)}
                              className="px-3 py-1.5 rounded-lg neu-sm text-[11px]"
                            >
                              Annuler
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ));
                })()
              )}
            </div>
            <Link to="/agent/agenda" className="w-full mt-2 py-2 text-xs text-muted-foreground hover:text-eerie transition-colors flex items-center justify-center gap-1.5">
              Voir tout l'agenda
            </Link>
          </div>
        )}

        {tab === "Contrats" && (
          <div className="space-y-4">
            <button
              onClick={() => {
                if (!acceptedProperty) {
                  toast.warning("Veuillez d'abord accepter une offre de propriété pour ce dossier.");
                  setTab("Propriétés");
                  return;
                }
                setPropDetail(acceptedProperty);
                setShowContractForm(true);
              }}
              className={`w-full py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                acceptedProperty 
                ? "bg-eerie text-ghost hover:opacity-90 shadow-lg" 
                : "bg-alice text-muted-foreground/60 cursor-not-allowed"
              }`}
            >
              <Plus size={16} /> Nouveau contrat {!acceptedProperty && "(Sélectionnez un bien d'abord)"}
            </button>

            {/* Historique des contrats depuis l'API */}
            {loadingContext ? (
              <div className="flex justify-center py-8"><Loader2 className="animate-spin text-muted-foreground" size={20} /></div>
            ) : contracts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
                <FileSignature size={40} className="text-muted-foreground/25" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Aucun contrat</p>
                  <p className="text-xs text-muted-foreground/70 mt-0.5">Créez le premier contrat pour ce dossier.</p>
                </div>
              </div>
            ) : (
              contracts.map((c: any, index: number) => (
                <NeuCard key={c.idContract} className="mt-4">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold flex items-center gap-2">
                        <FileSignature size={16} /> {index === 0 ? "Contrat en cours" : "Contrat archivé"}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Réf : MR-{new Date(c.createdAt || Date.now()).getFullYear()}-{(c.idContract?.substring(0, 4) || 'XXXX').toUpperCase()} · {((c.agreedPrice || 0) / 1_000_000).toFixed(2)}M $
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {c.status === 'DRAFT' && (
                        <button
                          onClick={() => handleDeleteContract(c.idContract)}
                          className="p-2 rounded-lg neu-sm hover:bg-warn/10 text-warn/70 hover:text-warn transition-all flex items-center justify-center shrink-0"
                          title="Supprimer le brouillon"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                      {c.pdfUrl && (
                        <button
                          onClick={() => window.open(c.pdfUrl, '_blank')}
                          className="p-2 rounded-lg neu-sm hover:neu-pressable text-eerie transition-all flex items-center justify-center shrink-0"
                          title="Aperçu du PDF"
                        >
                          <Eye size={16} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Tracker statut */}
                  <ContractStatusTracker
                    contract={c}
                    onStatusChange={(status: string) => handleStatusChange(c.idContract, status)}
                  />

                  {/* Calendrier de paiement */}
                  {c.payments && c.payments.length > 0 && (
                    <div className="mt-5">
                      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                        Calendrier de paiement
                      </p>
                      <div className="space-y-2">
                        {c.payments.map((p: any) => (
                          <div
                            key={p.idPayment || Math.random()}
                            className={`flex items-center gap-3 p-3 rounded-xl ${
                              p.isPaid ? "bg-honeydew/40" : "neu-sm"
                            }`}
                          >
                            <div
                              className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                                p.isPaid ? "bg-honeydew" : "border-2 border-border"
                              }`}
                            >
                              {p.isPaid && <span className="text-[10px] text-eerie">✓</span>}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium">{p.label || `Versement ${p.paymentOrder}`}</div>
                              <div className="text-xs text-muted-foreground">{p.dueDate}</div>
                            </div>
                            <div className="text-sm font-bold shrink-0">
                              {(p.amount || 0).toLocaleString("en-US")} $
                            </div>
                            {!p.isPaid && (
                               <button 
                                 onClick={() => handleMarkPaid(c.idContract, p.idPayment)}
                                 className="text-[10px] uppercase font-bold px-3 py-2 bg-honeydew text-eerie rounded-lg hover:opacity-90 ml-1 shadow-sm transition-all flex items-center gap-1.5"
                                 title="Marquer comme payé"
                               >
                                 <Check size={10} /> Payer
                               </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </NeuCard>
              ))
            )}
          </div>
        )}
      </div>

      {/* Right — IA */}
      <div className="col-span-12 lg:col-span-3 space-y-5">
        <NeuCard className="bg-alice/40 border border-alice">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs uppercase tracking-widest text-muted-foreground flex items-center gap-1.5"><Sparkles size={12} /> Résumé IA</span>
            <button
              onClick={() => queryClient.invalidateQueries({ queryKey: ["dossier", id] })}
              className="w-7 h-7 rounded-lg neu-sm flex items-center justify-center"
              aria-label="Régénérer"
            >
              <RefreshCw size={12} />
            </button>
          </div>
          <p className="text-sm leading-relaxed">
            {dossier.aiSummary || "Synthèse du dossier en attente."}
          </p>
        </NeuCard>

        <NeuCard>
          <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Action recommandée</div>
          <SoftBadge tone="warn" className="mb-3">Priorité {dossier.isUrgent ? 'Urgente' : 'Standard'}</SoftBadge>
          <p className="text-sm font-medium">{dossier.aiRecommendedAction || "Aucune action recommandée pour le moment."}</p>
        </NeuCard>

        <NeuCard>
          <h3 className="font-semibold flex items-center gap-2 text-sm mb-4">
            <FileText size={14} /> Documents ({docs.length})
          </h3>
          <div className="space-y-2">
            {docs.map((f, i) => {
              let displayName = "";
              if (f.filePath) {
                const filename = f.filePath.split(/[\\/]/).pop() || "Document";
                displayName = filename.includes('_') ? filename.substring(filename.indexOf('_') + 1) : filename;
              } else {
                const clientNameClean = dossier.clientName.replace(/\s+/g, '_');
                displayName = `${f.documentType}_${clientNameClean}`;
              }
              
              return (
              <div
                key={i}
                className={`flex items-center gap-2 p-2 rounded-lg neu-sm text-xs group ${!f.filePath ? 'opacity-60 bg-alice/20' : ''}`}
              >
                <Paperclip size={13} className="text-muted-foreground shrink-0" />
                <span className="flex-1 truncate">
                  {displayName}
                  <div className="text-[10px] text-muted-foreground opacity-70 mt-0.5">
                    {f.documentType || f.type || "Document"} 
                    {!f.filePath && <span className="ml-2 text-warn font-bold">(À fournir)</span>}
                  </div>
                </span>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {f.filePath && (
                    <button
                      onClick={() => {
                        if (f.filePath.startsWith("http")) {
                          window.open(f.filePath, '_blank');
                        } else {
                          window.open(`http://localhost:8081/api/documents/file?path=${encodeURIComponent(f.filePath)}`, '_blank');
                        }
                      }}
                      className="w-6 h-6 rounded flex items-center justify-center hover:bg-alice/50"
                      aria-label="Voir"
                      title="Voir le document"
                    >
                      <Eye size={11} />
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteDocument(f.idDocument || f.id)}
                    className="w-6 h-6 rounded flex items-center justify-center hover:bg-warn/10 text-warn/70 hover:text-warn"
                    aria-label="Supprimer"
                    title="Supprimer le document"
                  >
                    <X size={11} />
                  </button>
                </div>
              </div>
            )})}
            {docs.length === 0 && !loadingContext && (
                <p className="text-center py-4 text-[10px] text-muted-foreground">Aucun document.</p>
            )}
            {loadingContext && (
                <p className="text-center py-4 text-[10px] text-muted-foreground"><Loader2 size={12} className="animate-spin inline mr-2" /> Chargement...</p>
            )}
          </div>

          <div className="mt-4 space-y-2">
            <label htmlFor="new-doc-type" className="sr-only">Type de document</label>
            <select
              id="new-doc-type"
              value={newDocType}
              onChange={(e) => setNewDocType(e.target.value)}
              className="w-full px-3 py-2 neu-inset rounded-lg bg-transparent text-sm cursor-pointer"
              title="Type de document"
            >
              <option value="INCOM_CERT">Certificat de revenus</option>
              <option value="BANK_STATMENT">Relevé bancaire</option>
              <option value="NATIONAL_ID">Carte d'identité</option>
              <option value="PROOF_OF_ADDRESS">Justificatif de domicile</option>
              <option value="CONTRACT_SIGNED">Contrat signé</option>
              <option value="OTHER">Autre</option>
            </select>
            <input
              ref={fileInputRef}
              type="file"
              multiple={false}
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              className="hidden"
              onChange={handleFileUpload}
              title="Choisir un fichier"
            />
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="py-2.5 rounded-lg neu-sm hover:neu-pressable text-xs font-medium flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {uploading ? (
                  <><Loader2 size={12} className="animate-spin" /> Upload…</>
                ) : (
                  <><Upload size={12} /> Ajouter</>
                )}
              </button>
              <button
                onClick={handleRequestDocument}
                className="py-2.5 rounded-lg bg-alice text-eerie text-xs font-medium hover:bg-alice/80 flex items-center justify-center gap-2"
              >
                <Plus size={12} /> Demander
              </button>
            </div>
          </div>
        </NeuCard>

        <NeuCard className="bg-vanilla/40">
          <h3 className="font-semibold text-sm mb-2 flex items-center gap-2"><Send size={14} /> Suivi Dossier</h3>
          <p className="text-xs text-muted-foreground mb-3">Actions rapides basées sur le profil.</p>
          <button
            onClick={() => toast.info("Email de suivi copié")}
            className="w-full py-2.5 rounded-lg bg-eerie text-ghost text-xs font-medium hover:opacity-90"
          >
            Générer email
          </button>
        </NeuCard>
      </div>
    </div>

    {/* Modale : Nouveau contrat (formulaire guidé) */}
      {showContractForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setShowContractForm(false)}
        >
          <div className="absolute inset-0 bg-eerie/60 backdrop-blur-sm" />
          <div
            className="relative bg-ghost rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto soft-scroll p-7 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <ContractForm
              dealId={id!}
              propertyRef={acceptedProperty}
              onClose={() => setShowContractForm(false)}
              onCreated={(c: any) => {
                fetchDossierData();
                setTab("Contrats");
                setShowContractForm(false);
              }}
            />
          </div>
        </div>
      )}

      {/* Property quick view */}
      {propDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setPropDetail(null)}>
          <div className="absolute inset-0 bg-eerie/60 backdrop-blur-sm" />
          <div className="relative bg-ghost rounded-3xl max-w-md w-full shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <img src={propDetail.imageUrls?.[0] || propDetail.images?.[0]?.imageUrl || "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80"} alt={propDetail.address} className="w-full h-48 object-cover" />
            <button onClick={() => setPropDetail(null)} className="absolute top-4 right-4 w-9 h-9 rounded-full glass flex items-center justify-center" aria-label="Fermer"><X size={16} /></button>
            <div className="p-6 space-y-3">
              <h3 className="font-bold text-lg">{propDetail.title || propDetail.address}</h3>
              <div className="text-sm text-muted-foreground">{propDetail.city} · {propDetail.surfaceM2} m²</div>
              <div className="flex items-center justify-between">
                <span className="text-xl font-bold">{propDetail.price?.toLocaleString('en-US')} $</span>
                <SoftBadge tone="info">{propDetail.numRooms} pièces</SoftBadge>
              </div>
              <button onClick={() => setPropDetail(null)} className="w-full py-2.5 rounded-xl bg-eerie text-ghost text-sm font-medium">Fermer</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Dossier Modal */}
      {editingDossier && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-eerie/40 backdrop-blur-md"
          onClick={() => setEditingDossier(false)}
        >
          <div 
            className="relative bg-ghost rounded-[2.5rem] max-w-2xl w-full p-8 md:p-10 shadow-[0_20px_70px_rgba(0,0,0,0.4)] flex flex-col gap-8 max-h-[90vh] overflow-y-auto soft-scroll"
            onClick={e => e.stopPropagation()}
          >
            <button 
              onClick={() => setEditingDossier(false)}
              className="absolute top-6 right-6 w-10 h-10 rounded-full neu-sm flex items-center justify-center hover:bg-alice transition-colors"
            >
              <X size={18} />
            </button>

            <div>
              <h2 className="text-3xl font-extrabold tracking-tight">Modifier le Dossier</h2>
              <p className="text-muted-foreground text-sm mt-2 font-medium">
                Mettez à jour les critères et informations du dossier {dossier.clientType === 'BUYER' ? 'Acheteur' : 'Vendeur'}.
              </p>
            </div>

            <div className="space-y-6">
              {dossier.clientType === 'BUYER' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label htmlFor="edit-budget-min" className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-1">Budget Minimum (MAD)</label>
                    <input 
                      id="edit-budget-min"
                      type="number"
                      value={editForm.budgetMin}
                      onChange={e => setEditForm({...editForm, budgetMin: Number(e.target.value)})}
                      className="w-full px-5 py-3 rounded-2xl neu-inset bg-transparent text-sm focus:outline-none"
                      title="Budget minimum"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="edit-budget-max" className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-1">Budget Maximum (MAD)</label>
                    <input 
                      id="edit-budget-max"
                      type="number"
                      value={editForm.budgetMax}
                      onChange={e => setEditForm({...editForm, budgetMax: Number(e.target.value)})}
                      className="w-full px-5 py-3 rounded-2xl neu-inset bg-transparent text-sm focus:outline-none"
                      title="Budget maximum"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="edit-area" className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-1">Zone Préférée</label>
                    <input 
                      id="edit-area"
                      value={editForm.preferredArea}
                      onChange={e => setEditForm({...editForm, preferredArea: e.target.value})}
                      placeholder="Ex: Gauthier, Maarif..."
                      className="w-full px-5 py-3 rounded-2xl neu-inset bg-transparent text-sm focus:outline-none"
                      title="Zone préférée"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="edit-size" className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-1">Surface Préférée (m²)</label>
                    <input 
                      id="edit-size"
                      type="number"
                      value={editForm.preferredSizeM2}
                      onChange={e => setEditForm({...editForm, preferredSizeM2: Number(e.target.value)})}
                      className="w-full px-5 py-3 rounded-2xl neu-inset bg-transparent text-sm focus:outline-none"
                      title="Surface préférée"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="edit-floor" className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-1">Étage Préféré</label>
                    <select 
                      id="edit-floor"
                      value={editForm.preferredFloor}
                      onChange={e => setEditForm({...editForm, preferredFloor: Number(e.target.value)})}
                      className="w-full px-5 py-3 rounded-2xl neu-inset bg-transparent text-sm focus:outline-none appearance-none"
                      title="Étage préféré"
                    >
                      {floorOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="edit-type" className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-1">Type de Bien</label>
                    <select 
                      id="edit-type"
                      value={editForm.propertySpecificType}
                      onChange={e => setEditForm({...editForm, propertySpecificType: e.target.value})}
                      className="w-full px-5 py-3 rounded-2xl neu-inset bg-transparent text-sm focus:outline-none appearance-none"
                      title="Type de bien"
                    >
                      <option value="">Sélectionner un type</option>
                      {propertyTypes?.map((pt: any) => (
                        <option key={pt.idPropertyType} value={pt.specificType}>{pt.specificType}</option>
                      ))}
                    </select>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="col-span-1 md:col-span-2 space-y-2">
                    <label htmlFor="edit-title" className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-1">Titre de la Propriété</label>
                    <input 
                      id="edit-title"
                      value={editForm.propertyTitle}
                      onChange={e => setEditForm({...editForm, propertyTitle: e.target.value})}
                      placeholder="Ex: Bel appartement à Gauthier"
                      className="w-full px-5 py-3 rounded-2xl neu-inset bg-transparent text-sm focus:outline-none"
                      title="Titre de la propriété"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="edit-address" className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-1">Adresse</label>
                    <input 
                      id="edit-address"
                      value={editForm.address}
                      onChange={e => setEditForm({...editForm, address: e.target.value})}
                      className="w-full px-5 py-3 rounded-2xl neu-inset bg-transparent text-sm focus:outline-none"
                      title="Adresse"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="edit-city" className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-1">Ville</label>
                    <input 
                      id="edit-city"
                      value={editForm.city}
                      onChange={e => setEditForm({...editForm, city: e.target.value})}
                      className="w-full px-5 py-3 rounded-2xl neu-inset bg-transparent text-sm focus:outline-none"
                      title="Ville"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="edit-asking-price" className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-1">Prix Demandé (MAD)</label>
                    <input 
                      id="edit-asking-price"
                      type="number"
                      value={editForm.askingPrice}
                      onChange={e => setEditForm({...editForm, askingPrice: Number(e.target.value)})}
                      className="w-full px-5 py-3 rounded-2xl neu-inset bg-transparent text-sm focus:outline-none"
                      title="Prix demandé"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="edit-surface" className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-1">Surface (m²)</label>
                    <input 
                      id="edit-surface"
                      type="number"
                      value={editForm.propertySurfaceM2}
                      onChange={e => setEditForm({...editForm, propertySurfaceM2: Number(e.target.value)})}
                      className="w-full px-5 py-3 rounded-2xl neu-inset bg-transparent text-sm focus:outline-none"
                      title="Surface"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="edit-rooms" className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-1">Nombre de Pièces</label>
                    <input 
                      id="edit-rooms"
                      type="number"
                      value={editForm.numRooms}
                      onChange={e => setEditForm({...editForm, numRooms: Number(e.target.value)})}
                      className="w-full px-5 py-3 rounded-2xl neu-inset bg-transparent text-sm focus:outline-none"
                      title="Nombre de pièces"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="edit-prop-floor" className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-1">Étage</label>
                    <select 
                      id="edit-prop-floor"
                      value={editForm.propertyFloor}
                      onChange={e => setEditForm({...editForm, propertyFloor: Number(e.target.value)})}
                      className="w-full px-5 py-3 rounded-2xl neu-inset bg-transparent text-sm focus:outline-none appearance-none"
                      title="Étage"
                    >
                      {floorOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3 mt-4">
              <button 
                onClick={handleUpdateDossier}
                disabled={updateDossierMutation.isPending}
                className="w-full py-4 rounded-2xl bg-eerie text-ghost font-bold shadow-lg hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                {updateDossierMutation.isPending ? "Mise à jour..." : "Enregistrer les modifications"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
