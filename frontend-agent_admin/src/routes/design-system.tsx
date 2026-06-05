import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { NeuCard } from "@/components/ui/neu-card";
import { Avatar, LeadScore, SoftBadge, StageBadge } from "@/components/ui/design-bits";
import {
  ArrowLeft, Building2, Bell, Check, X, Clock, Search, Upload, Loader2, Plus, ChevronRight,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/design-system")({
  component: DesignSystem,
});

const colors = [
  { name: "Alice Blue", token: "--alice", hex: "#D8DFE9", cls: "bg-alice" },
  { name: "Honeydew", token: "--honeydew", hex: "#CFDECA", cls: "bg-honeydew" },
  { name: "Vanilla", token: "--vanilla", hex: "#EFF0A3", cls: "bg-vanilla" },
  { name: "Eerie Black", token: "--eerie", hex: "#212121", cls: "bg-eerie" },
  { name: "Ghost White", token: "--ghost", hex: "#F6F5FA", cls: "bg-ghost border border-border" },
];

const typeScale = [
  { name: "Display", cls: "text-5xl md:text-6xl font-bold tracking-tight", sample: "Aa", note: "Hero · 48–60px" },
  { name: "H1", cls: "text-3xl md:text-4xl font-bold", sample: "Titre de page", note: "30–36px" },
  { name: "H2", cls: "text-2xl font-bold", sample: "Section principale", note: "24px" },
  { name: "H3", cls: "text-lg font-semibold", sample: "Sous-section", note: "18px" },
  { name: "Body", cls: "text-sm", sample: "Texte courant du paragraphe.", note: "14px" },
  { name: "Caption", cls: "text-xs text-muted-foreground uppercase tracking-widest", sample: "MÉTA · LABEL", note: "12px" },
];

function Section({ title, children, anchor }: { title: string; children: React.ReactNode; anchor: string }) {
  return (
    <section id={anchor} className="space-y-5 scroll-mt-24">
      <div className="flex items-center gap-3">
        <div className="w-1.5 h-7 rounded-full bg-eerie" />
        <h2 className="text-2xl font-bold">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function StateRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[100px_1fr] items-center gap-4 py-2">
      <span className="text-[11px] uppercase tracking-widest text-muted-foreground">{label}</span>
      <div>{children}</div>
    </div>
  );
}

function DesignSystem() {
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("Aperçu");
  const [stepIdx, setStepIdx] = useState(1);
  const sections = [
    { id: "colors", label: "Couleurs" },
    { id: "typography", label: "Typographie" },
    { id: "shadows", label: "Ombres" },
    { id: "buttons", label: "Boutons" },
    { id: "inputs", label: "Formulaires" },
    { id: "cards", label: "Cards" },
    { id: "badges", label: "Badges & Stages" },
    { id: "avatars", label: "Avatars & Score" },
    { id: "tabs", label: "Tabs & Stepper" },
    { id: "modals", label: "Modales" },
    { id: "skeleton", label: "Skeleton" },
    { id: "feedback", label: "Feedback" },
  ];

  return (
    <div className="min-h-screen bg-ghost">
      {/* Top bar */}
      <header className="sticky top-0 z-30 glass rounded-none border-x-0 border-t-0">
        <div className="max-w-6xl mx-auto px-4 md:px-8 h-16 flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2 text-sm hover:text-eerie/70">
            <ArrowLeft size={16} /> <span className="hidden sm:inline">Accueil</span>
          </Link>
          <div className="h-6 w-px bg-border" />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-eerie text-white flex items-center justify-center"><Building2 size={14} /></div>
            <span className="font-bold">Design System</span>
            <SoftBadge tone="info">v1.0</SoftBadge>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 md:px-8 py-10 grid lg:grid-cols-[200px_1fr] gap-10">
        {/* TOC */}
        <nav className="hidden lg:block sticky top-24 h-fit space-y-1">
          <div className="text-[11px] uppercase tracking-widest text-muted-foreground mb-3">Sommaire</div>
          {sections.map((s) => (
            <a key={s.id} href={`#${s.id}`} className="block px-3 py-2 rounded-lg text-sm hover:bg-alice/40 transition-colors">
              {s.label}
            </a>
          ))}
        </nav>

        <div className="space-y-14 min-w-0">
          {/* Intro */}
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Rawabet</p>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">Design System</h1>
            <p className="text-muted-foreground max-w-2xl">
              Tokens, typographie, ombres et composants — tous les états (Default, Hover, Active, Disabled, Loading)
              du langage visuel néo-glass de Rawabet.
            </p>
          </div>

          {/* COLORS */}
          <Section title="Palette" anchor="colors">
            <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {colors.map((c) => (
                <NeuCard key={c.name}>
                  <div className={`${c.cls} h-24 rounded-xl mb-3`} />
                  <div className="font-semibold text-sm">{c.name}</div>
                  <div className="text-xs text-muted-foreground font-mono mt-1">{c.token}</div>
                  <div className="text-xs font-mono mt-0.5">{c.hex}</div>
                </NeuCard>
              ))}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {["primary", "secondary", "accent", "muted", "destructive", "border", "card", "popover"].map((t) => (
                <div key={t} className="neu-sm p-3 flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg bg-${t} border border-border`} />
                  <span className="text-xs font-mono">--{t}</span>
                </div>
              ))}
            </div>
          </Section>

          {/* TYPO */}
          <Section title="Typographie" anchor="typography">
            <NeuCard className="divide-y divide-border">
              {typeScale.map((t) => (
                <div key={t.name} className="py-5 first:pt-0 last:pb-0 grid md:grid-cols-[120px_1fr_140px] items-baseline gap-4">
                  <span className="text-[11px] uppercase tracking-widest text-muted-foreground">{t.name}</span>
                  <span className={t.cls}>{t.sample}</span>
                  <span className="text-xs text-muted-foreground font-mono md:text-right">{t.note}</span>
                </div>
              ))}
            </NeuCard>
          </Section>

          {/* SHADOWS */}
          <Section title="Ombres & surfaces" anchor="shadows">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[
                { cls: "neu-sm", label: "Neu Small", token: "--shadow-neu-sm" },
                { cls: "neu", label: "Neu Medium", token: "--shadow-neu" },
                { cls: "neu-lg", label: "Neu Large", token: "--shadow-neu-lg" },
                { cls: "neu-inset", label: "Neu Inset", token: "--shadow-neu-inset" },
                { cls: "glass", label: "Glass Light", token: "backdrop-blur(12px)" },
                { cls: "glass-dark", label: "Glass Dark", token: "rgba(eerie / .7)" },
              ].map((s) => (
                <div key={s.label} className={`${s.cls} p-6 h-32 flex flex-col justify-between`}>
                  <div className="font-semibold text-sm">{s.label}</div>
                  <div className="text-[10px] font-mono opacity-70">{s.token}</div>
                </div>
              ))}
            </div>
          </Section>

          {/* BUTTONS */}
          <Section title="Boutons" anchor="buttons">
            <NeuCard className="space-y-1">
              <StateRow label="Primary">
                <div className="flex flex-wrap gap-3">
                  <button onClick={() => toast.success("Primary cliqué")} className="px-5 py-2.5 rounded-xl bg-eerie text-ghost text-sm font-medium hover:opacity-90">Default</button>
                  <button className="px-5 py-2.5 rounded-xl bg-eerie text-ghost text-sm font-medium opacity-95 shadow-lg">Hover</button>
                  <button className="px-5 py-2.5 rounded-xl bg-eerie text-ghost text-sm font-medium scale-[0.98] opacity-90">Active</button>
                  <button disabled className="px-5 py-2.5 rounded-xl bg-eerie text-ghost text-sm font-medium opacity-40 cursor-not-allowed">Disabled</button>
                  <button onClick={() => { setLoading(true); setTimeout(() => setLoading(false), 1500); }} className="px-5 py-2.5 rounded-xl bg-eerie text-ghost text-sm font-medium flex items-center gap-2">
                    {loading ? <><Loader2 size={14} className="animate-spin" /> Chargement</> : "Loading demo"}
                  </button>
                </div>
              </StateRow>
              <StateRow label="Neu">
                <div className="flex flex-wrap gap-3">
                  <button className="px-5 py-2.5 rounded-xl neu-sm text-sm font-medium hover:neu-pressable">Default</button>
                  <button className="px-5 py-2.5 rounded-xl neu-lg text-sm font-medium">Hover</button>
                  <button className="px-5 py-2.5 rounded-xl neu-inset text-sm font-medium">Active</button>
                  <button disabled className="px-5 py-2.5 rounded-xl neu-sm text-sm font-medium opacity-40 cursor-not-allowed">Disabled</button>
                </div>
              </StateRow>
              <StateRow label="Accent">
                <div className="flex flex-wrap gap-3">
                  <button className="px-5 py-2.5 rounded-xl bg-honeydew text-eerie text-sm font-medium hover:opacity-90">Honeydew</button>
                  <button className="px-5 py-2.5 rounded-xl bg-vanilla text-eerie text-sm font-medium hover:opacity-90">Vanilla</button>
                  <button className="px-5 py-2.5 rounded-xl bg-alice text-eerie text-sm font-medium hover:opacity-90">Alice</button>
                </div>
              </StateRow>
              <StateRow label="Icon">
                <div className="flex flex-wrap gap-3">
                  <button className="w-10 h-10 rounded-full neu-sm hover:neu-pressable flex items-center justify-center"><Bell size={16} /></button>
                  <button className="w-10 h-10 rounded-full neu-inset flex items-center justify-center"><Search size={16} /></button>
                  <button className="w-10 h-10 rounded-full bg-eerie text-ghost flex items-center justify-center"><Plus size={16} /></button>
                  <button disabled className="w-10 h-10 rounded-full neu-sm flex items-center justify-center opacity-40"><X size={16} /></button>
                </div>
              </StateRow>
            </NeuCard>
          </Section>

          {/* INPUTS */}
          <Section title="Formulaires" anchor="inputs">
            <div className="grid md:grid-cols-2 gap-5">
              <NeuCard className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Input</label>
                  <input placeholder="Texte par défaut" className="mt-2 w-full px-4 py-3 neu-inset rounded-lg bg-transparent focus:outline-none text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Avec icône</label>
                  <div className="mt-2 relative">
                    <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input placeholder="Rechercher…" className="w-full pl-11 pr-4 py-3 neu-inset rounded-lg bg-transparent focus:outline-none text-sm" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Select</label>
                  <select className="mt-2 w-full px-4 py-3 neu-inset rounded-lg bg-transparent focus:outline-none text-sm">
                    <option>Option un</option><option>Option deux</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Disabled</label>
                  <input disabled value="Non éditable" className="mt-2 w-full px-4 py-3 neu-inset rounded-lg bg-transparent text-sm opacity-50" />
                </div>
              </NeuCard>
              <NeuCard className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Textarea</label>
                  <textarea rows={4} placeholder="Notes longues…" className="mt-2 w-full px-4 py-3 neu-inset rounded-lg bg-transparent focus:outline-none text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Range — Budget</label>
                  <input type="range" min={0} max={10} defaultValue={3} className="mt-3 w-full accent-eerie" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Toggle</label>
                  <div className="mt-2 flex items-center gap-3">
                    <button className="w-11 h-6 rounded-full bg-honeydew relative"><span className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-ghost shadow" /></button>
                    <button className="w-11 h-6 rounded-full neu-inset relative"><span className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-ghost shadow" /></button>
                  </div>
                </div>
              </NeuCard>
            </div>
          </Section>

          {/* CARDS */}
          <Section title="Cards" anchor="cards">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              <NeuCard size="sm">
                <div className="text-xs uppercase tracking-widest text-muted-foreground">Size SM</div>
                <div className="text-2xl font-bold mt-2">Compact</div>
              </NeuCard>
              <NeuCard>
                <div className="text-xs uppercase tracking-widest text-muted-foreground">Size MD</div>
                <div className="text-2xl font-bold mt-2">Standard</div>
              </NeuCard>
              <NeuCard size="lg">
                <div className="text-xs uppercase tracking-widest text-muted-foreground">Size LG</div>
                <div className="text-2xl font-bold mt-2">Hero</div>
              </NeuCard>
              <NeuCard pressable className="bg-alice/40">
                <div className="font-semibold">Pressable + tint</div>
                <p className="text-xs text-muted-foreground mt-2">Hover & active states actifs</p>
              </NeuCard>
              <div className="glass p-6">
                <div className="font-semibold">Glass surface</div>
                <p className="text-xs text-muted-foreground mt-2">backdrop-blur 12px</p>
              </div>
              <div className="glass-dark p-6 rounded-2xl">
                <div className="font-semibold">Glass dark</div>
                <p className="text-xs opacity-70 mt-2">Sur fond contrasté</p>
              </div>
            </div>
          </Section>

          {/* BADGES */}
          <Section title="Badges & Stages" anchor="badges">
            <NeuCard className="space-y-5">
              <div className="flex flex-wrap gap-2">
                <SoftBadge>Neutre</SoftBadge>
                <SoftBadge tone="success"><Check size={12} /> Succès</SoftBadge>
                <SoftBadge tone="warn"><Clock size={12} /> Attention</SoftBadge>
                <SoftBadge tone="danger"><X size={12} /> Erreur</SoftBadge>
                <SoftBadge tone="info">Info</SoftBadge>
              </div>
              <div className="flex flex-wrap gap-2">
                {(["froid", "tiede", "chaud", "negociation", "cloture", "perdu"] as const).map((s) => (
                  <StageBadge key={s} stage={s} />
                ))}
              </div>
            </NeuCard>
          </Section>

          {/* AVATARS */}
          <Section title="Avatars & Lead Score" anchor="avatars">
            <div className="grid md:grid-cols-2 gap-5">
              <NeuCard>
                <h3 className="font-semibold mb-4 text-sm">Avatars</h3>
                <div className="flex items-end gap-4">
                  <Avatar name="Sara El Idrissi" size={24} />
                  <Avatar name="Mehdi Bouazza" size={32} />
                  <Avatar name="Karim Benchekroun" size={48} />
                  <Avatar name="Leila Tazi" size={64} />
                  <Avatar name="Omar Slaoui" size={88} />
                </div>
                <div className="flex -space-x-2 mt-5">
                  {["Sara", "Mehdi", "Yasmine", "Anas", "Salma"].map((n) => <Avatar key={n} name={n} size={32} />)}
                </div>
              </NeuCard>
              <NeuCard>
                <h3 className="font-semibold mb-4 text-sm">Lead Score (donut SVG)</h3>
                <div className="flex items-end gap-6">
                  <div className="text-center"><LeadScore score={18} /><div className="text-[10px] mt-2 text-muted-foreground">Froid</div></div>
                  <div className="text-center"><LeadScore score={42} /><div className="text-[10px] mt-2 text-muted-foreground">Tiède</div></div>
                  <div className="text-center"><LeadScore score={68} /><div className="text-[10px] mt-2 text-muted-foreground">Chaud</div></div>
                  <div className="text-center"><LeadScore score={92} size={80} /><div className="text-[10px] mt-2 text-muted-foreground">Hot lead</div></div>
                </div>
              </NeuCard>
            </div>
          </Section>

          {/* TABS & STEPPER */}
          <Section title="Tabs & Stepper" anchor="tabs">
            <div className="grid lg:grid-cols-2 gap-5">
              <NeuCard className="space-y-4">
                <div className="text-xs uppercase tracking-widest text-muted-foreground">Tabs (pill)</div>
                <div className="neu-sm rounded-xl p-1 flex gap-1">
                  {["Aperçu", "Activité", "Documents"].map((t) => (
                    <button
                      key={t}
                      onClick={() => setActiveTab(t)}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === t ? "neu-inset" : "hover:bg-alice/30"}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                <div className="neu-inset rounded-xl p-5 text-sm text-muted-foreground min-h-[80px]">
                  Contenu de l'onglet <span className="font-semibold text-eerie">{activeTab}</span>.
                </div>
              </NeuCard>

              <NeuCard className="space-y-5">
                <div className="text-xs uppercase tracking-widest text-muted-foreground">Stepper</div>
                <div className="flex items-center">
                  {["Profil", "Recherche", "Visite", "Contrat"].map((s, i) => (
                    <div key={s} className="flex-1 flex items-center last:flex-none">
                      <button onClick={() => setStepIdx(i)} className="flex flex-col items-center gap-2" aria-label={`Étape ${s}`}>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                          i < stepIdx ? "bg-eerie text-ghost" :
                          i === stepIdx ? "bg-honeydew ring-4 ring-honeydew/30" :
                          "neu-inset text-muted-foreground"
                        }`}>
                          {i < stepIdx ? <Check size={14} /> : i + 1}
                        </div>
                        <span className={`text-[10px] ${i === stepIdx ? "font-bold" : "text-muted-foreground"}`}>{s}</span>
                      </button>
                      {i < 3 && <div className={`flex-1 h-0.5 mx-2 ${i < stepIdx ? "bg-eerie" : "bg-border"}`} />}
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setStepIdx((s) => Math.max(0, s - 1))} className="flex-1 py-2 rounded-lg neu-sm text-sm">Précédent</button>
                  <button onClick={() => setStepIdx((s) => Math.min(3, s + 1))} className="flex-1 py-2 rounded-lg bg-eerie text-ghost text-sm">Suivant</button>
                </div>
              </NeuCard>
            </div>
          </Section>

          {/* MODALES */}
          <Section title="Modales & Dialogs" anchor="modals">
            <NeuCard className="flex flex-col md:flex-row items-start md:items-center gap-5 justify-between">
              <div>
                <h3 className="font-semibold">Dialog centré avec backdrop blur</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-md">Overlay sombre + flou, card neumorphique, fermeture au clic extérieur ou via le bouton.</p>
              </div>
              <button onClick={() => setModalOpen(true)} className="px-5 py-3 rounded-xl bg-eerie text-ghost text-sm font-medium hover:opacity-90 shrink-0">Ouvrir la modale</button>
            </NeuCard>
            {modalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setModalOpen(false)}>
                <div className="absolute inset-0 bg-eerie/60 backdrop-blur-sm" />
                <div className="relative bg-ghost rounded-3xl max-w-md w-full p-6 md:p-7 shadow-2xl animate-in fade-in zoom-in-95" onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => setModalOpen(false)} className="absolute top-4 right-4 w-9 h-9 rounded-full neu-sm flex items-center justify-center" aria-label="Fermer"><X size={16} /></button>
                  <div className="w-12 h-12 rounded-2xl bg-eerie text-white flex items-center justify-center mb-4"><Building2 size={18} /></div>
                  <h2 className="text-xl font-bold">Exemple de dialog</h2>
                  <p className="text-sm text-muted-foreground mt-2 leading-relaxed">Toutes les modales du CRM partagent ce squelette : surface ghost, ombre douce, bouton de fermeture neumorphique.</p>
                  <div className="mt-6 flex gap-2">
                    <button onClick={() => { toast.success("Confirmé"); setModalOpen(false); }} className="flex-1 py-2.5 rounded-xl bg-eerie text-ghost text-sm font-medium">Confirmer</button>
                    <button onClick={() => setModalOpen(false)} className="px-5 py-2.5 rounded-xl neu-sm text-sm font-medium">Annuler</button>
                  </div>
                </div>
              </div>
            )}
          </Section>

          {/* SKELETON */}
          <Section title="Skeleton (loading state)" anchor="skeleton">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              <NeuCard className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-muted animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-3/4 rounded-full bg-muted animate-pulse" />
                    <div className="h-3 w-1/2 rounded-full bg-muted animate-pulse" />
                  </div>
                </div>
                <div className="h-3 w-full rounded-full bg-muted animate-pulse" />
                <div className="h-3 w-5/6 rounded-full bg-muted animate-pulse" />
              </NeuCard>
              <NeuCard className="space-y-3">
                <div className="h-32 rounded-lg bg-muted animate-pulse" />
                <div className="h-3 w-2/3 rounded-full bg-muted animate-pulse" />
                <div className="h-3 w-1/3 rounded-full bg-muted animate-pulse" />
              </NeuCard>
              <NeuCard className="space-y-3">
                <div className="h-3 w-1/4 rounded-full bg-muted animate-pulse" />
                <div className="h-8 w-3/4 rounded-lg bg-muted animate-pulse" />
                <div className="grid grid-cols-3 gap-2 pt-2">
                  <div className="h-8 rounded-lg bg-muted animate-pulse" />
                  <div className="h-8 rounded-lg bg-muted animate-pulse" />
                  <div className="h-8 rounded-lg bg-muted animate-pulse" />
                </div>
              </NeuCard>
            </div>
          </Section>

          {/* FEEDBACK */}
          <Section title="Feedback (toasts, loaders, vide)" anchor="feedback">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              <NeuCard className="space-y-3">
                <div className="text-xs uppercase tracking-widest text-muted-foreground">Toasts</div>
                <button onClick={() => toast("Notification simple")} className="w-full py-2.5 rounded-lg neu-sm hover:neu-pressable text-sm">Default</button>
                <button onClick={() => toast.success("Action réussie")} className="w-full py-2.5 rounded-lg bg-honeydew text-sm">Success</button>
                <button onClick={() => toast.error("Erreur de chargement")} className="w-full py-2.5 rounded-lg bg-destructive/15 text-destructive text-sm">Error</button>
              </NeuCard>
              <NeuCard className="flex flex-col items-center justify-center gap-3 py-8">
                <Loader2 size={28} className="animate-spin text-muted-foreground" />
                <div className="text-xs text-muted-foreground">Loading state</div>
              </NeuCard>
              <NeuCard className="flex flex-col items-center justify-center gap-3 py-8 text-center">
                <div className="w-14 h-14 rounded-2xl bg-alice flex items-center justify-center"><Upload size={20} /></div>
                <div className="font-semibold text-sm">Aucun document</div>
                <p className="text-xs text-muted-foreground">Empty state avec illustration douce.</p>
              </NeuCard>
            </div>
          </Section>

          <footer className="pt-8 mt-8 border-t border-border text-center text-xs text-muted-foreground">
            Rawabet Design System · neumorphism + glass · palette douce.
            <Link to="/" className="ml-2 inline-flex items-center gap-1 hover:text-eerie">retour <ChevronRight size={12} /></Link>
          </footer>
        </div>
      </div>
    </div>
  );
}
