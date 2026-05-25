import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { NeuCard } from "@/components/ui/neu-card";
import { Avatar, LeadScore, SoftBadge } from "@/components/ui/design-bits";
import {
  Phone, Mail, MapPin, Sparkles, RefreshCw, Plus, FileText, CalendarDays, Building2,
  MessageSquare, Send, FileSignature, X, Upload, Paperclip, Loader2, Eye, Clock,
} from "lucide-react";
import { toast } from "sonner";
import { ContractForm, ContractStatusTracker } from "@/components/contract/ContractForm";
import { getContractsByDeal, updateContractStatus } from "@/api/contractApi";
import { getPropertiesByDeal } from "@/api/propertyApi"; 
import { 
  fetchDossierDetail, 
  fetchInteractions, 
  logInteraction, 
  fetchDealMeetings, 
  createMeeting,
  type InteractionType,
  type MeetingType,
  type DossierDetail,
  type InteractionItem,
  type MeetingItem
} from "@/api/dossiersApi";

interface DossierSearch {
  id?: string;
}

export const Route = createFileRoute("/agent/dossier")({
  validateSearch: (search: Record<string, unknown>): DossierSearch => {
    return {
      id: search.id as string | undefined,
    };
  },
  component: DossierPage,
});

const tabs = ["Interactions", "Propriétés", "Rendez-vous", "Contrats"] as const;

const iconMap: Record<InteractionType, any> = {
  CALL: Phone,
  VISIT: MapPin,
  EMAIL: Mail,
  MEETING: CalendarDays,
  NOTE: FileText,
  SYSTEM: Sparkles,
};

const meetingIconMap: Record<string, any> = {
  PROPERTY_VISIT: Building2,
  PHONE_CALL: Phone,
  OFFICE_APPOINTMENT: MapPin,
  CONTRACT_SIGNING: FileSignature,
};

function DossierPage() {
  const { id } = Route.useSearch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const dossierId = id || "00000000-0000-0000-0000-000000000001";

  const [tab, setTab] = useState<typeof tabs[number]>("Interactions");
  const [logging, setLogging] = useState(false);
  const [planningMeeting, setPlanningMeeting] = useState(false);
  const [showContractForm, setShowContractForm] = useState(false);
  const [propDetail, setPropDetail] = useState<any | null>(null);

  // Interaction Form State
  const [newType, setNewType] = useState<InteractionType>("CALL");
  const [newDesc, setNewDesc] = useState("");
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newTime, setNewTime] = useState(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }));
  const [newDurationHrs, setNewDurationHrs] = useState(0);
  const [newDurationMins, setNewDurationMins] = useState(15);

  // Meeting Form State
  const [newMeetingType, setNewMeetingType] = useState<MeetingType>("OFFICE_APPOINTMENT");
  const [newMeetingDate, setNewMeetingDate] = useState("");
  const [newMeetingTime, setNewMeetingTime] = useState("");
  const [newMeetingPropertyId, setNewMeetingPropertyId] = useState("");
  const [newMeetingNotes, setNewMeetingNotes] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  // Queries
  const { data: dossier, isLoading: loadingDossier } = useQuery({
    queryKey: ["dossier", dossierId],
    queryFn: () => fetchDossierDetail(dossierId),
  });

  const { data: interactions, isLoading: loadingInteractions } = useQuery({
    queryKey: ["interactions", dossierId],
    queryFn: () => fetchInteractions(dossierId),
  });

  const { data: meetings, isLoading: loadingMeetings } = useQuery({
    queryKey: ["meetings", dossierId],
    queryFn: () => fetchDealMeetings(dossierId),
  });

  const { data: linkedProperties, isLoading: loadingProps } = useQuery({
    queryKey: ["linkedProperties", dossierId],
    queryFn: () => getPropertiesByDeal(dossierId),
  });

  const { data: contracts, isLoading: loadingContracts } = useQuery({
    queryKey: ["contracts", dossierId],
    queryFn: () => getContractsByDeal(dossierId),
  });

  const { data: docs, isLoading: loadingDocs } = useQuery({
    queryKey: ["documents", dossierId],
    queryFn: () => fetch(`${import.meta.env.VITE_API_BASE_URL || ""}/api/documents/deal/${dossierId}`, { credentials: 'include' }).then(res => res.json()),
  });

  // Mutations
  const interactionMutation = useMutation({
    mutationFn: (req: any) => logInteraction(req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["interactions", dossierId] });
      setLogging(false);
      setNewDesc("");
      toast.success("Interaction enregistrée");
    },
    onError: (e: any) => toast.error("Erreur : " + e.message),
  });

  const meetingMutation = useMutation({
    mutationFn: (req: any) => createMeeting(req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meetings", dossierId] });
      setPlanningMeeting(false);
      toast.success("Rendez-vous planifié");
    },
    onError: (e: any) => toast.error("Erreur : " + e.message),
  });

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || ""}/api/documents/upload`, {
        method: "POST",
        body: formData,
        credentials: "include"
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents", dossierId] });
      toast.success("Document uploadé");
    },
    onError: (e: any) => toast.error("Upload échoué : " + e.message),
    onSettled: () => setUploading(false),
  });

  const contractStatusMutation = useMutation({
    mutationFn: ({ contractId, status }: { contractId: string, status: string }) => updateContractStatus(contractId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contracts", dossierId] });
      toast.success("Statut mis à jour");
    },
    onError: (e: any) => toast.error("Erreur : " + e.message),
  });

  // Handlers
  const handleLogInteraction = () => {
    if (!newDesc.trim()) return;
    interactionMutation.mutate({
      idDeal: dossierId,
      type: newType,
      description: newDesc,
      occurredAt: `${newDate}T${newTime}:00`,
      durationMinutes: newDurationHrs * 60 + newDurationMins,
    });
  };

  const handleCreateMeeting = () => {
    if (!newMeetingDate || !newMeetingTime) {
      toast.error("Veuillez sélectionner une date et une heure");
      return;
    }
    meetingMutation.mutate({
      idDeal: dossierId,
      type: newMeetingType,
      scheduledAt: `${newMeetingDate}T${newMeetingTime}:00`,
      notes: newMeetingNotes,
      propertyAddress: newMeetingPropertyId || undefined,
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("dealId", dossierId);
    formData.append("file", files[0]);
    formData.append("type", "OTHER");
    uploadMutation.mutate(formData);
    e.target.value = "";
  };

  if (loadingDossier) {
    return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="animate-spin text-eerie" size={40} /></div>;
  }

  if (!dossier) {
    return <div className="text-center py-20">Dossier non trouvé. <Link to="/agent/clients" className="text-alice underline">Retour</Link></div>;
  }

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
            <LeadScore score={dossier.aiLeadScore} size={120} />
          </div>
          <p className="text-xs italic text-muted-foreground">
            {dossier.aiScoreExplanation || "Analyse de score en cours..."}
          </p>
        </NeuCard>
      </div>

      {/* Center — activity */}
      <div className="col-span-12 lg:col-span-6 space-y-5">
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
                  </div>

                  <textarea
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    rows={2}
                    placeholder="Décrivez l'échange…"
                    className="w-full px-4 py-3 neu-inset rounded-lg bg-transparent focus:outline-none text-sm"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleLogInteraction}
                      disabled={interactionMutation.isPending}
                      className="flex-1 py-2.5 rounded-lg bg-eerie text-ghost text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {interactionMutation.isPending && <Loader2 size={16} className="animate-spin" />}
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
                <div className="text-center py-4 text-sm text-muted-foreground">Chargement...</div>
              ) : interactions?.length === 0 ? (
                <div className="text-center py-4 text-sm text-muted-foreground italic">Aucune interaction.</div>
              ) : (
                interactions?.map((it) => {
                  const Icon = iconMap[it.type] || FileText;
                  return (
                    <div key={it.idInteraction} className="relative mb-4">
                      <div className="absolute -left-8 top-3 w-6 h-6 rounded-full bg-honeydew flex items-center justify-center ring-4 ring-ghost border border-honeydew/20">
                        <Icon size={12} className="text-eerie" />
                      </div>
                      <NeuCard size="sm">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <span className="font-semibold text-sm">{it.type}</span>
                          <span className="text-xs text-muted-foreground">{new Date(it.occurredAt).toLocaleString()}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1.5">{it.description}</p>
                        <div className="mt-2 flex items-center gap-1.5 opacity-50 text-[10px]">
                           <span className="font-medium">{it.agentName}</span>
                        </div>
                      </NeuCard>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}

        {tab === "Propriétés" && (
          <>
            <div className="flex gap-3 flex-wrap">
              <Link to="/agent/recherche" search={{ dealId: dossierId }} className="flex-1 min-w-[180px] flex items-center justify-center gap-2 py-3 rounded-xl neu-sm hover:neu-pressable text-sm font-medium">
                <Building2 size={16} /> Rechercher biens
              </Link>
              <button
                onClick={() => queryClient.invalidateQueries({ queryKey: ["linkedProperties", dossierId] })}
                className="flex-1 min-w-[180px] flex items-center justify-center gap-2 py-3 rounded-xl bg-vanilla text-eerie text-sm font-medium hover:opacity-90"
              >
                <Sparkles size={16} /> Rafraîchir
              </button>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {loadingProps ? <Loader2 className="animate-spin col-span-2 mx-auto mt-10" /> : 
               linkedProperties?.map((p: any) => (
                <NeuCard key={p.idProperty} size="sm" pressable onClick={() => setPropDetail(p)}>
                  <img src={p.imageUrls?.[0] || "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80"} alt={p.address} className="w-full h-32 object-cover rounded-lg mb-3" />
                  <div className="font-medium text-sm">{p.address}</div>
                  <div className="text-xs text-muted-foreground">{p.surfaceM2} m² · {p.numRooms} pcs</div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="font-bold text-sm">{p.price?.toLocaleString('fr-MA')} MAD</span>
                    <SoftBadge tone={p.isAvailable ? "success" : "info"}>{p.isAvailable ? "Disponible" : "Vendu"}</SoftBadge>
                  </div>
                </NeuCard>
              ))}
              {linkedProperties?.length === 0 && (
                <p className="col-span-2 text-center py-10 text-xs text-muted-foreground">Aucune propriété liée.</p>
              )}
            </div>
          </>
        )}

        {tab === "Rendez-vous" && (
          <div className="space-y-4">
            <NeuCard>
              {!planningMeeting ? (
                <button origin-label="btndate"
                  onClick={() => setPlanningMeeting(true)}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-eerie text-ghost text-sm font-medium hover:opacity-90"
                >
                  <Plus size={16} /> Planifier un rendez-vous
                </button>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold px-1 uppercase">Type</label>
                      <select
                        value={newMeetingType}
                        onChange={(e) => setNewMeetingType(e.target.value as MeetingType)}
                        className="w-full px-3 py-2 neu-inset rounded-lg bg-transparent text-sm"
                      >
                        <option value="OFFICE_APPOINTMENT">RDV Agence</option>
                        <option value="PROPERTY_VISIT">Visite immobilière</option>
                        <option value="PHONE_CALL">Appel téléphonique</option>
                        <option value="CONTRACT_SIGNING">Signature de contrat</option>
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold px-1 uppercase">Date</label>
                        <input type="date" value={newMeetingDate} onChange={(e) => setNewMeetingDate(e.target.value)} className="w-full px-2 py-2 neu-inset rounded-lg bg-transparent text-xs" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold px-1 uppercase">Heure</label>
                        <input type="time" value={newMeetingTime} onChange={(e) => setNewMeetingTime(e.target.value)} className="w-full px-2 py-2 neu-inset rounded-lg bg-transparent text-xs" />
                      </div>
                    </div>
                  </div>
                  <textarea
                    value={newMeetingNotes}
                    onChange={(e) => setNewMeetingNotes(e.target.value)}
                    rows={2}
                    placeholder="Notes…"
                    className="w-full px-4 py-3 neu-inset rounded-lg bg-transparent text-sm"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleCreateMeeting}
                      disabled={meetingMutation.isPending}
                      className="flex-1 py-2.5 rounded-lg bg-eerie text-ghost text-sm font-medium flex items-center justify-center"
                    >
                      {meetingMutation.isPending ? <Loader2 className="animate-spin" size={16} /> : "Confirmer"}
                    </button>
                    <button onClick={() => setPlanningMeeting(false)} className="px-5 py-2.5 rounded-lg neu-sm text-sm">Annuler</button>
                  </div>
                </div>
              )}
            </NeuCard>

            <div className="space-y-3">
              {loadingMeetings ? <Loader2 className="animate-spin mx-auto" /> : 
                meetings?.map((r) => (
                  <div key={r.idMeeting} className="flex items-center gap-4 p-3 rounded-lg neu-sm">
                    <div className="p-2 rounded-lg bg-vanilla/20 text-vanilla">
                      <CalendarDays size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{r.type}</div>
                      <div className="text-xs text-muted-foreground">{new Date(r.scheduledAt).toLocaleString()}</div>
                    </div>
                    <SoftBadge tone={r.status === "COMPLETED" ? "success" : "warn"}>{r.status}</SoftBadge>
                  </div>
                ))
              }
            </div>
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
            <div className="space-y-4">
              {loadingContracts ? <Loader2 className="animate-spin mx-auto" /> : 
                contracts?.map((c: any) => (
                  <NeuCard key={c.idContract}>
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold flex items-center gap-2">
                          <FileSignature size={16} /> Contrat {c.status}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {c.agreedPrice?.toLocaleString('fr-MA')} MAD
                        </p>
                      </div>
                    </div>
                    <ContractStatusTracker
                      contract={c}
                      onStatusChange={(status: string) => contractStatusMutation.mutate({ contractId: c.idContract, status })}
                    />
                  </NeuCard>
                ))
              }
            </div>
          </div>
        )}
      </div>

      {/* Right — IA & Docs */}
      <div className="col-span-12 lg:col-span-3 space-y-5">
        <NeuCard className="bg-alice/40 border border-alice">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs uppercase tracking-widest text-muted-foreground flex items-center gap-1.5"><Sparkles size={12} /> Résumé IA</span>
          </div>
          <p className="text-sm leading-relaxed">{dossier.aiSummary || "En cours..."}</p>
        </NeuCard>

        <NeuCard>
          <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Action recommandée</div>
          <SoftBadge tone="warn" className="mb-3">Priorité {dossier.isUrgent ? 'Urgente' : 'Standard'}</SoftBadge>
          <p className="text-sm font-medium">{dossier.aiRecommendedAction}</p>
        </NeuCard>

        <NeuCard>
          <h3 className="font-semibold flex items-center gap-2 text-sm mb-4">
            <FileText size={14} /> Documents ({docs?.length || 0})
          </h3>
          <div className="space-y-2">
            {loadingDocs ? <Loader2 className="animate-spin mx-auto" /> : 
              docs?.map((f: any, i: number) => (
                <div key={i} className="flex items-center gap-2 p-2 rounded-lg neu-sm text-xs group">
                  <Paperclip size={13} className="text-muted-foreground shrink-0" />
                  <span className="flex-1 truncate">{f.filePath?.split(/[\\/]/).pop().substring(37)}</span>
                  <button onClick={() => toast(`Aperçu : ${f.filePath}`)} className="opacity-0 group-hover:opacity-100"><Eye size={11} /></button>
                </div>
              ))
            }
          </div>
          <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full mt-4 py-2.5 rounded-lg neu-sm hover:neu-pressable text-xs font-medium flex items-center justify-center gap-2"
          >
            {uploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />} Ajouter
          </button>
        </NeuCard>

        <NeuCard className="bg-vanilla/40">
          <h3 className="font-semibold text-sm mb-2 flex items-center gap-2"><Send size={14} /> Suivi Dossier</h3>
          <button onClick={() => toast.info("Email copié")} className="w-full py-2.5 rounded-lg bg-eerie text-ghost text-xs font-medium">Générer email</button>
        </NeuCard>
      </div>

      {propDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setPropDetail(null)}>
          <div className="absolute inset-0 bg-eerie/60 backdrop-blur-sm" />
          <div className="relative bg-ghost rounded-3xl max-w-md w-full shadow-2xl overflow-hidden p-6" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setPropDetail(null)} className="absolute top-4 right-4"><X size={16} /></button>
            <h3 className="font-bold text-lg">{propDetail.title}</h3>
            <p className="text-sm text-muted-foreground">{propDetail.address}</p>
            <div className="mt-4 flex justify-between">
              <span className="font-bold">{propDetail.price?.toLocaleString()} MAD</span>
              <span>{propDetail.surfaceM2} m²</span>
            </div>
            <button onClick={() => setPropDetail(null)} className="w-full mt-6 py-2.5 rounded-xl bg-eerie text-ghost">Fermer</button>
          </div>
        </div>
      )}

      {showContractForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-eerie/60 backdrop-blur-sm" onClick={() => setShowContractForm(false)} />
          <div className="relative bg-ghost rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto p-7 shadow-2xl">
            <ContractForm dealId={dossierId} onClose={() => setShowContractForm(false)} onCreated={() => queryClient.invalidateQueries({ queryKey: ["contracts", dossierId] })} />
          </div>
        </div>
      )}
    </div>
  );
}


