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
} from 'lucide-react'
import { NeuCard } from "@/components/ui/neu-card";
import { Avatar, SoftBadge, LeadScore } from "@/components/ui/design-bits";
import { LANDING_CONTENT as content } from "@/config/landing-content";
import { cn } from "@/lib/utils";

const ICON_MAP: Record<string, React.ElementType> = {
  LayoutDashboard,
  Shield,
  Users,
  Search,
  ArrowRight,
  MessageSquare,
  UserCheck,
  Zap,
};

// --- COMPACT WORD ROTATOR ---
function WordRotator({ words }: { words: string[] }) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % words.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [words.length]);

  return (
    <span className="relative inline-block overflow-hidden h-[1.2em] align-top text-eerie ml-2 border-b-4 border-vanilla/40 px-1">
      <span className="flex flex-col transition-transform duration-700 ease-in-out" style={{ transform: `translateY(-${index * 1.2}em)` }}>
        {words.map((word, i) => (
          <span key={i} className="font-serif italic font-medium h-[1.2em]">{word}</span>
        ))}
      </span>
    </span>
  );
}

// --- OPTIMIZED REVEAL ---
function Reveal({ children, className, delay = 0, once = true }: { children: React.ReactNode; className?: string; delay?: number; once?: boolean }) {
  const [isVisible, setIsVisible] = useState(false);
  const domRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        if (once) observer.unobserve(entry.target);
      }
    }, { threshold: 0.1 });
    if (domRef.current) observer.observe(domRef.current);
    return () => observer.disconnect();
  }, [once]);

  return (
    <div
      ref={domRef}
      style={{ transitionDelay: `${delay}ms` }}
      className={cn(
        "transition-all duration-700 ease-out",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
        className
      )}
    >
      {children}
    </div>
  );
}

export function LandingPage() {
  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [chatMessage, setChatMessage] = useState("");
  const [chatHistory, setChatHistory] = useState([
    { role: 'ai', text: "Nexus est prêt. Quelle stratégie adoptons-nous ?" }
  ]);

  useEffect(() => {
    fetch('http://localhost:8081/api/public/properties/latest')
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(data => {
        setProperty(data);
        setLoading(false);
      })
      .catch(() => {
        setProperty({
          title: "Architecture de Prestige - Casablanca",
          city: "Californie",
          price: 9500000,
          surfaceM2: 420,
          numRooms: 6
        });
        setLoading(false);
      });
  }, []);

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;
    const newHistory = [...chatHistory, { role: 'user', text: chatMessage }];
    setChatHistory(newHistory);
    setChatMessage("");
    setTimeout(() => {
      setChatHistory([...newHistory, { role: 'ai', text: "Traitement Nexus... Données corrélées. Dashboard déverrouillé." }]);
    }, 800);
  };

  const rotatingWords = ["orchestre", "optimise", "propulse", "automatise", "sécurise"];

  const DemoFlowStep = ({ step, index }: { step: any, index: number }) => {
    const Icon = ICON_MAP[step.icon] || Zap;
    return (
      <Reveal delay={index * 200} className="relative flex flex-col items-center text-center p-8 group">
        {index < 2 && (
          <div className="hidden lg:block absolute top-1/4 -right-4 w-8 h-[2px] bg-alice/20" />
        )}
        <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-neu", step.color.replace('text-', 'bg-') + "/10")}>
          <Icon className={cn("w-8 h-8", step.color)} />
        </div>
        <h3 className="text-xl font-bold mb-3">{step.title}</h3>
        <p className="text-sm text-alice/60 leading-relaxed max-w-[240px]">{step.description}</p>
      </Reveal>
    );
  };

  return (
    <div className="min-h-screen bg-ghost text-eerie font-sans selection:bg-vanilla/30 overflow-x-hidden soft-scroll">
      
      {/* HEADER - COMPACT & FIXED */}
      <header className="h-14 md:h-16 px-6 lg:px-12 flex items-center justify-between sticky top-0 bg-ghost/90 backdrop-blur-md z-50 border-b border-gray-100/50">
        <div className="flex items-center gap-10">
          <div className="flex items-center gap-2.5 group cursor-pointer">
            <div className="w-8 h-8 rounded-lg bg-eerie flex items-center justify-center text-white transition-all group-hover:scale-110">
              <Building2 size={16} />
            </div>
            <span className="text-base font-black tracking-widest">{content.brand.name}</span>
          </div>
          <nav className="hidden lg:flex items-center gap-8 text-[9px] font-black uppercase tracking-[0.2em] text-alice/60">
            {content.navigation.map(n => (
              <a key={n.href} href={n.href} className="hover:text-eerie transition-colors">{n.label}</a>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-5">
           <Link to="/client" className="text-[9px] font-black uppercase tracking-widest text-alice hover:text-eerie transition-colors">Login</Link>
           <Link to="/client" className="bg-eerie text-white px-6 py-2 rounded-lg text-[9px] font-black uppercase tracking-[0.1em] hover:bg-black transition-all shadow-lg shadow-black/10">
              Démarrer
           </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 lg:px-10">
        
        {/* HERO - COMPACT & DYNAMIC */}
        <section className="pt-20 pb-24 text-center space-y-8 animate-in fade-in duration-1000">
           <Reveal className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-white border border-gray-50 text-[9px] tracking-widest font-black uppercase shadow-sm">
             <Zap size={10} className="text-vanilla fill-vanilla" /> {content.hero.badge}
           </Reveal>
           
           <Reveal delay={100}>
              <h1 className="text-5xl md:text-[68px] font-extrabold tracking-tight text-eerie leading-[1.05] max-w-4xl mx-auto lowercase first-letter:uppercase">
                 Le système qui <WordRotator words={rotatingWords} /> <br/>
                 <span className="text-vanilla font-serif italic">votre succès immobilier.</span>
              </h1>
           </Reveal>

           <Reveal delay={200}>
              <p className="text-base md:text-lg text-alice/80 max-w-xl mx-auto leading-relaxed font-medium">
                Rawabet orchestre votre agence avec une excellence opérationnelle. Unifiez vos équipes, maximisez votre rentabilité.
              </p>
           </Reveal>

           <Reveal delay={300} className="flex flex-wrap justify-center gap-5 pt-4">
              <Link to="/client" className="px-10 py-3.5 rounded-xl bg-eerie text-white font-black text-[10px] uppercase tracking-widest shadow-xl hover:translate-y-[-2px] transition-all flex items-center gap-3">
                 {content.hero.cta.primary} <ArrowRight size={16} />
              </Link>
              <Link to="/client" className="px-10 py-3.5 rounded-xl bg-white border border-gray-100 text-eerie font-black text-[10px] uppercase tracking-widest hover:bg-gray-50 transition-all flex items-center gap-3">
                 {content.hero.cta.secondary} <Sparkles size={16} />
              </Link>
           </Reveal>
        </section>

        {/* DASHBOARD PREVIEW - TIGHT & SHARP */}
        <section className="pb-24">
           <Reveal className="max-w-5xl mx-auto">
              <div className="bg-white rounded-2xl p-0 overflow-hidden border border-gray-50 shadow-2xl transition-all hover:scale-[1.01] duration-700">
                  <div className="h-10 bg-ghost/40 border-b border-gray-50 flex items-center px-6 justify-between">
                      <div className="flex gap-1.5 grayscale opacity-20">
                        <div className="w-2.5 h-2.5 rounded-full bg-gray-400" />
                        <div className="w-2.5 h-2.5 rounded-full bg-gray-400" />
                        <div className="w-2.5 h-2.5 rounded-full bg-gray-400" />
                      </div>
                      <div className="text-[8px] font-black text-alice/40 uppercase tracking-widest flex items-center gap-2">
                        Nexus Cockpit v2.4
                      </div>
                  </div>
                  
                  <div className="p-8 md:p-12 grid lg:grid-cols-2 gap-12 items-center">
                      <div className="space-y-8">
                          <div className="space-y-2">
                              <h3 className="text-2xl font-bold tracking-tight lowercase first-letter:uppercase">{loading ? 'Sync...' : property?.title}</h3>
                              <div className="inline-flex items-center gap-2 text-alice/60 font-bold text-xs">
                                <Search size={14} /> {property?.city}
                              </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-6">
                              <div className="p-5 rounded-xl bg-ghost/30 border border-gray-50">
                                  <div className="text-[9px] font-black uppercase text-alice/40 mb-1">Estimation</div>
                                  <div className="text-xl font-black">{property?.price?.toLocaleString()} <span className="text-[10px] opacity-20">MAD</span></div>
                              </div>
                              <div className="p-5 rounded-xl bg-ghost/30 border border-gray-50">
                                  <div className="text-[9px] font-black uppercase text-alice/40 mb-1">Score Lead</div>
                                  <div className="text-xl font-black flex items-center gap-2">96 <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /></div>
                              </div>
                          </div>

                          <div className="flex items-center gap-4 pt-4 border-t border-gray-50">
                              <div className="flex -space-x-3">
                                  {['S', 'M', 'A'].map((n) => <Avatar key={n} name={n} size={32} className="ring-2 ring-white" />)}
                              </div>
                              <span className="text-[9px] font-bold text-alice/40 uppercase tracking-widest">Connectés</span>
                          </div>
                      </div>

                      <div className="bg-ghost/20 rounded-2xl p-8 flex flex-col items-center justify-center space-y-6 text-center border border-gray-50/50">
                          <LeadScore score={92} size={110} />
                          <div className="space-y-1">
                             <div className="text-sm font-black italic">Analyse Stratégique</div>
                             <div className="text-[9px] text-alice/60 font-black uppercase tracking-widest">Recommandation : Acter</div>
                          </div>
                      </div>
                  </div>
              </div>
           </Reveal>
        </section>

        {/* FEATURES - COMPACT GRID */}
        <section id="plateforme" className="py-24 border-t border-gray-50">
           <div className="grid md:grid-cols-3 gap-12">
              {content.features.items.map((item, idx) => (
                <Reveal key={idx} delay={idx * 100} className="group space-y-6 p-6 rounded-2xl hover:bg-white hover:shadow-xl transition-all duration-500">
                    <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center text-eerie transition-transform group-hover:rotate-6", item.color, "bg-opacity-30")}>
                       {item.icon === "LayoutDashboard" ? <LayoutDashboard size={20} /> : item.icon === "Shield" ? <Shield size={20} /> : <Users size={20} />}
                    </div>
                    <div className="space-y-2">
                       <h3 className="text-lg font-bold">{item.title}</h3>
                       <p className="text-sm text-alice/60 leading-relaxed">{item.description}</p>
                    </div>
                    <div className="text-[9px] font-black uppercase tracking-widest text-alice/40 group-hover:text-eerie transition-colors flex items-center gap-2">
                       {item.badge} <ChevronRight size={12} />
                    </div>
                </Reveal>
              ))}
           </div>
        </section>

        {/* AI CHAT - COMPACT WIDGET */}
        <section id="intelligence" className="py-24 grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-6 text-center lg:text-left">
               <h2 className="text-4xl font-extrabold tracking-tight">Le Cerveau <span className="font-serif italic text-alice/40">Nexus</span></h2>
               <p className="text-lg text-alice/80 italic max-w-md mx-auto lg:mx-0">
                  {content.aiSection.description}
               </p>
               <div className="flex justify-center lg:justify-start gap-12 pt-4">
                  <div className="space-y-1">
                     <div className="text-3xl font-black">{content.aiSection.metrics[1].value}</div>
                     <div className="text-[9px] font-black text-alice/40 uppercase tracking-widest">{content.aiSection.metrics[1].label}</div>
                  </div>
                  <div className="space-y-1">
                     <div className="text-3xl font-black">99%</div>
                     <div className="text-[9px] font-black text-alice/40 uppercase tracking-widest">Précision</div>
                  </div>
               </div>
            </div>

            <Reveal className="bg-white rounded-3xl border border-gray-50 shadow-xl overflow-hidden max-w-lg mx-auto w-full">
               <div className="h-14 px-6 border-b border-gray-50 flex items-center justify-between bg-ghost/10">
                  <div className="flex items-center gap-3">
                     <Sparkles size={14} className="text-vanilla fill-vanilla" />
                     <span className="text-[10px] font-black uppercase tracking-widest text-alice/60">IA Stratège</span>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
               </div>
               <div className="h-80 overflow-y-auto p-8 space-y-6 flex flex-col soft-scroll">
                   {chatHistory.map((msg, i) => (
                      <div key={i} className={cn("max-w-[85%] px-5 py-3 rounded-2xl text-sm font-medium", 
                        msg.role === 'ai' ? "bg-ghost/50 text-gray-600 self-start" : "bg-eerie text-white self-end shadow-lg"
                      )}>
                         {msg.text}
                      </div>
                   ))}
               </div>
               <form onSubmit={handleSendChat} className="p-6 border-t border-gray-50 flex gap-3">
                  <input 
                    placeholder="Analyser mon agence..." 
                    value={chatMessage}
                    onChange={e => setChatMessage(e.target.value)}
                    className="flex-1 bg-ghost/40 border-none rounded-full px-5 py-3 text-sm font-bold focus:ring-1 focus:ring-vanilla"
                  />
                  <button className="w-11 h-11 rounded-full bg-eerie text-white flex items-center justify-center hover:scale-105 transition-all">
                     <Send size={18} />
                  </button>
               </form>
            </Reveal>
        </section>

        {/* DEMO FLOW SECTION - NEW */}
        <section className="py-24 border-t border-gray-50/50 relative">
           <div className="absolute inset-0 bg-alice/5 -z-10 rounded-[4rem]" />
           <div className="text-center space-y-4 mb-16">
              <Reveal>
                 <h2 className="text-4xl font-extrabold tracking-tight">{content.demoFlow.title}</h2>
                 <p className="text-lg text-alice/60 font-medium">{content.demoFlow.subtitle}</p>
              </Reveal>
           </div>
           
           <div className="grid lg:grid-cols-3 gap-8 relative">
              {content.demoFlow.steps.map((step, idx) => (
                <DemoFlowStep key={idx} step={step} index={idx} />
              ))}
           </div>
        </section>

        {/* CTA - COMPACT & HIGH IMPACT */}
        <section className="py-24">
           <Reveal className="p-12 md:p-20 rounded-[3rem] bg-eerie text-white text-center space-y-10 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-vanilla/10 blur-[80px] rounded-full translate-x-1/2 -translate-y-1/2 group-hover:scale-125 transition-transform duration-[2000ms]" />
              <div className="space-y-6 relative z-10">
                 <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight">
                    Preste <span className="font-serif italic text-alice/60">pour l'Excellence</span> ?
                 </h2>
                 <p className="text-[10px] font-black uppercase tracking-[0.4em] text-alice/80 uppercase">{content.cta.footer}</p>
              </div>
              <div className="flex flex-wrap justify-center gap-6 relative z-10">
                 <Link to="/client" className="px-12 py-4 rounded-xl bg-white text-eerie font-black text-[11px] uppercase tracking-widest hover:scale-105 transition-all">
                    {content.cta.primary}
                 </Link>
                 <Link to="/client" className="px-12 py-4 rounded-xl border border-white/20 text-white font-black text-[11px] uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-3">
                    {content.cta.secondary} <ArrowRight size={16} />
                 </Link>
              </div>
           </Reveal>
        </section>

      </main>

      <footer className="pt-24 pb-12 border-t border-gray-50">
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-[1.5fr_1fr_1fr] gap-16 items-center">
           <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded bg-eerie flex items-center justify-center text-white"><Building2 size={16} /></div>
                <span className="text-lg font-black tracking-tight">{content.brand.name}</span>
              </div>
              <p className="text-xs text-alice/60 font-medium max-w-xs">{content.brand.tagline}</p>
           </div>
           <div className="flex gap-12 justify-center text-[10px] font-black uppercase text-alice/40">
              <a href="#" className="hover:text-eerie transition-colors">Plateforme</a>
              <a href="#" className="hover:text-eerie transition-colors">Aide</a>
              <a href="#" className="hover:text-eerie transition-colors">Legal</a>
           </div>
           <div className="text-right text-[9px] font-black text-gray-200 uppercase tracking-widest">
              © 2024 Rawabet Elite.
           </div>
        </div>
      </footer>
    </div>
  )
}
