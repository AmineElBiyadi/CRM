import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useRef, useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  fetchDossierDetail, 
  fetchInteractions, 
  logInteraction as apiLogInteraction,
  fetchDealMeetings,
  createMeeting as apiCreateMeeting,
  updateDealStage as apiUpdateDealStage,
  type InteractionType,
  type CreateInteractionRequest,
  type MeetingType,
  type CreateMeetingDto,
  type DealStage
} from "@/api/dossiersApi";
// @ts-ignore
import { getPropertiesByDeal } from "@/api/propertyApi";
import { NeuCard } from "@/components/ui/neu-card";
import { Avatar, LeadScore, SoftBadge } from "@/components/ui/design-bits";
import {
  Phone, Mail, MapPin, Sparkles, RefreshCw, Plus, FileText, CalendarDays, Building2,
  Send, X, Upload, Paperclip, Loader2, Eye, Clock, FileSignature,
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
  const [newMeetingPropertyId, setNewMeetingPropertyId] = useState("");

  const { data: dossier, isLoading: loadingDossier } = useQuery({
    queryKey: ["dossier", id],
    queryFn: () => fetchDossierDetail(id!),
    enabled: !!id,
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
      toast.success("Rendez-vous planifié avec succès");
      queryClient.invalidateQueries({ queryKey: ["meetings", id] });
      setPlanningMeeting(false);
      setNewMeetingNotes("");
      setNewMeetingPropertyId("");
    },
    onError: () => {
      toast.error("Erreur lors de la planification");
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
    if (files.length === 0 || !id) return;
    
    setUploading(true);
    const formData = new FormData();
    formData.append("dealId", id);
    formData.append("file", files[0]);
    formData.append("type", newDocType);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:8081"}/api/documents/upload`, {
        method: "POST",
        body: formData,
        credentials: "include"
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success("Document uploadé");
      fetchDossierData();
    } catch (e: any) {
      toast.error("Upload échoué : " + e.message);
    } finally {
      setUploading(false);
    }
    e.target.value = "";
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

  const handleCreateMeeting = () => {
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
      propertyAddress: (newMeetingType === 'PROPERTY_VISIT' || newMeetingType === 'CONTRACT_SIGNING') 
        ? newMeetingPropertyId 
        : undefined,
    };
    meetingMutation.mutate(request);
  };


  if (!id) return <div className="p-10 text-center">Aucun dossier sélectionné.</div>;
  if (loadingDossier) return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin" /></div>;
  if (!dossier) return <div className="p-10 text-center">Dossier introuvable.</div>;

  const currentStageIdx = STAGES.findIndex(s => s.value === dossier.stage);

  const iconMap: Record<string, any> = { 
    CALL: Phone, 
    VISIT: MapPin, 
    EMAIL: Mail, 
    MEETING: CalendarDays,
    NOTE: FileText,
    SYSTEM: Sparkles
  };

  return (
    <div className="grid grid-cols-12 gap-5 md:gap-6 max-w-[1500px]">
      {/* Left — profile */}
      <div className="col-span-12 lg:col-span-3 space-y-5">
        <NeuCard className="text-center">
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
                      <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold px-1">Date</label>
                      <input 
                        type="date" 
                        value={newDate} 
                        onChange={(e) => setNewDate(e.target.value)}
                        className="w-full px-3 py-2 neu-inset rounded-lg bg-transparent text-sm" 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold px-1">Heure</label>
                      <input 
                        type="time" 
                        value={newTime} 
                        onChange={(e) => setNewTime(e.target.value)}
                        className="w-full px-3 py-2 neu-inset rounded-lg bg-transparent text-sm" 
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold px-1 flex items-center gap-1.5"><Clock size={12} /> Durée</label>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-0.5">
                        <div className="text-[10px] text-muted-foreground px-1">Heures</div>
                        <select
                          value={newDurationHrs}
                          onChange={(e) => setNewDurationHrs(Number(e.target.value))}
                          className="w-full px-3 py-2 neu-inset rounded-lg bg-transparent text-sm cursor-pointer"
                        >
                          {Array.from({ length: 13 }, (_, i) => (
                            <option key={i} value={i}>{i}h</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-0.5">
                        <div className="text-[10px] text-muted-foreground px-1">Minutes</div>
                        <select
                          value={newDurationMins}
                          onChange={(e) => setNewDurationMins(Number(e.target.value))}
                          className="w-full px-3 py-2 neu-inset rounded-lg bg-transparent text-sm cursor-pointer"
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
              <Link to="/agent/recherche" search={{ dealId: id }} className="flex-1 min-w-[180px] flex items-center justify-center gap-2 py-3 rounded-xl neu-sm hover:neu-pressable text-sm font-medium">
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
                  <img src={p.imageUrls?.[0] || p.images?.[0]?.imageUrl || "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80"} alt={p.address} className="w-full h-32 object-cover rounded-lg mb-3" />
                  <div className="font-medium text-sm">{p.address}</div>
                  <div className="text-xs text-muted-foreground">{p.surfaceM2} m² · {p.numRooms} pcs</div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="font-bold text-sm">{p.price?.toLocaleString('en-US')} $</span>
                    <SoftBadge tone={p.isAvailable ? "success" : "info"}>{p.isAvailable ? "Disponible" : "Vendu"}</SoftBadge>
                  </div>
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
                      <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold px-1">Type</label>
                      <select 
                        value={newMeetingType} 
                        onChange={(e) => setNewMeetingType(e.target.value as MeetingType)}
                        className="w-full px-3 py-2 neu-inset rounded-lg bg-transparent text-sm cursor-pointer"
                      >
                        <option value="OFFICE_APPOINTMENT">RDV Agence</option>
                        <option value="PROPERTY_VISIT">Visite immobilière</option>
                        <option value="PHONE_CALL">Appel téléphonique</option>
                        <option value="CONTRACT_SIGNING">Signature de contrat</option>
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                       <div className="space-y-1">
                        <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold px-1">Date</label>
                        <input 
                          type="date" 
                          value={newMeetingDate} 
                          onChange={(e) => setNewMeetingDate(e.target.value)}
                          className="w-full px-2 py-2 neu-inset rounded-lg bg-transparent text-xs" 
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold px-1">Heure</label>
                        <input 
                          type="time" 
                          value={newMeetingTime} 
                          onChange={(e) => setNewMeetingTime(e.target.value)}
                          className="w-full px-2 py-2 neu-inset rounded-lg bg-transparent text-xs" 
                        />
                      </div>
                    </div>
                  </div>

                  {(newMeetingType === 'PROPERTY_VISIT' || newMeetingType === 'CONTRACT_SIGNING') && (
                    <div className="space-y-1 animate-in fade-in slide-in-from-top-1">
                      <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold px-1">Propriété liée</label>
                      <select 
                        value={newMeetingPropertyId} 
                        onChange={(e) => setNewMeetingPropertyId(e.target.value)}
                        className="w-full px-3 py-2 neu-inset rounded-lg bg-transparent text-sm cursor-pointer"
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
                  />

                  <div className="flex gap-2">
                    <button 
                      onClick={handleCreateMeeting} 
                      disabled={meetingMutation.isPending}
                      className="flex-1 py-2.5 rounded-lg bg-eerie text-ghost text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {meetingMutation.isPending && <Loader2 size={16} className="animate-spin" />}
                      Confirmer le RDV
                    </button>
                    <button onClick={() => setPlanningMeeting(false)} className="px-5 py-2.5 rounded-lg neu-sm text-sm">Annuler</button>
                  </div>
                </div>
              )}
            </NeuCard>

            <div className="space-y-3">
              {loadingMeetings ? (
                <div className="flex justify-center py-5"><Loader2 className="animate-spin text-muted-foreground" size={20} /></div>
              ) : meetings?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm italic">Aucun rendez-vous planifié.</div>
              ) : (
                meetings?.map((r) => (
                  <div key={r.idMeeting} className="flex items-center gap-4 p-3 rounded-lg neu-sm">
                    <div className={`p-2 rounded-lg ${r.status === 'COMPLETED' ? 'bg-honeydew/20 text-honeydew' : 'bg-vanilla/20 text-vanilla'}`}>
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
                    <SoftBadge tone={r.status === "COMPLETED" ? "success" : "warn"}>
                      {r.status === "COMPLETED" ? "Effectué" : "À venir"}
                    </SoftBadge>
                  </div>
                ))
              )}
            </div>
            <Link to="/agent/agenda" className="w-full mt-2 py-2 text-xs text-muted-foreground hover:text-eerie transition-colors flex items-center justify-center gap-1.5">
              Voir tout l'agenda <Eye size={12} />
            </Link>
          </div>
        )}

        {tab === "Contrats" && (
          <div className="space-y-4">
            <button
              onClick={() => setShowContractForm(true)}
              className="w-full py-3 rounded-xl bg-eerie text-ghost text-sm font-medium hover:opacity-90 flex items-center justify-center gap-2"
            >
              <Plus size={16} /> Nouveau contrat
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
                        Réf : MR-{new Date(c.createdAt || Date.now()).getFullYear()}-{(c.idContract?.substring(0, 4) || 'XXXX').toUpperCase()} · {((c.agreedPrice || 0) / 1_000_000).toFixed(2)}M MAD
                      </p>
                    </div>
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
                              {(p.amount || 0).toLocaleString("fr-MA")} MAD
                            </div>
                            {!p.isPaid && (
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
              const filename = f.filePath?.split(/[\\/]/).pop() || "Document";
              const displayName = filename.includes('_') ? filename.substring(filename.indexOf('_') + 1) : filename;
              return (
              <div
                key={i}
                className="flex items-center gap-2 p-2 rounded-lg neu-sm text-xs group"
              >
                <Paperclip size={13} className="text-muted-foreground shrink-0" />
                <span className="flex-1 truncate">
                  {displayName}
                  <div className="text-[10px] text-muted-foreground opacity-70 mt-0.5">{f.documentType || f.type || "Document"}</div>
                </span>
                <button
                  onClick={() => {
                    if (f.filePath) {
                      if (f.filePath.startsWith("http")) {
                        window.open(f.filePath, '_blank');
                      } else {
                        window.open(`http://localhost:8081/api/documents/file?path=${encodeURIComponent(f.filePath)}`, '_blank');
                      }
                    } else {
                      toast.error("Le lien vers ce document n'est pas disponible.");
                    }
                  }}
                  className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded flex items-center justify-center hover:bg-alice/50 transition-opacity"
                  aria-label="Voir"
                >
                  <Eye size={11} />
                </button>
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
            <select
              value={newDocType}
              onChange={(e) => setNewDocType(e.target.value)}
              className="w-full px-3 py-2 neu-inset rounded-lg bg-transparent text-sm cursor-pointer"
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
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full py-2.5 rounded-lg neu-sm hover:neu-pressable text-xs font-medium flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {uploading ? (
                <><Loader2 size={12} className="animate-spin" /> Upload…</>
              ) : (
                <><Upload size={12} /> Ajouter un document</>
              )}
            </button>
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
    </div>
  );
}
