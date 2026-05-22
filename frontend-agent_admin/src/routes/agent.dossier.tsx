import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { NeuCard } from "@/components/ui/neu-card";
import { Avatar, LeadScore, SoftBadge, StageBadge } from "@/components/ui/design-bits";
import { clients, properties, type Property } from "@/lib/mock-data";
import {
  Phone, Mail, MapPin, Sparkles, RefreshCw, Plus, FileText, CalendarDays, Building2,
  MessageSquare, Send, FileSignature, Check, X,
} from "lucide-react";
import { toast } from "sonner";

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

function DossierPage() {
  const [tab, setTab] = useState<typeof tabs[number]>("Interactions");
  const [interactions, setInteractions] = useState(initialInteractions);
  const [logging, setLogging] = useState(false);
  const [contractOpen, setContractOpen] = useState(false);
  const [propDetail, setPropDetail] = useState<Property | null>(null);
  const [newType, setNewType] = useState("Appel");
  const [newDesc, setNewDesc] = useState("");

  const logInteraction = () => {
    if (!newDesc.trim()) return;
    const iconMap: Record<string, typeof Phone> = { Appel: Phone, Visite: MapPin, Email: Mail, Note: FileText };
    setInteractions((prev) => [
      { type: newType, icon: iconMap[newType] || FileText, date: "à l'instant", desc: newDesc },
      ...prev,
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
              {properties.slice(0, 4).map((p) => (
                <NeuCard key={p.id} size="sm" pressable onClick={() => setPropDetail(p)}>
                  <img src={p.image} alt={p.address} className="w-full h-32 object-cover rounded-lg mb-3" />
                  <div className="font-medium text-sm">{p.address}</div>
                  <div className="text-xs text-muted-foreground">{p.surface} · {p.rooms} pcs</div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="font-bold text-sm">{p.price}</span>
                    <SoftBadge tone={p.status === "Visitée" ? "success" : "info"}>{p.status}</SoftBadge>
                  </div>
                </NeuCard>
              ))}
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
          <NeuCard>
            <h3 className="font-semibold flex items-center gap-2 mb-5"><FileSignature size={16} /> Contrat en cours</h3>
            <div className="flex items-center overflow-x-auto soft-scroll">
              {["Brouillon", "Envoyé", "Reçu signé", "Archivé"].map((s, i) => (
                <div key={s} className="flex-1 min-w-[80px] flex items-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${i <= 1 ? "bg-honeydew" : "neu-inset"}`}>
                      {i <= 1 ? <Check size={16} /> : <span className="text-sm">{i + 1}</span>}
                    </div>
                    <span className="text-xs text-center">{s}</span>
                  </div>
                  {i < 3 && <div className={`flex-1 h-px ${i < 1 ? "bg-honeydew" : "bg-border"}`} />}
                </div>
              ))}
            </div>
            <button
              onClick={() => setContractOpen(true)}
              className="w-full mt-6 py-2.5 rounded-lg bg-eerie text-ghost text-sm font-medium hover:opacity-90"
            >
              Voir le contrat
            </button>
          </NeuCard>
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
          <h3 className="font-semibold flex items-center gap-2 text-sm mb-4"><FileText size={14} /> Documents</h3>
          <div className="space-y-2">
            {["CNI_recto.pdf", "Justif_revenus.pdf", "Pré-accord_banque.pdf"].map((f) => (
              <button
                key={f}
                onClick={() => toast(`Aperçu de ${f}`)}
                className="w-full flex items-center gap-2 p-2 rounded-lg neu-sm hover:neu-pressable text-xs"
              >
                <FileText size={14} /> <span className="flex-1 truncate text-left">{f}</span>
              </button>
            ))}
          </div>
          <button
            onClick={() => toast("Assistant IA documents — démo")}
            className="w-full mt-4 py-2.5 rounded-lg neu-sm hover:neu-pressable text-xs font-medium flex items-center justify-center gap-2"
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

      {/* Contract modal */}
      {contractOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setContractOpen(false)}>
          <div className="absolute inset-0 bg-eerie/60 backdrop-blur-sm" />
          <div className="relative bg-ghost rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto soft-scroll p-7 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setContractOpen(false)} className="absolute top-4 right-4 w-9 h-9 rounded-full neu-sm flex items-center justify-center" aria-label="Fermer">
              <X size={16} />
            </button>
            <SoftBadge tone="warn">Envoyé · en attente signature</SoftBadge>
            <h2 className="text-2xl font-bold mt-3">Mandat de recherche — Karim Benchekroun</h2>
            <p className="text-xs text-muted-foreground mt-1">Référence : MR-2025-0142</p>
            <div className="mt-5 space-y-3 text-sm text-muted-foreground leading-relaxed">
              <p>
                Le présent mandat est conclu entre M. Karim Benchekroun (le « Mandant ») et l'agence
                SmartEstateHub, représentée par Sara El Idrissi. Le Mandant confie à l'Agence la mission
                de recherche d'un bien immobilier répondant aux critères suivants :
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Type : appartement T3/T4</li>
                <li>Zone : Anfa, Bourgogne (Casablanca)</li>
                <li>Budget : jusqu'à 2.4M MAD</li>
                <li>Durée du mandat : 6 mois renouvelables</li>
              </ul>
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              <button onClick={() => { toast.success("Contrat envoyé pour signature"); setContractOpen(false); }} className="flex-1 min-w-[140px] py-2.5 rounded-xl bg-eerie text-ghost text-sm font-medium">Relancer signature</button>
              <button onClick={() => toast("Téléchargement PDF…")} className="px-5 py-2.5 rounded-xl neu-sm text-sm font-medium">Télécharger PDF</button>
            </div>
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
              <h3 className="font-bold text-lg">{propDetail.address}</h3>
              <div className="text-sm text-muted-foreground">{propDetail.city} · {propDetail.floor}</div>
              <div className="flex items-center justify-between">
                <span className="text-xl font-bold">{propDetail.price}</span>
                <SoftBadge tone="info">{propDetail.surface}</SoftBadge>
              </div>
              <button onClick={() => { toast.success("Bien proposé au client"); setPropDetail(null); }} className="w-full py-2.5 rounded-xl bg-eerie text-ghost text-sm font-medium">Proposer au client</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
