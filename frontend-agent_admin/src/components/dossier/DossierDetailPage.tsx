import { Link, useNavigate } from "@tanstack/react-router";
import { useRef, useState, useEffect, type ReactNode } from "react";
import axios from "axios";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  api,
  fetchDossierDetail, 
  fetchInteractions, 
  logInteraction as apiLogInteraction,
  updateInteraction as apiUpdateInteraction,
  deleteInteraction as apiDeleteInteraction,
  fetchPropertyTypes,
  updateDossier as apiUpdateDossier,
  updateDealStage as apiUpdateDealStage,
  dismissStageSuggestion as apiDismissStageSuggestion,
  type InteractionType,
  type CreateInteractionRequest,
  type UpdateDossierRequest,
  type DealStage,
  type AssignmentHistory,
  type InteractionItem
} from "@/api/dossiersApi";
import {
  fetchDealMeetings,
  createMeeting as apiCreateMeeting,
  updateMeetingStatus as apiUpdateMeetingStatus,
  deleteMeeting as apiDeleteMeeting,
  type MeetingType,
  type CreateMeetingDto,
  type MeetingItem,
  type UpdateMeetingStatusDto
} from "@/api/meetingApi";
// @ts-ignore
import { getPropertiesByDeal } from "@/api/propertyApi";
// @ts-ignore
import { acceptOffer as apiAcceptOffer } from "@/api/offerApi";
import { NeuCard } from "@/components/ui/neu-card";
import { Avatar, LeadScore, SoftBadge } from "@/components/ui/design-bits";
import {
  Phone, Mail, MapPin, Sparkles, RefreshCw, Plus, FileText, CalendarDays, Building2,
  Send, X, Upload, Paperclip, Loader2, Eye, Clock, FileSignature, Check, Trash2, CalendarRange, CheckCircle2, AlertCircle, RotateCcw, ChevronLeft, ChevronDown, ChevronUp,
  History, UserMinus, UserPlus, Image as ImageIcon, Camera, Pencil, TrendingUp
} from "lucide-react";
import { toast } from "sonner";
// @ts-ignore
import { ContractForm, ContractStatusTracker } from "@/components/contract/ContractForm";
// @ts-ignore
import { getContractsByDeal, updateContractStatus, markPaymentPaid, deleteContract as apiDeleteContract } from "@/api/contractApi";
import { refreshLeadScore, refreshInteractionSummary, getAiRecommendations } from "@/api/aiApi";
import { linkPropertyToDeal as apiLinkProperty } from "@/api/propertyApi";
import { RagChatWidget } from "@/components/ai/RagChatWidget";
import { EmailModal } from "@/components/EmailModal";
import { getUser } from "@/lib/auth";
import { updateAdminDealStage } from "@/api/adminDashboardApi";

const tabs = ["Interactions", "Propriétés", "Rendez-vous", "Contrats"] as const;

function InteractionItem({ 
  it, 
  iconMap, 
  isAdmin, 
  onEdit, 
  onDelete 
}: { 
  it: InteractionItem, 
  iconMap: any, 
  isAdmin?: boolean, 
  onEdit?: (it: InteractionItem) => void, 
  onDelete?: (id: string) => void 
}) {
  const [expanded, setExpanded] = useState(false);
  const Icon = iconMap[it.type] || FileText;
  const formattedDate = new Date(it.occurredAt).toLocaleString('fr-FR', { 
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' 
  });
  
  const isLong = it.description && it.description.length > 80;

  return (
    <div className="relative mb-4">
      <div className="absolute -left-8 top-3 w-6 h-6 rounded-full bg-honeydew flex items-center justify-center ring-4 ring-ghost border border-honeydew/20">
        <Icon size={12} className="text-eerie" />
      </div>
      <NeuCard size="sm">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <span className="font-semibold text-sm">{it.type}</span>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">{formattedDate}{it.durationMinutes ? ` · ${it.durationMinutes} min` : ""}</span>
            {isAdmin && (
              <div className="flex items-center gap-1.5 border-l pl-3 border-border">
                <button 
                  onClick={() => onEdit?.(it)}
                  className="p-1 hover:text-eerie transition-colors"
                  title="Modifier"
                >
                  <Pencil size={12} />
                </button>
                <button 
                  onClick={() => onDelete?.(it.idInteraction)}
                  className="p-1 hover:text-warn transition-colors"
                  title="Supprimer"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            )}
          </div>
        </div>
        
        <div className="mt-1.5">
          <p className={`text-sm text-muted-foreground leading-relaxed ${!expanded && isLong ? "line-clamp-1" : ""}`}>
            {it.description}
          </p>
          {isLong && (
            <button 
              onClick={() => setExpanded(!expanded)}
              className="mt-1 flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-primary hover:text-primary/80 transition-colors"
            >
              {expanded ? (
                <><ChevronUp size={12} /> Voir moins</>
              ) : (
                <><ChevronDown size={12} /> Voir plus</>
              )}
            </button>
          )}
        </div>

        <div className="mt-2 flex items-center gap-1.5 opacity-50">
          <Avatar name={it.agentName} size={16} />
          <span className="text-[10px] font-medium">{it.agentName}</span>
        </div>
      </NeuCard>
    </div>
  );
}

export function DossierDetailPage({
  dossierId,
  backTo,
  extras,
  isAdmin = false,
}: {
  dossierId?: string;
  backTo: string;
  /** Admin-only (or other context) blocks rendered below the page header. */
  extras?: ReactNode;
  isAdmin?: boolean;
}) {
  const id = dossierId;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<string>("Interactions");
  const user = getUser();
  
  const currentTabs = isAdmin 
    ? ["Interactions", "Propriétés", "Rendez-vous", "Contrats", "Historique"]
    : ["Interactions", "Propriétés", "Rendez-vous", "Contrats"];

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
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [editingInteractionId, setEditingInteractionId] = useState<string | null>(null);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [openedViaDetails, setOpenedViaDetails] = useState(false);
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
    propertyImageUrls: [],
  });

  const [aiRecommendations, setAiRecommendations] = useState<any[]>([]);

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
    queryFn: fetchPropertyTypes,
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

  const updateInteractionMutation = useMutation({
    mutationFn: ({ idInteraction, request }: { idInteraction: string, request: CreateInteractionRequest }) => 
      apiUpdateInteraction(idInteraction, request),
    onSuccess: () => {
      toast.success("Interaction mise à jour");
      queryClient.invalidateQueries({ queryKey: ["interactions", id] });
      setEditingInteractionId(null);
      setLogging(false);
      setNewDesc("");
      setNewDurationHrs(0);
      setNewDurationMins(0);
    },
    onError: () => {
      toast.error("Erreur lors de la mise à jour");
    }
  });

  const deleteInteractionMutation = useMutation({
    mutationFn: apiDeleteInteraction,
    onSuccess: () => {
      toast.success("Interaction supprimée");
      queryClient.invalidateQueries({ queryKey: ["interactions", id] });
    },
    onError: () => {
      toast.error("Erreur lors de la suppression");
    }
  });

  const aiRefreshMutation = useMutation({
    mutationFn: refreshLeadScore,
    onSuccess: () => {
      toast.success("Score IA mis à jour");
      queryClient.invalidateQueries({ queryKey: ["dossier", id] });
    },
    onError: (e: any) => {
      toast.error("Échec du rafraîchissement IA : " + e.message);
    }
  });

  const aiSummaryRefreshMutation = useMutation({
    mutationFn: refreshInteractionSummary,
    onSuccess: () => {
      toast.success("Résumé IA mis à jour");
      queryClient.invalidateQueries({ queryKey: ["dossier", id] });
    },
    onError: (e: any) => {
      toast.error("Échec du rafraîchissement du résumé : " + e.message);
    }
  });

  const dismissSuggestionMutation = useMutation({
    mutationFn: apiDismissStageSuggestion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dossier", id] });
    },
    onError: (e: any) => {
      toast.error("Erreur lors du rejet de la suggestion : " + e.message);
    }
  });

  const aiRecommendationMutation = useMutation({
    mutationFn: (dealId: string) => getAiRecommendations(dealId),
    onSuccess: (data) => {
      setAiRecommendations(data);
      if (data && data.length > 0) {
        toast.success(`${data.length} recommandations trouvées !`);
      } else {
        toast.info("Aucune recommandation trouvée.");
      }
    },
    onError: (e: any) => {
      toast.error("Échec de la recommandation IA : " + e.message);
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
    mutationFn: ({ id, stage }: { id: string, stage: DealStage }) => 
      isAdmin ? updateAdminDealStage(id, stage) : apiUpdateDealStage(id, stage),
    onSuccess: (updated) => {
      // Immediately update the cache so the UI reflects the new stage without waiting for re-fetch
      queryClient.setQueryData(["dossier", id], updated);
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

  const linkPropertyMutation = useMutation({
    mutationFn: ({ dealId, prop }: { dealId: string, prop: any }) => {
      const linkRequest = {
        externalId: prop.propertyId || prop.id,
        title: prop.title,
        address: prop.address || prop.title,
        city: prop.city || dossier?.preferredArea || "",
        price: prop.price,
        surfaceM2: prop.sizeM2 || prop.surfaceM2,
        numRooms: prop.beds || prop.numRooms,
        listingUrl: prop.listingUrl,
        propertyTypeSpecific: prop.type,
        imageUrls: [prop.imageUrl]
      };
      return apiLinkProperty(dealId, linkRequest);
    },
    onSuccess: () => {
      toast.success("Propriété liée au dossier !");
      queryClient.invalidateQueries({ queryKey: ["deal-properties", id] });
      fetchDossierData();
    },
    onError: (e: any) => {
      toast.error("Erreur lors de la liaison : " + e.message);
    }
  });

  /* documents */
  const fileInputRef = useRef<HTMLInputElement>(null);
  const propertyFileInputRef = useRef<HTMLInputElement>(null);
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
        api.get(`/api/documents/deal/${id}`).then(res => res.data)
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
    if (files.length === 0 || !id) return;
    
    setUploading(true);
    const formData = new FormData();
    formData.append("dealId", id);
    formData.append("file", files[0]);
    formData.append("type", newDocType);

    try {
      await api.post('/api/documents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      toast.success("Document uploadé");
      fetchDossierData();
    } catch (e: any) {
      toast.error("Upload échoué : " + e.message);
    } finally {
      setUploading(false);
    }
    e.target.value = "";
  };

  const handleRequestDocument = async () => {
    if (!id || !newDocType) return;
    try {
      await api.post(`/api/documents/request?dealId=${id}&type=${newDocType}`);
      toast.success("Demande de document enregistrée");
      fetchDossierData();
    } catch (e: any) {
      toast.error("Échec de la demande : " + e.message);
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    if (!confirm("Voulez-vous vraiment supprimer ce document ?")) return;
    try {
      await api.delete(`/api/documents/${docId}`);
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
    
    if (editingInteractionId) {
      updateInteractionMutation.mutate({ idInteraction: editingInteractionId, request });
    } else {
      mutation.mutate(request);
    }
  };

  const handleEditInteraction = (it: InteractionItem) => {
    setNewType(it.type);
    const date = new Date(it.occurredAt);
    setNewDate(date.toISOString().split('T')[0]);
    setNewTime(date.toTimeString().split(' ')[0].substring(0, 5));
    setNewDurationHrs(Math.floor((it.durationMinutes || 0) / 60));
    setNewDurationMins((it.durationMinutes || 0) % 60);
    setNewDesc(it.description);
    setEditingInteractionId(it.idInteraction);
    setLogging(true);
  };

  const handleDeleteInteraction = (id: string) => {
    if (window.confirm("Supprimer cette interaction ?")) {
      deleteInteractionMutation.mutate(id);
    }
  };

  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const handlePropertyPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    
    setUploadingPhoto(true);
    try {
      const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "dam3isgtd"}/image/upload`;
      const CLOUDINARY_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "Rawabet";

      const uploadedUrls = [...(editForm.propertyImageUrls || [])];

      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", CLOUDINARY_PRESET);
        formData.append("folder", "properties");

        const res = await axios.post(CLOUDINARY_URL, formData);
        if (res.data.secure_url) {
          uploadedUrls.push(res.data.secure_url);
        }
      }

      setEditForm(prev => ({
        ...prev,
        propertyImageUrls: uploadedUrls
      }));
      toast.success(`${files.length} photo(s) ajoutée(s)`);
    } catch (e: any) {
      toast.error("Erreur lors de l'upload des photos : " + e.message);
    } finally {
      setUploadingPhoto(false);
    }
    e.target.value = "";
  };

  const handleRemovePhoto = (urlToRemove: string) => {
    setEditForm(prev => ({
      ...prev,
      propertyImageUrls: prev.propertyImageUrls?.filter(url => url !== urlToRemove)
    }));
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
      propertyImageUrls: dossier.propertyImageUrls || [],
    });
    setIsReadOnly(true);
    setOpenedViaDetails(true);
    setEditingDossier(true);
  };

  const handleOpenDirectEdit = () => {
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
      propertyImageUrls: dossier.propertyImageUrls || [],
    });
    setIsReadOnly(false);
    setOpenedViaDetails(false);
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
  if (loadingDossier) return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin" /></div>;
  if (!dossier) return <div className="p-10 text-center">Dossier introuvable.</div>;

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
          to={backTo}
          className="w-10 h-10 rounded-full neu-sm flex items-center justify-center hover:bg-alice transition-colors"
        >
          <ChevronLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-eerie">Détail du Dossier</h1>
          <p className="text-muted-foreground text-sm">Consultez et gérez les informations de ce dossier client.</p>
        </div>
      </div>

      {extras}

      <div className="grid grid-cols-12 gap-5 md:gap-6 max-w-[1500px]">
      {/* Left — profile */}
      <div className="col-span-12 lg:col-span-3 space-y-5">
        <NeuCard className="text-center relative group">
          <button 
            onClick={handleOpenDirectEdit}
            className="absolute top-4 right-4 p-2 rounded-xl neu-sm text-muted-foreground hover:text-eerie hover:bg-alice/50 transition-all opacity-0 group-hover:opacity-100"
            title="Modifier le dossier"
          >
            <RotateCcw size={14} className="rotate-45" />
          </button>
          <Avatar name={dossier.clientName} size={88} />
          <h2 className="font-bold text-lg mt-3">{dossier.clientName}</h2>
          <SoftBadge tone="info" className="mt-1">{dossier.clientType === 'BUYER' ? 'Acheteur' : 'Vendeur'}</SoftBadge>
          <div className="text-left mt-5 space-y-2 text-sm">
            <a 
              href={`tel:${dossier.clientPhone}`} 
              className="flex items-center gap-2 hover:underline"
              onClick={() => toast.info(`Appel vers ${dossier.clientPhone}…`)}
            >
              <Phone size={14} /> {dossier.clientPhone}
            </a>
            <button 
              onClick={() => setShowEmailModal(true)}
              className="flex items-center gap-2 hover:underline text-left w-full"
            >
              <Mail size={14} /> {dossier.clientEmail}
            </button>
          </div>
          <div className="mt-5 pt-5 border-t border-border space-y-3 text-left">
            <div>
              <div className="text-xs text-muted-foreground">Budget</div>
              <div className="text-xl font-bold">
                {(dossier.budgetMin || 0).toLocaleString()} - {(dossier.budgetMax || 0).toLocaleString()} $
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
              <FileText size={12} /> Détails du dossier
            </button>
          </div>
        </NeuCard>

        <NeuCard className="text-center bg-alice/40">
          <div className="flex justify-between items-center mb-2">
            <div className="text-xs uppercase tracking-widest text-muted-foreground flex items-center gap-1">
              <Sparkles size={12} className="text-primary" /> Lead Score IA
            </div>
            <button 
              onClick={() => aiRefreshMutation.mutate(id!)}
              disabled={aiRefreshMutation.isPending}
              className="p-1 hover:bg-alice rounded-full transition-all disabled:opacity-50"
              title="Recalculer le score"
            >
              <RefreshCw size={14} className={`text-muted-foreground ${aiRefreshMutation.isPending ? 'animate-spin' : ''}`} />
            </button>
          </div>
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
        {/* AI Stage Suggestion Banner */}
        {dossier.aiStageSuggestion && dossier.aiStageSuggestion !== dossier.stage && (
          <NeuCard size="sm" className="bg-white border-2 border-[#CFDECA] shadow-xl overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-4 text-[#CFDECA] opacity-30 group-hover:opacity-50 transition-opacity">
              <Sparkles size={80} />
            </div>
            <div className="p-4 relative z-10">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#CFDECA] text-eerie flex items-center justify-center flex-shrink-0 shadow-lg">
                  <Sparkles size={24} />
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#CFDECA]">Suggestion IA</span>
                  </div>
                  <h3 className="text-base font-bold text-eerie mt-0.5">
                    Passer à l'étape <span className="px-2 py-0.5 bg-[#CFDECA] text-eerie rounded-lg ml-1">{dossier.aiStageSuggestion}</span> ?
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed font-medium">
                    "{dossier.aiStageSuggestionReason}"
                  </p>
                  <div className="flex gap-3 mt-5">
                    <button
                      onClick={() => stageMutation.mutate({ id: id!, stage: dossier.aiStageSuggestion! })}
                      disabled={stageMutation.isPending}
                      className="px-6 py-2.5 bg-[#CFDECA] text-eerie text-xs font-bold uppercase tracking-widest rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg flex items-center gap-2"
                    >
                      {stageMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                      Confirmer le changement
                    </button>
                    <button
                      onClick={() => dismissSuggestionMutation.mutate(id!)}
                      disabled={dismissSuggestionMutation.isPending}
                      className="px-6 py-2.5 bg-alice/50 text-muted-foreground text-xs font-bold uppercase tracking-widest rounded-xl hover:text-eerie hover:bg-[#CFDECA]/30 transition-all"
                    >
                      Ignorer
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </NeuCard>
        )}

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
          {currentTabs.map((t) => (
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
          <div className="space-y-5">
            <NeuCard>
              {!logging ? (
                <button
                  onClick={() => {
                    setEditingInteractionId(null);
                    setLogging(true);
                  }}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-eerie text-ghost text-sm font-medium hover:opacity-90"
                >
                  <Plus size={16} /> {isAdmin ? "Ajouter une note/interaction" : "Logger une interaction"}
                </button>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <h3 className="text-sm font-bold">{editingInteractionId ? "Modifier l'interaction" : "Nouvelle interaction"}</h3>
                  </div>
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
                    <button onClick={() => {
                      setLogging(false);
                      setEditingInteractionId(null);
                      setNewDesc("");
                    }} className="px-5 py-2.5 rounded-lg neu-sm text-sm">Annuler</button>
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
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-muted-foreground">{formattedDate}{it.durationMinutes ? ` · ${it.durationMinutes} min` : ""}</span>
                          {isAdmin && (
                            <div className="flex items-center gap-1.5 border-l pl-3 border-border">
                              <button 
                                onClick={() => handleEditInteraction(it)}
                                className="p-1 hover:text-eerie transition-colors"
                                title="Modifier"
                              >
                                <Pencil size={12} />
                              </button>
                              <button 
                                onClick={() => handleDeleteInteraction(it.idInteraction)}
                                className="p-1 hover:text-warn transition-colors"
                                title="Supprimer"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          )}
                        </div>
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
            {isAdmin && (
              <div className="pt-4">
                <RagChatWidget dealId={id!} />
              </div>
            )}
          </div>
        )}

        {tab === "Propriétés" && (
          <>
            {(dossier.clientType === 'BUYER' || !isAdmin) && (
              <div className="flex gap-3 flex-wrap mb-4">
                <Link 
                  to={isAdmin ? "/admin/recherche" : "/agent/recherche"} 
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
                  onClick={() => aiRecommendationMutation.mutate(id!)}
                  disabled={aiRecommendationMutation.isPending}
                  className={`flex-1 min-w-[180px] flex items-center justify-center gap-2 py-3 rounded-xl transition-all ${
                    aiRecommendationMutation.isPending ? "bg-vanilla/50 cursor-wait" : "bg-vanilla text-eerie hover:opacity-90 active:scale-[0.98]"
                  } text-sm font-medium shadow-md`}
                >
                  {aiRecommendationMutation.isPending ? (
                    <><Loader2 size={16} className="animate-spin" /> Analyse en cours...</>
                  ) : (
                    <><Sparkles size={16} /> {aiRecommendations.length > 0 ? `${aiRecommendations.length} recommandations trouvées` : "Demander une recommandation IA"}</>
                  )}
                </button>
              </div>
            )}

            {/* AI Recommendations Section */}
            {aiRecommendations.length > 0 && tab === "Propriétés" && (
              <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="flex items-center gap-2 mb-4 px-1">
                  <Sparkles size={18} className="text-primary" />
                  <h3 className="font-bold text-eerie">Recommandations IA pour {dossier.clientName}</h3>
                </div>
                <div className="grid gap-4">
                  {aiRecommendations.map((rec: any) => (
                    <NeuCard key={rec.propertyId} className="border-2 border-primary/10 overflow-hidden">
                      <div className="flex flex-col md:flex-row gap-5">
                        <div className="w-full md:w-48 h-32 shrink-0 relative">
                          <img 
                            src={rec.imageUrl || "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80"} 
                            alt={rec.title} 
                            className="w-full h-full object-cover rounded-xl"
                          />
                          <div className="absolute top-2 left-2 bg-eerie text-ghost text-[10px] font-black px-2 py-1 rounded-lg shadow-xl">
                            TOP #{rec.rank}
                          </div>
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-bold text-base text-eerie">{rec.title}</h4>
                              <p className="text-xs text-muted-foreground">{rec.type} · {rec.sizeM2}m² · {rec.beds} ch.</p>
                            </div>
                            <div className="text-right">
                              <div className="font-black text-primary text-lg">{rec.price?.toLocaleString()} $</div>
                            </div>
                          </div>
                          
                          <div className="bg-alice/40 p-3 rounded-xl border border-alice relative">
                             <div className="text-[10px] font-black uppercase tracking-widest text-eerie mb-1">Justification IA</div>
                             <p className="text-sm italic leading-relaxed text-eerie font-medium">
                               "{rec.justification}"
                             </p>
                          </div>

                          <div className="flex gap-3 pt-1">
                            <button
                              onClick={() => linkPropertyMutation.mutate({ dealId: id!, prop: rec })}
                              disabled={linkPropertyMutation.isPending}
                              className="flex-1 py-2 rounded-lg bg-eerie text-ghost text-xs font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2"
                            >
                              {linkPropertyMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                              Lier ce bien au dossier
                            </button>
                            {rec.title ? (
                              <a 
                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(rec.title)}`}
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="px-4 py-2 rounded-lg neu-sm text-xs font-bold hover:bg-alice/50 transition-all flex items-center justify-center gap-2"
                              >
                                <MapPin size={14} /> Voir sur Maps
                              </a>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </NeuCard>
                  ))}
                </div>
                <div className="mt-4 flex justify-center">
                   <button 
                    onClick={() => setAiRecommendations([])}
                    className="text-xs font-bold text-muted-foreground hover:text-warn transition-colors flex items-center gap-1.5"
                   >
                     <X size={12} /> Effacer les recommandations
                   </button>
                </div>
                <div className="h-px bg-border/20 my-8 w-full" />
              </div>
            )}
            
            <div className="grid sm:grid-cols-2 gap-4">
              {dossier.clientType === 'SELLER' ? (
                // Pour un vendeur, on affiche uniquement sa propriété à vendre
                dossier.address ? (
                  <NeuCard size="sm" pressable onClick={() => setPropDetail({
                    address: dossier.address,
                    title: dossier.propertyTitle,
                    city: dossier.city,
                    price: dossier.askingPrice,
                    surfaceM2: dossier.propertySurfaceM2,
                    numRooms: dossier.numRooms,
                    imageUrls: dossier.propertyImageUrls
                  })}>
                    <div className="relative">
                      <img src={dossier.propertyImageUrls?.[0] || "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80"} alt={dossier.address} className="w-full h-32 object-cover rounded-lg mb-3" />
                      <div className="absolute top-2 right-2 bg-vanilla text-eerie text-[10px] font-bold px-2 py-1 rounded-full shadow-lg flex items-center gap-1">
                        BIEN À VENDRE
                      </div>
                    </div>
                    <div className="font-medium text-sm">{dossier.propertyTitle || dossier.address}</div>
                    <div className="text-xs text-muted-foreground">{dossier.propertySurfaceM2} m² · {dossier.numRooms} pcs</div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="font-bold text-sm">{dossier.askingPrice?.toLocaleString('en-US')} $</span>
                      <SoftBadge tone="success">En vente</SoftBadge>
                    </div>
                  </NeuCard>
                ) : (
                  <p className="col-span-2 text-center py-10 text-xs text-muted-foreground">Aucune propriété enregistrée pour ce vendeur.</p>
                )
              ) : (
                // Pour un acheteur, on affiche les propriétés liées/proposées
                <>
                  {linkedProperties.map((p: any) => (
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
                </>
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
                          {linkedProperties?.map((p: any) => (
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

                        {r.status === 'MISSED' && !isAdmin && (
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
            {!isAdmin && (
              <Link to="/agent/agenda" className="w-full mt-2 py-2 text-xs text-muted-foreground hover:text-eerie transition-colors flex items-center justify-center gap-1.5">
                Voir tout l'agenda
              </Link>
            )}
          </div>
        )}

        {tab === "Contrats" && (
          <div className="space-y-4">
            {contracts.length === 0 && (
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
            )}

            {contracts.length > 0 && (
              <div className="bg-vanilla/10 p-3 rounded-xl border border-vanilla/20 flex items-center gap-3">
                <AlertCircle size={16} className="text-vanilla shrink-0" />
                <p className="text-[10px] font-bold text-vanilla uppercase tracking-wider">
                  Un contrat est déjà associé à ce dossier.
                </p>
              </div>
            )}

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
                    <div className="flex items-center gap-1 shrink-0">
                      {c.status === "DRAFT" && (
                        <button
                          onClick={() => handleDeleteContract(c.idContract)}
                          className="p-2 rounded-lg hover:bg-warn/10 text-warn transition-all flex items-center justify-center"
                          title="Supprimer le brouillon"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                      {(c.pdfUrl || c.localFilePath) && (
                        <button
                          onClick={() => window.open(c.localFilePath ? `http://localhost:8081${c.localFilePath}` : c.pdfUrl, '_blank')}
                          className="p-2 rounded-lg neu-sm hover:neu-pressable text-eerie transition-all flex items-center justify-center"
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
                              {(p.amount || 0).toLocaleString("fr-MA")} $
                            </div>
                            {!p.isPaid && !isAdmin && (
                               <button 
                                 onClick={() => handleMarkPaid(c.idContract, p.idPayment)}
                                 className="text-[10px] uppercase font-bold px-2 py-1.5 bg-honeydew text-eerie rounded-md hover:bg-honeydew/80 ml-1 transition-all"
                                 title="Marquer comme payé"
                               >
                                 Payer
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

        {tab === "Historique" && (
          <div className="space-y-4">
             <div className="relative pl-8">
              <div className="absolute left-3 top-2 bottom-2 w-px bg-border " />
              {dossier.assignmentHistory?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm italic">Aucun historique d'affectation.</div>
              ) : dossier.assignmentHistory?.map((h, i) => (
                <div key={h.idAssignment} className="relative mb-6">
                  <div className={`absolute -left-8 top-1 w-6 h-6 rounded-full flex items-center justify-center ring-4 ring-ghost border ${i === 0 ? 'bg-honeydew border-honeydew/20' : 'bg-alice border-alice/20'}`}>
                    {i === 0 ? <UserPlus size={12} className="text-eerie" /> : <UserMinus size={12} className="text-muted-foreground" />}
                  </div>
                  <NeuCard size="sm" className={i === 0 ? "border-l-4 border-l-honeydew" : ""}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar name={h.agentName} size={32} />
                        <div>
                          <p className="text-sm font-bold">{h.agentName}</p>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
                            {i === 0 && !h.unassignedAt ? "Agent actuel" : "Ancien agent"}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] text-muted-foreground">Affecté le</div>
                        <div className="text-xs font-medium">{new Date(h.assignedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                      </div>
                    </div>
                    {h.unassignedAt && (
                      <div className="mt-3 pt-3 border-t border-border/50 flex justify-between items-center">
                        <span className="text-[10px] text-muted-foreground italic">Retiré le {new Date(h.unassignedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        {h.reason && <span className="text-[10px] bg-alice/50 px-2 py-0.5 rounded text-muted-foreground">{h.reason}</span>}
                      </div>
                    )}
                  </NeuCard>
                </div>
              ))}
            </div>
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
                key={f.idDocument || i}
                className={`flex items-center gap-2 p-2 rounded-lg neu-sm text-xs group ${(!f.filePath && !f.localFilePath) ? 'opacity-60 bg-alice/20' : ''}`}
              >
                <Paperclip size={13} className="text-muted-foreground shrink-0" />
                <span className="flex-1 truncate">
                  {displayName}
                  <div className="text-[10px] text-muted-foreground opacity-70 mt-0.5">
                    {f.documentType || f.type || "Document"} 
                    {(!f.filePath && !f.localFilePath) && <span className="ml-2 text-warn font-bold">(À fournir)</span>}
                  </div>
                </span>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {(f.filePath || f.localFilePath) && (
                    <button
                      onClick={() => {
                        if (f.localFilePath) {
                          window.open(`http://localhost:8081${f.localFilePath}`, '_blank');
                        } else if (f.filePath.startsWith("http")) {
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
                    <label htmlFor="edit-budget-min" className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-1">Budget Minimum ($)</label>
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
                    <label htmlFor="edit-budget-max" className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-1">Budget Maximum ($)</label>
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
                    <label htmlFor="edit-asking-price" className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-1">Prix Demandé ($)</label>
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

                  {/* Photo Gallery for Sellers */}
                  <div className="col-span-1 md:col-span-2 space-y-3 mt-4">
                    <div className="flex items-center justify-between px-1">
                      <label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Photos de la Propriété</label>
                      <button
                        type="button"
                        onClick={() => propertyFileInputRef.current?.click()}
                        disabled={uploadingPhoto}
                        className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-primary hover:text-primary/80 transition-colors disabled:opacity-50"
                      >
                        {uploadingPhoto ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                        Ajouter des photos
                      </button>
                    </div>
                    
                    <input
                      ref={propertyFileInputRef}
                      type="file"
                      multiple
                      accept="image/*"
                      className="hidden"
                      onChange={handlePropertyPhotoUpload}
                      title="Ajouter des photos"
                    />

                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                      {editForm.propertyImageUrls && editForm.propertyImageUrls.length > 0 ? (
                        editForm.propertyImageUrls.map((url, idx) => (
                          <div key={idx} className="relative aspect-square rounded-xl overflow-hidden neu-sm border border-border/20 shadow-sm">
                            <img src={url} alt={`Propriété ${idx + 1}`} className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => handleRemovePhoto(url)}
                              className="absolute top-1 right-1 w-7 h-7 rounded-lg bg-white text-warn flex items-center justify-center shadow-md hover:bg-ghost transition-all z-10 border border-border/20"
                              title="Supprimer la photo"
                            >
                              <X size={14} strokeWidth={3} />
                            </button>
                          </div>
                        ))
                      ) : (
                        <div 
                          onClick={() => propertyFileInputRef.current?.click()}
                          className="col-span-full py-10 rounded-2xl border-2 border-dashed border-border/40 flex flex-col items-center justify-center gap-2 text-muted-foreground/60 cursor-pointer hover:border-primary/30 hover:text-primary/50 transition-all"
                        >
                          <Camera size={32} strokeWidth={1.5} />
                          <p className="text-xs font-medium">Aucune photo enregistrée</p>
                          <p className="text-[10px] uppercase tracking-widest font-black">Cliquez pour ajouter</p>
                        </div>
                      )}
                    </div>
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
