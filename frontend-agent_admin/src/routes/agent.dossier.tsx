import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState, useEffect } from "react";
import { NeuCard } from "@/components/ui/neu-card";
import { Avatar, LeadScore, SoftBadge } from "@/components/ui/design-bits";
import { clients, properties, type Property } from "@/lib/mock-data";
import {
  Phone, Mail, MapPin, Sparkles, RefreshCw, Plus, FileText, CalendarDays, Building2,
  MessageSquare, Send, FileSignature, X, Upload, Paperclip, Loader2, Eye,
} from "lucide-react";
import { toast } from "sonner";
import { ContractForm, ContractStatusTracker } from "@/components/contract/ContractForm";
import { getContractsByDeal, updateContractStatus } from "@/api/contractApi";
import { getPropertiesByDeal } from "@/api/propertyApi"; 


export const Route = createFileRoute("/agent/dossier")({
  component: DossierPage,
});

const client = clients[0];

const initialInteractions = [
  { type: "Visite", icon: MapPin, date: "16 nov. · 15:00", duration: "45 min", desc: "Visite appartement Anfa, très intéressé. Demande infos sur charges." },
  { type: "Appel", icon: Phone, date: "14 nov. · 11:20", duration: "12 min", desc: "Discussion budget et critères. Validation zone Anfa/Bourgogne." },
  { type: "Email", icon: Mail, date: "12 nov.", desc: "Envoi sélection 5 biens correspondant aux critères." },
  { type: "Note", icon: FileText, date: "10 nov.", desc: "Premier contact via formulaire site. Couple, 2 enfants, recherche T3/T4." },
];

const tabs = ["Interactions", "Propriétés", "Rendez-vous", "Contrats"] as const;

/* Mock deal ID — en production, récupéré depuis le dossier client */
const MOCK_DEAL_ID = "00000000-0000-0000-0000-000000000001";

/* Mock contrat existant pour la démo */
const mockContract = {
  idContract: "00000000-0000-0000-0000-000000000099",
  status: "SENT",
  agreedPrice: 2400000,
  depositAmount: 100000,
  payments: [
    { idPayment: "p1", label: "1er versement", amount: 700000, dueDate: "2025-12-01", isPaid: true },
    { idPayment: "p2", label: "2ème versement", amount: 800000, dueDate: "2026-02-01", isPaid: false },
    { idPayment: "p3", label: "Solde", amount: 800000, dueDate: "2026-04-01", isPaid: false },
  ],
};

function DossierPage() {
  const [tab, setTab] = useState<typeof tabs[number]>("Interactions");
  const [interactions, setInteractions] = useState(initialInteractions);
  const [logging, setLogging] = useState(false);
  const [showContractForm, setShowContractForm] = useState(false);
  const [propDetail, setPropDetail] = useState<any | null>(null);
  const [newType, setNewType] = useState("Appel");
  const [newDesc, setNewDesc] = useState("");
  const [contract, setContract] = useState<any>(null);
  const [linkedProperties, setLinkedProperties] = useState<any[]>([]);
  /* documents */
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [docs, setDocs] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchDossierData = async () => {
    setLoading(true);
    try {
      const [contracts, props, documents] = await Promise.all([
        getContractsByDeal(MOCK_DEAL_ID),
        getPropertiesByDeal(MOCK_DEAL_ID),
        fetch(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:8080"}/api/documents/deal/${MOCK_DEAL_ID}`, { credentials: 'include' }).then(res => res.json())
      ]);
      setContract(contracts?.[0] || null);
      setLinkedProperties(props || []);
      setDocs(documents || []);
    } catch (e: any) {
      toast.error("Erreur de chargement : " + e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDossierData();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    
    setUploading(true);
    const formData = new FormData();
    formData.append("dealId", MOCK_DEAL_ID);
    formData.append("file", files[0]);
    formData.append("type", "OTHER");

    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:8080"}/api/documents/upload`, {
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

  const handleStatusChange = async (newStatus: string) => {
    if (!contract) return;
    try {
      await updateContractStatus(contract.idContract, newStatus);
      setContract((c: any) => ({ ...c, status: newStatus }));
      toast.success(`Statut → ${newStatus}`);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const logInteraction = () => {
    if (!newDesc.trim()) return;
    const iconMap: Record<string, typeof Phone> = { Appel: Phone, Visite: MapPin, Email: Mail, Note: FileText };
    setInteractions((prev) => [
      { type: newType, icon: iconMap[newType] || FileText, date: "à l'instant", desc: newDesc as any },
      ...prev
    ]);
    setNewDesc("");
    setLogging(false);
    toast.success("Interaction loggée");
  };


  return (
    <div className="grid grid-cols-12 gap-5 md:gap-6 max-w-[1500px]">
      {/* Left — profile */}
      <div className="col-span-12 lg:col-span-3 space-y-5">
        <NeuCard className="text-center">
          <Avatar name={client.name} size={88} />
          <h2 className="font-bold text-lg mt-3">{client.name}</h2>
          <SoftBadge tone="info" className="mt-1">{client.type}</SoftBadge>
          <div className="text-left mt-5 space-y-2 text-sm">
            <a href={`tel:${client.phone}`} className="flex items-center gap-2 hover:underline">
              <Phone size={14} /> {client.phone}
            </a>
            <a href={`mailto:${client.email}`} className="flex items-center gap-2 hover:underline">
              <Mail size={14} /> {client.email}
            </a>
          </div>
          <div className="mt-5 pt-5 border-t border-border space-y-3 text-left">
            <div>
              <div className="text-xs text-muted-foreground">Budget</div>
              <div className="text-xl font-bold">{client.budget}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Source</div>
              <div className="text-sm font-medium">{client.source}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Agent assigné</div>
              <div className="flex items-center gap-2 mt-1">
                <Avatar name={client.agent} size={24} />
                <span className="text-sm">{client.agent}</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => toast("Édition du profil — démo statique")}
            className="w-full mt-5 py-2.5 rounded-lg neu-sm hover:neu-pressable text-sm font-medium"
          >
            Modifier le profil
          </button>
        </NeuCard>

        <NeuCard className="text-center bg-alice/40">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Lead Score IA</div>
          <div className="my-4 flex justify-center">
            <LeadScore score={client.score} size={120} />
          </div>
          <p className="text-xs italic text-muted-foreground">
            Engagement élevé : visites régulières, budget confirmé, décision attendue sous 2 semaines.
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
                <div className="space-y-3">
                  <div className="flex gap-2">
                    {["Appel", "Visite", "Email", "Note"].map((t) => (
                      <button
                        key={t}
                        onClick={() => setNewType(t)}
                        className={`flex-1 py-2 rounded-lg text-xs font-medium ${newType === t ? "neu-inset" : "neu-sm"}`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    rows={3}
                    placeholder="Décrivez l'échange…"
                    className="w-full px-4 py-3 neu-inset rounded-lg bg-transparent focus:outline-none text-sm"
                  />
                  <div className="flex gap-2">
                    <button onClick={logInteraction} className="flex-1 py-2.5 rounded-lg bg-eerie text-ghost text-sm font-medium">Sauvegarder</button>
                    <button onClick={() => setLogging(false)} className="px-5 py-2.5 rounded-lg neu-sm text-sm">Annuler</button>
                  </div>
                </div>
              )}
            </NeuCard>
            <div className="relative pl-8">
              <div className="absolute left-3 top-2 bottom-2 w-px bg-border" />
              {interactions.map((it, i) => {
                const Icon = it.icon;
                return (
                  <div key={i} className="relative mb-4">
                    <div className="absolute -left-8 top-3 w-6 h-6 rounded-full bg-honeydew flex items-center justify-center ring-4 ring-ghost">
                      <Icon size={12} />
                    </div>
                    <NeuCard size="sm">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <span className="font-semibold text-sm">{it.type}</span>
                        <span className="text-xs text-muted-foreground">{it.date}{it.duration ? ` · ${it.duration}` : ""}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1.5">{it.desc}</p>
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
              <Link to="/agent/recherche" className="flex-1 min-w-[180px] flex items-center justify-center gap-2 py-3 rounded-xl neu-sm hover:neu-pressable text-sm font-medium">
                <Building2 size={16} /> Rechercher biens
              </Link>
              <button
                onClick={() => toast.success("3 nouvelles recommandations IA générées")}
                className="flex-1 min-w-[180px] flex items-center justify-center gap-2 py-3 rounded-xl bg-vanilla text-eerie text-sm font-medium hover:opacity-90"
              >
                <Sparkles size={16} /> Recommandation IA
              </button>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {linkedProperties.map((p) => (
                <NeuCard key={p.idProperty} size="sm" pressable onClick={() => setPropDetail(p)}>
                  <img src={p.images?.[0]?.imageUrl || "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80"} alt={p.address} className="w-full h-32 object-cover rounded-lg mb-3" />
                  <div className="font-medium text-sm">{p.address}</div>
                  <div className="text-xs text-muted-foreground">{p.surfaceM2} m² · {p.numRooms} pcs</div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="font-bold text-sm">{p.price.toLocaleString('fr-MA')} MAD</span>
                    <SoftBadge tone={p.isAvailable ? "success" : "info"}>{p.isAvailable ? "Disponible" : "Vendu"}</SoftBadge>
                  </div>
                </NeuCard>
              ))}
              {linkedProperties.length === 0 && (
                <p className="col-span-2 text-center py-10 text-xs text-muted-foreground">Aucune propriété liée à ce dossier.</p>
              )}
            </div>

          </>
        )}

        {tab === "Rendez-vous" && (
          <NeuCard>
            <div className="space-y-3">
              {[
                { d: "21 nov. · 10:00", t: "Visite — Bois de Boulogne", s: "À venir" },
                { d: "16 nov. · 15:00", t: "Visite — Anfa", s: "Effectué" },
                { d: "08 nov. · 11:00", t: "Réunion conseil", s: "Effectué" },
              ].map((r, i) => (
                <div key={i} className="flex items-center gap-4 p-3 rounded-lg neu-sm">
                  <CalendarDays size={18} className="text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{r.t}</div>
                    <div className="text-xs text-muted-foreground">{r.d}</div>
                  </div>
                  <SoftBadge tone={r.s === "À venir" ? "warn" : "success"}>{r.s}</SoftBadge>
                </div>
              ))}
            </div>
            <Link to="/agent/agenda" className="w-full mt-4 py-2.5 rounded-lg neu-sm hover:neu-pressable text-sm font-medium flex items-center justify-center gap-2">
              <Plus size={14} /> Planifier RDV
            </Link>
          </NeuCard>
        )}

        {tab === "Contrats" && (
          <div className="space-y-4">
            {/* Bouton nouveau contrat */}
            <button
              onClick={() => setShowContractForm(true)}
              className="w-full py-3 rounded-xl bg-eerie text-ghost text-sm font-medium hover:opacity-90 flex items-center justify-center gap-2"
            >
              <Plus size={16} /> Nouveau contrat
            </button>

            {/* Contrat existant */}
            {contract && (
              <NeuCard>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold flex items-center gap-2">
                      <FileSignature size={16} /> Contrat en cours
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Réf : MR-2025-0142 · {(contract.agreedPrice / 1_000_000).toFixed(2)}M MAD
                    </p>
                  </div>
                </div>

                {/* Tracker statut */}
                <ContractStatusTracker
                  contract={contract}
                  onStatusChange={handleStatusChange}
                />

                {/* Calendrier de paiement */}
                {contract.payments && contract.payments.length > 0 && (
                  <div className="mt-5">
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                      Calendrier de paiement
                    </p>
                    <div className="space-y-2">
                      {contract.payments.map((p: any) => (
                        <div
                          key={p.idPayment}
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
                            <div className="text-sm font-medium">{p.label}</div>
                            <div className="text-xs text-muted-foreground">{p.dueDate}</div>
                          </div>
                          <div className="text-sm font-bold shrink-0">
                            {p.amount.toLocaleString("fr-MA")} MAD
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </NeuCard>
            )}
          </div>
        )}
      </div>

      {/* Right — IA */}
      <div className="col-span-12 lg:col-span-3 space-y-5">
        <NeuCard className="bg-alice/40">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs uppercase tracking-widest text-muted-foreground flex items-center gap-1.5"><Sparkles size={12} /> Résumé IA</span>
            <button
              onClick={() => toast.success("Résumé régénéré")}
              className="w-7 h-7 rounded-lg neu-sm flex items-center justify-center"
              aria-label="Régénérer"
            >
              <RefreshCw size={12} />
            </button>
          </div>
          <p className="text-sm leading-relaxed">
            Acheteur sérieux, 2.4M MAD, recherche T3/T4 à Anfa. A déjà visité 2 biens, retour positif.
            Décision probable sous 15 jours. Recommandation : maintenir le rythme de propositions.
          </p>
        </NeuCard>

        <NeuCard>
          <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Action recommandée</div>
          <SoftBadge tone="warn" className="mb-3">Priorité haute</SoftBadge>
          <p className="text-sm font-medium">{client.recommendation}</p>
        </NeuCard>

        <NeuCard>
          <h3 className="font-semibold flex items-center gap-2 text-sm mb-4">
            <FileText size={14} /> Documents ({docs.length})
          </h3>
          <div className="space-y-2">
            {docs.map((f, i) => (
              <div
                key={i}
                className="flex items-center gap-2 p-2 rounded-lg neu-sm text-xs group"
              >
                <Paperclip size={13} className="text-muted-foreground shrink-0" />
                <span className="flex-1 truncate">{f.filePath.split(/[\\/]/).pop().substring(37)}</span>
                <button
                  onClick={() => toast(`Aperçu : ${f.filePath}`)}
                  className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded flex items-center justify-center hover:bg-alice/50 transition-opacity"
                  aria-label="Voir"
                >
                  <Eye size={11} />
                </button>
              </div>
            ))}
            {docs.length === 0 && (
                <p className="text-center py-4 text-[10px] text-muted-foreground">Aucun document.</p>
            )}
          </div>


          {/* Upload */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            className="hidden"
            onChange={handleFileUpload}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full mt-4 py-2.5 rounded-lg neu-sm hover:neu-pressable text-xs font-medium flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {uploading ? (
              <><Loader2 size={12} className="animate-spin" /> Upload…</>
            ) : (
              <><Upload size={12} /> Ajouter un document</>
            )}
          </button>

          <button
            onClick={() => toast("Assistant IA documents — démo")}
            className="w-full mt-2 py-2.5 rounded-lg bg-alice/40 text-xs font-medium flex items-center justify-center gap-2 hover:bg-alice/60 transition-colors"
          >
            <MessageSquare size={12} /> Poser une question sur les docs
          </button>
        </NeuCard>

        <NeuCard className="bg-vanilla/40">
          <h3 className="font-semibold text-sm mb-2 flex items-center gap-2"><Send size={14} /> Email de suivi IA</h3>
          <p className="text-xs text-muted-foreground mb-3">Générer un draft personnalisé prêt à envoyer.</p>
          <button
            onClick={() => toast.success("Brouillon email généré — copié dans la boîte d'envoi")}
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
              dealId={MOCK_DEAL_ID}
              onClose={() => setShowContractForm(false)}
              onCreated={(c) => {
                setContract(c);
                setTab("Contrats");
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
            <img src={propDetail.image} alt={propDetail.address} className="w-full h-48 object-cover" />
            <button onClick={() => setPropDetail(null)} className="absolute top-4 right-4 w-9 h-9 rounded-full glass flex items-center justify-center" aria-label="Fermer"><X size={16} /></button>
            <div className="p-6 space-y-3">
              <h3 className="font-bold text-lg">{propDetail.title || propDetail.address}</h3>
              <div className="text-sm text-muted-foreground">{propDetail.city} · {propDetail.surfaceM2} m²</div>
              <div className="flex items-center justify-between">
                <span className="text-xl font-bold">{propDetail.price?.toLocaleString('fr-MA')} MAD</span>
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
