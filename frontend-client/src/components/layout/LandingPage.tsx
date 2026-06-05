import React, { useEffect, useState, useRef } from 'react'
import { Link } from '@tanstack/react-router'
import {
  Building2,
  ArrowRight,
  Search,
  Shield,
  LayoutDashboard,
  Users,
  Sparkles,
  Send,
  ArrowUpRight,
  ChevronRight,
  MessageSquare,
  UserCheck,
  Zap,
  CheckCircle2,
} from 'lucide-react'
import { Avatar, LeadScore } from "@/components/ui/design-bits";
import { LANDING_CONTENT as content } from "@/config/landing-content";
import { cn } from "@/lib/utils";
import { MurshidChatbot } from "@/components/ai/MurshidChatbot";

const ICON_MAP: Record<string, React.ElementType> = {
  LayoutDashboard, Shield, Users, Search, ArrowRight,
  MessageSquare, UserCheck, Zap,
};

// --- WORD ROTATOR ---
function WordRotator({ words }: { words: string[] }) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIndex(p => (p + 1) % words.length), 2800);
    return () => clearInterval(t);
  }, [words.length]);
  return (
    <span className="relative inline-block overflow-hidden h-[1.1em] align-top ml-2">
      <span
        className="flex flex-col transition-transform duration-700 ease-in-out"
        style={{ transform: `translateY(-${index * 1.1}em)` }}
      >
        {words.map((w, i) => (
          <span key={i} className="h-[1.1em] font-serif italic text-vanilla leading-none">{w}</span>
        ))}
      </span>
    </span>
  );
}

// --- REVEAL ---
function Reveal({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.unobserve(e.target); } }, { threshold: 0.08 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} style={{ transitionDelay: `${delay}ms` }}
      className={cn("transition-all duration-700 ease-out", visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6", className)}>
      {children}
    </div>
  );
}

// --- SECTION LABEL ---
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-gray-100 shadow-sm text-[9px] font-black uppercase tracking-[0.25em] text-alice/60 mb-6">
      <span className="w-1 h-1 rounded-full bg-vanilla inline-block" />
      {children}
    </div>
  );
}

export function LandingPage() {
  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [chatMessage, setChatMessage] = useState("");
  const [chatHistory, setChatHistory] = useState([
    { role: 'ai', text: "Bonjour ! Je suis Nexus. Comment puis-je optimiser votre agence aujourd'hui ?" }
  ]);

  useEffect(() => {
    fetch('http://localhost:8081/api/public/properties/latest')
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => { setProperty(d); setLoading(false); })
      .catch(() => {
        setProperty({ title: "Villa de Prestige – Anfa", city: "Casablanca", price: 9500000, surfaceM2: 420, numRooms: 6 });
        setLoading(false);
      });
  }, []);

  const handleChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;
    const next = [...chatHistory, { role: 'user', text: chatMessage }];
    setChatHistory(next);
    setChatMessage("");
    setTimeout(() => setChatHistory([...next, { role: 'ai', text: "Analyse en cours… Recommandation : Acter immédiatement. Score de confiance : 96 %." }]), 900);
  };

  const rotatingWords = ["orchestre", "propulse", "optimise", "automatise", "sécurise"];

  return (
    <div className="min-h-screen bg-ghost text-eerie font-sans selection:bg-vanilla/30 overflow-x-hidden">

      {/* ── HEADER ── */}
      <header className="h-16 px-6 lg:px-12 flex items-center justify-between sticky top-0 z-50 bg-ghost/80 backdrop-blur-lg border-b border-gray-100/60">
        <div className="flex items-center gap-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 flex items-center justify-center">
              <img 
                src="https://res.cloudinary.com/dam3isgtd/image/upload/v1780656617/logo-rawabet-rmv_eun7jl.png" 
                alt="Rawabet Logo" 
                className="w-full h-full object-contain"
              />
            </div>
            <span className="text-sm font-black tracking-widest">{content.brand.name}</span>
          </div>
          <nav className="hidden lg:flex items-center gap-8 text-[9px] font-black uppercase tracking-[0.2em] text-alice/50">
            {content.navigation.map(n => (
              <a key={n.href} href={n.href} className="hover:text-eerie transition-colors">{n.label}</a>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login" className="text-[10px] font-black uppercase tracking-widest text-alice/50 hover:text-eerie transition-colors px-4 py-2 hidden sm:block">
            Connexion
          </Link>
          <Link to="/login" className="px-5 py-2.5 rounded-xl bg-eerie text-white font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all flex items-center gap-2 shadow-lg shadow-black/10">
            Démarrer <ArrowRight size={12} />
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 lg:px-10">

        {/* ── HERO ── */}
        <section className="pt-24 pb-20 text-center">
          <Reveal>
            <SectionLabel>{content.hero.badge}</SectionLabel>
          </Reveal>

          <Reveal delay={80}>
            <h1 className="text-5xl md:text-[66px] font-extrabold tracking-tight leading-[1.06] max-w-4xl mx-auto mb-6">
              Le système qui <WordRotator words={rotatingWords} /><br />
              <span className="text-alice/30 font-medium text-[0.7em]">votre succès immobilier.</span>
            </h1>
          </Reveal>

          <Reveal delay={160}>
            <p className="text-base md:text-lg text-alice/70 max-w-xl mx-auto leading-relaxed font-medium mb-10">
              Rawabet unifie votre agence — propriétés, équipes, clients et documents — dans un seul espace pensé pour la performance.
            </p>
          </Reveal>

          <Reveal delay={240}>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/login" className="px-8 py-3.5 rounded-xl bg-eerie text-white font-black text-[10px] uppercase tracking-widest hover:scale-[1.03] transition-all shadow-xl shadow-black/10 flex items-center gap-2.5">
                {content.hero.cta.primary} <ArrowRight size={14} />
              </Link>
              <a href="#demo-flow" className="px-8 py-3.5 rounded-xl border border-gray-200 bg-white text-eerie font-black text-[10px] uppercase tracking-widest hover:shadow-md transition-all">
                {content.hero.cta.secondary}
              </a>
            </div>
          </Reveal>

          {/* Stats strip */}
          <Reveal delay={340}>
            <div className="flex flex-wrap justify-center gap-x-10 gap-y-4 mt-14 pt-10 border-t border-gray-100">
              {content.stats.map((s, i) => (
                <div key={i} className="text-center">
                  <div className="text-2xl font-black text-eerie">{s.value}</div>
                  <div className="text-[9px] font-black uppercase tracking-widest text-alice/40 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          </Reveal>
        </section>

        {/* ── DASHBOARD PREVIEW ── */}
        <section className="pb-28">
          <Reveal className="max-w-5xl mx-auto">
            <div className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-2xl shadow-black/5 hover:shadow-3xl hover:scale-[1.005] transition-all duration-700">
              {/* Browser chrome */}
              <div className="h-10 bg-ghost/60 border-b border-gray-100 flex items-center px-5 gap-4">
                <div className="flex gap-1.5">
                  {['bg-red-300', 'bg-amber-300', 'bg-green-300'].map((c, i) => (
                    <div key={i} className={`w-2.5 h-2.5 rounded-full ${c} opacity-60`} />
                  ))}
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="px-4 py-1 rounded-md bg-white border border-gray-100 text-[9px] font-black text-alice/30 uppercase tracking-widest">
                    rawabet.app / cockpit
                  </div>
                </div>
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>

              <div className="p-8 md:p-12 grid lg:grid-cols-2 gap-10 items-center">
                <div className="space-y-7">
                  <div>
                    <div className="text-[9px] font-black uppercase tracking-widest text-alice/30 mb-1">Propriété active</div>
                    <h3 className="text-xl font-bold">{loading ? '…' : property?.title}</h3>
                    <div className="flex items-center gap-1.5 text-alice/50 text-xs font-semibold mt-1">
                      <Search size={12} /> {property?.city}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { label: "Estimation", value: `${property?.price?.toLocaleString()} MAD` },
                      { label: "Score Lead", value: "96 / 100" },
                    ].map((item, i) => (
                      <div key={i} className="p-4 rounded-2xl bg-ghost/40 border border-gray-50">
                        <div className="text-[9px] font-black uppercase tracking-widest text-alice/40 mb-1">{item.label}</div>
                        <div className="text-base font-black">{item.value}</div>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-3 pt-2 border-t border-gray-50">
                    <div className="flex -space-x-2.5">
                      {['S', 'M', 'A'].map(n => <Avatar key={n} name={n} size={30} className="ring-2 ring-white" />)}
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-alice/30">3 agents connectés</span>
                  </div>
                </div>

                <div className="bg-ghost/30 rounded-2xl p-8 flex flex-col items-center text-center gap-5 border border-gray-50">
                  <LeadScore score={92} size={110} />
                  <div>
                    <div className="text-sm font-black">Analyse Stratégique</div>
                    <div className="text-[9px] text-alice/50 font-black uppercase tracking-widest mt-1">Recommandation : Acter</div>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </section>

        {/* ── FEATURES ── */}
        <section id="plateforme" className="py-20">
          <Reveal className="text-center mb-16">
            <SectionLabel>La Plateforme</SectionLabel>
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">{content.features.title}</h2>
            <p className="text-base text-alice/60 max-w-lg mx-auto">{content.features.description}</p>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-6">
            {content.features.items.map((item, i) => {
              const Icon = ICON_MAP[item.icon] || Zap;
              return (
                <Reveal key={i} delay={i * 100}>
                  <div className="group h-full p-7 rounded-2xl bg-white border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-500 flex flex-col gap-6">
                    <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center", item.color)}>
                      <Icon size={19} className="text-eerie opacity-70" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base font-bold mb-2">{item.title}</h3>
                      <p className="text-sm text-alice/60 leading-relaxed">{item.description}</p>
                    </div>
                    <div className="text-[9px] font-black uppercase tracking-widest text-alice/30 group-hover:text-eerie transition-colors flex items-center gap-1.5">
                      {item.badge} <ChevronRight size={11} />
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </section>

        {/* ── DEMO FLOW ── */}
        <section id="demo-flow" className="py-20">
          <Reveal className="text-center mb-16">
            <SectionLabel>Comment ça marche</SectionLabel>
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">{content.demoFlow.title}</h2>
            <p className="text-base text-alice/60 max-w-lg mx-auto italic">{content.demoFlow.subtitle}</p>
          </Reveal>

          <div className="grid lg:grid-cols-3 gap-6 relative">
            {content.demoFlow.steps.map((step, i) => {
              const Icon = ICON_MAP[step.icon] || Zap;
              return (
                <Reveal key={i} delay={i * 120}>
                  <div className="group relative p-8 rounded-2xl bg-white border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-500 text-center flex flex-col items-center gap-5">
                    {/* Step number */}
                    <div className="absolute top-5 right-5 text-[9px] font-black text-alice/20 uppercase tracking-widest">0{i + 1}</div>

                    <div className="relative">
                      <div className={cn("absolute inset-0 rounded-full blur-xl opacity-0 group-hover:opacity-30 transition-all duration-700 scale-150",
                        i === 0 ? "bg-alice" : i === 1 ? "bg-vanilla" : "bg-honeydew")} />
                      <div className="relative w-14 h-14 rounded-2xl bg-ghost/60 border border-gray-100 flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                        <Icon size={22} className={step.color} />
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-black uppercase tracking-tight mb-2">{step.title}</h3>
                      <p className="text-[13px] text-alice/55 leading-relaxed">{step.description}</p>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </section>

        {/* ── AI SECTION ── */}
        <section id="intelligence" className="py-20 grid lg:grid-cols-2 gap-14 items-center">
          <Reveal className="space-y-6">
            <SectionLabel>Intelligence Artificielle</SectionLabel>
            <h2 className="text-4xl font-extrabold tracking-tight">
              L'Assistant <span className="font-serif italic text-alice/35">Murshid</span>
            </h2>
            <p className="text-base text-alice/65 leading-relaxed max-w-sm">
              {content.aiSection.description}
            </p>
            <div className="flex gap-10 pt-2">
              {[{ val: "x5", lbl: "Gain Opérationnel" }, { val: "96%", lbl: "Précision Murshid" }].map((m, i) => (
                <div key={i}>
                  <div className="text-3xl font-black">{m.val}</div>
                  <div className="text-[9px] font-black uppercase tracking-widest text-alice/40 mt-1">{m.lbl}</div>
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden">
            <MurshidChatbot />
          </Reveal>
        </section>

        {/* ── PROMISE STRIP ── */}
        <section className="py-10">
          <Reveal>
            <div className="rounded-2xl border border-gray-100 bg-white px-8 md:px-12 py-8 flex flex-wrap md:flex-nowrap items-center gap-6 md:gap-10 shadow-sm">
              <div className="shrink-0">
                <p className="text-xl font-extrabold tracking-tight leading-snug max-w-xs">
                  Ce n'est pas juste un portail.{" "}
                  <span className="font-serif italic font-normal text-alice/40">C'est votre tranquillité d'esprit.</span>
                </p>
              </div>
              <div className="h-px md:h-auto md:w-px bg-gray-100 md:self-stretch hidden md:block" />
              <div className="flex flex-wrap gap-4 flex-1">
                {[
                  "Plus jamais un document perdu dans un email",
                  "De l'offre à la signature, vous ne ratez rien.",
                  "Tout votre suivi client, en un seul endroit.",
                ].map((txt, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <CheckCircle2 size={15} className="text-vanilla shrink-0 mt-0.5" />
                    <span className="text-sm text-alice/60 font-medium leading-snug">{txt}</span>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </section>

        {/* ── CTA ── */}
        <section className="py-16 pb-28">
          <Reveal>
            <div className="relative rounded-3xl overflow-hidden text-center py-20 px-10 md:px-20 group"
              style={{ background: "linear-gradient(150deg, #131313 0%, #0d0d0d 100%)" }}>
              {/* Glow */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-[600px] h-[250px] rounded-full blur-[120px] opacity-20 group-hover:opacity-30 transition-opacity duration-[3000ms]"
                  style={{ background: "radial-gradient(ellipse, #d4f0a0 0%, #a8dadc 50%, transparent 75%)" }} />
              </div>
              {/* Corner lines */}
              <div className="absolute top-0 left-0 w-20 h-20 border-t border-l border-white/10 rounded-tl-3xl" />
              <div className="absolute bottom-0 right-0 w-20 h-20 border-b border-r border-white/10 rounded-br-3xl" />

              <div className="relative z-10 space-y-8 max-w-xl mx-auto">
                <p className="text-[9px] font-black uppercase tracking-[0.35em] text-white/20">{content.cta.footer}</p>

                <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-[1.1]">
                  Prêt à transformer<br />
                  <span className="font-serif italic" style={{ color: "#d4f0a0" }}>votre agence ?</span>
                </h2>

                <Link to="/client"
                  className="group/btn inline-flex items-center gap-3 px-10 py-4 rounded-xl font-black text-[11px] uppercase tracking-[0.15em] transition-all duration-300 hover:scale-[1.04] active:scale-95"
                  style={{ background: "linear-gradient(135deg, #d4f0a0, #b7e4c7)", color: "#0d0d0d", boxShadow: "0 16px 48px rgba(212,240,160,0.20)" }}>
                  Accéder à la plateforme
                  <ArrowUpRight size={16} className="group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                </Link>

                <div className="flex flex-wrap justify-center gap-x-8 gap-y-2 text-[9px] font-black uppercase tracking-[0.2em] text-white/25 pt-2">
                  {[
                    { dot: "#d4f0a0", label: "Sans engagement" },
                    { dot: "#a8dadc", label: "Support 24/7" },
                    { dot: "#b7e4c7", label: "Déploiement en 48h" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.dot }} />
                      {item.label}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>
        </section>

      </main>

      {/* ── FOOTER ── */}
      <footer className="border-t border-gray-100 py-12">
        <div className="max-w-6xl mx-auto px-6 lg:px-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 flex items-center justify-center">
              <img 
                src="https://res.cloudinary.com/dam3isgtd/image/upload/v1780656617/logo-rawabet-rmv_eun7jl.png" 
                alt="Rawabet Logo" 
                className="w-full h-full object-contain"
              />
            </div>
            <span className="text-sm font-black tracking-widest">{content.brand.name}</span>
          </div>

          <div className="flex gap-8 text-[10px] font-black uppercase tracking-widest text-alice/35">
            <Link to="/client" className="hover:text-eerie transition-colors">Plateforme</Link>
            <Link to="/client" className="hover:text-eerie transition-colors">Aide</Link>
            <Link to="/client" className="hover:text-eerie transition-colors">Légal</Link>
          </div>

          <p className="text-[9px] font-black uppercase tracking-widest text-alice/25">
            © 2025 Rawabet Elite.
          </p>
        </div>
      </footer>
    </div>
  );
}
