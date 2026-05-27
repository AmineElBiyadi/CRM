import React, { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { 
  Building2, 
  ArrowRight, 
  Search, 
  Shield, 
  LayoutDashboard, 
  Users,
  Activity,
  Zap,
  Sparkles,
  MousePointer2,
  Send,
  PhoneCall,
  CheckCircle2,
  ArrowUpRight,
  MessageCircle,
  Bell,
  User,
  MoreVertical
} from 'lucide-react'
import { NeuCard } from "@/components/ui/neu-card";
import { Avatar, SoftBadge, StageBadge, LeadScore } from "@/components/ui/design-bits";
import { toast } from "sonner";

interface PropertyVO {
  title: string;
  city: string;
  price: number;
  surfaceM2: number;
  numRooms: number;
}

function Section({ title, children, anchor, description }: { title: string; children: React.ReactNode; anchor?: string; description?: string }) {
  return (
    <section id={anchor} className="space-y-8 scroll-mt-24 py-16 border-b border-border/50 last:border-0">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-7 rounded-full bg-eerie" />
          <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
        </div>
        {description && <p className="text-muted-foreground max-w-2xl text-lg">{description}</p>}
      </div>
      {children}
    </section>
  );
}

export function LandingPage() {
  const [property, setProperty] = useState<PropertyVO | null>(null);
  const [loading, setLoading] = useState(true);
  const [chatMessage, setChatMessage] = useState("");
  const [chatHistory, setChatHistory] = useState([
    { role: 'ai', text: "Bonjour ! Je suis l'intelligence Rawabet. Comment puis-je optimiser votre gestion immobilière aujourd'hui ?" }
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
          title: "Villa Contemporaine",
          city: "Marrakech, Palmeraie",
          price: 5400000,
          surfaceM2: 450,
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
      let response = "Analyse en cours... Pour une étude approfondie de cette demande, je vous recommande de synchroniser votre compte Rawabet.";
      if (chatMessage.toLowerCase().includes("agent")) response = "Nos experts sont disponibles. Souhaitez-vous que je notifie l'agent le plus performant pour ce secteur ?";
      setChatHistory([...newHistory, { role: 'ai', text: response }]);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-ghost selection:bg-vanilla/50 selection:text-eerie transition-colors">
      
      {/* HEADER - App Style */}
      <header className="sticky top-0 z-40 bg-ghost/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-eerie flex items-center justify-center text-ghost shadow-neu">
                <Building2 size={22} />
             </div>
             <span className="text-xl font-black tracking-tighter text-eerie uppercase">Rawabet</span>
          </div>
          
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-muted-foreground">
             <a href="#plateforme" className="hover:text-eerie transition-colors">Plateforme</a>
             <a href="#intelligence" className="hover:text-eerie transition-colors">Intelligence</a>
             <a href="#experts" className="hover:text-eerie transition-colors">Agents d'Élite</a>
             <div className="w-px h-5 bg-border mx-2" />
             <Link to="/client" className="text-eerie hover:opacity-70 transition-opacity">Accès Client</Link>
          </nav>

          <div className="flex items-center gap-4">
             <Link to="/client" className="hidden sm:flex px-6 py-2.5 rounded-xl bg-eerie text-ghost text-sm font-bold shadow-neu hover:opacity-90 transition-all active:scale-95">
                Connexion
             </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12 md:py-20 space-y-24">
        
        {/* HERO - COMMAND CENTER STYLE */}
        <section className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
                <SoftBadge tone="info" className="px-4 py-1.5 text-[11px] tracking-widest font-black uppercase">Système d'Exploitation Immobilier</SoftBadge>
                <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[0.9] text-eerie">
                    La puissance de <br/>
                    <span className="text-muted-foreground/30">l'immobilier</span> <br/>
                    <span className="text-vanilla bg-eerie px-4 rounded-2xl">Connecté.</span>
                </h1>
                <p className="text-xl text-muted-foreground leading-relaxed max-w-lg">
                    Rawabet unifie vos agents, vos clients et vos données dans un écosystème néo-glass intelligent. 
                    Accélérez vos transactions de 40% grâce au scoring prédictif.
                </p>
                <div className="flex flex-wrap gap-4 pt-4">
                    <button onClick={() => toast.success("Démonstration activée")} className="px-8 py-4 rounded-2xl bg-eerie text-ghost font-bold shadow-neu-lg flex items-center gap-3 hover:scale-105 transition-all">
                       Lancer le Dashboard <LayoutDashboard size={20} />
                    </button>
                    <Link to="/client" className="px-8 py-4 rounded-2xl neu text-eerie font-bold flex items-center gap-3 hover:neu-pressable transition-all">
                       Espace Client <ArrowRight size={20} />
                    </Link>
                </div>
            </div>

            <div className="relative">
                <NeuCard size="lg" className="p-0 border-2 border-border/20 overflow-hidden shadow-neu-lg">
                    <div className="h-10 bg-ghost border-b border-border flex items-center px-4 gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-400/50" />
                        <div className="w-2.5 h-2.5 rounded-full bg-amber-400/50" />
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/50" />
                        <div className="ml-4 flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                            <Activity size={12} /> Live Intelligence Feed
                        </div>
                    </div>
                    <div className="p-8 space-y-8 bg-white/50">
                        <div className="flex justify-between items-start">
                            <div className="space-y-1">
                                <h3 className="text-2xl font-black tracking-tight">{loading ? '...' : property?.title}</h3>
                                <p className="text-sm text-muted-foreground font-semibold">{property?.city}</p>
                            </div>
                            <div className="text-right">
                                <div className="text-3xl font-black text-eerie">{property?.price?.toLocaleString()} MAD</div>
                                <SoftBadge tone="success" className="mt-2">Vérifié par Rawabet</SoftBadge>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div className="neu-inset p-5 rounded-2xl text-center space-y-2">
                                <div className="flex justify-center text-eerie opacity-40"><Zap size={20} /></div>
                                <div className="text-[10px] font-black uppercase text-muted-foreground">Match Score</div>
                                <div className="text-lg font-black text-eerie">94%</div>
                            </div>
                            <div className="neu-inset p-5 rounded-2xl text-center space-y-2">
                                <div className="flex justify-center text-eerie opacity-40"><Users size={20} /></div>
                                <div className="text-[10px] font-black uppercase text-muted-foreground">Demandes</div>
                                <div className="text-lg font-black text-eerie">12 active</div>
                            </div>
                            <div className="neu-inset p-5 rounded-2xl text-center space-y-2">
                                <div className="flex justify-center text-eerie opacity-40"><Shield size={20} /></div>
                                <div className="text-[10px] font-black uppercase text-muted-foreground">Status</div>
                                <div className="text-lg font-black text-honeydew">Sain</div>
                            </div>
                        </div>

                        <div className="pt-4 flex items-center justify-between border-t border-border">
                            <div className="flex -space-x-3">
                                <Avatar name="Sara" size={32} />
                                <Avatar name="Mehdi" size={32} />
                                <Avatar name="Omar" size={32} />
                                <div className="w-8 h-8 rounded-full bg-ghost border-2 border-white flex items-center justify-center text-[10px] font-bold">+5</div>
                            </div>
                            <button className="text-sm font-bold text-eerie flex items-center gap-2 hover:underline">
                                Voir le dossier complet <ArrowUpRight size={16} />
                            </button>
                        </div>
                    </div>
                </NeuCard>
                {/* Float elements */}
                <div className="absolute -bottom-6 -left-6 neu-lg p-5 rounded-3xl bg-honeydew flex items-center gap-4 animate-bounce-slow">
                    <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-neu">
                        <Sparkles size={24} className="text-eerie" />
                    </div>
                    <div>
                        <div className="text-[10px] font-black uppercase text-eerie/50">Deal Flow</div>
                        <div className="text-sm font-black">+14% ce mois</div>
                    </div>
                </div>
            </div>
        </section>

        {/* STATS STRIP */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-12 neu rounded-3xl bg-white/40">
            {[
                { label: 'Agences Connectées', val: '120+' },
                { label: 'Transactions IA', val: '4.2k' },
                { label: 'Volume Géré', val: '1.2B' },
                { label: 'Satisfaction', val: '98%' }
            ].map(s => (
                <div key={s.label} className="text-center space-y-1 px-4 border-r border-border last:border-0">
                    <div className="text-3xl font-black tracking-tighter">{s.val}</div>
                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{s.label}</div>
                </div>
            ))}
        </div>

        {/* PLATEFORME SECTION */}
        <Section 
            anchor="plateforme"
            title="L'Infrastructure de Confiance"
            description="Rawabet n'est pas un simple outil, c'est le socle sur lequel repose votre agence. Neumorphisme épuré pour une concentration totale sur vos transactions."
        >
            <div className="grid md:grid-cols-3 gap-8">
                <NeuCard pressable className="space-y-6">
                    <div className="w-14 h-14 rounded-2xl bg-alice flex items-center justify-center">
                        <LayoutDashboard size={28} className="text-eerie" />
                    </div>
                    <h3 className="text-xl font-bold">Cockpit de Pilotage</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                        Visualisez votre pipeline en temps réel. Chaque étape est monitorée pour éviter tout goulot d'étranglement.
                    </p>
                    <StageBadge stage="chaud" />
                </NeuCard>

                <NeuCard pressable className="space-y-6">
                    <div className="w-14 h-14 rounded-2xl bg-honeydew flex items-center justify-center">
                        <Shield size={28} className="text-eerie" />
                    </div>
                    <h3 className="text-xl font-bold">Confidentialité Totale</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                        Chaque donnée est cryptée et compartimentée. Vos secrets industriels sont en sécurité dans notre coffre-fort numérique.
                    </p>
                    <SoftBadge tone="success">Ultra-Secured</SoftBadge>
                </NeuCard>

                <NeuCard pressable className="space-y-6">
                    <div className="w-14 h-14 rounded-2xl bg-vanilla flex items-center justify-center">
                        <Users size={28} className="text-eerie" />
                    </div>
                    <h3 className="text-xl font-bold">Portail Collaboratif</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                        Offrez à vos clients une transparence absolue. Un espace dédié pour suivre l'avancement de leur projet.
                    </p>
                    <SoftBadge tone="info">Marque Blanche</SoftBadge>
                </NeuCard>
            </div>
        </Section>

        {/* INTELLIGENCE SECTION (CHAT) */}
        <Section 
            anchor="intelligence"
            title="Intelligence Rawabet"
            description="Le dialogue comme nouveau standard de gestion. Posez vos questions à l'IA la plus avancée du secteur."
        >
            <div className="grid lg:grid-cols-[1.5fr_1fr] gap-12">
                <NeuCard className="p-0 border-2 border-border/20 overflow-hidden">
                    <div className="h-14 bg-ghost/50 border-b border-border px-6 flex items-center justify-between">
                         <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-vanilla flex items-center justify-center"><Sparkles size={16} /></div>
                            <span className="text-xs font-black uppercase tracking-widest text-eerie">Assistant Stratégique</span>
                         </div>
                         <SoftBadge tone="success">Réponse Instantanée</SoftBadge>
                    </div>
                    
                    <div className="h-[400px] overflow-y-auto p-8 space-y-6 bg-white/30 scrollbar-hide">
                        {chatHistory.map((msg, i) => (
                            <div key={i} className={`flex ${msg.role === 'ai' ? 'justify-start' : 'justify-end'}`}>
                                <div className={`max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                                    msg.role === 'ai' 
                                    ? 'bg-ghost border border-border text-eerie rounded-bl-none' 
                                    : 'bg-eerie text-ghost rounded-br-none'
                                }`}>
                                    {msg.text}
                                </div>
                            </div>
                        ))}
                    </div>

                    <form onSubmit={handleSendChat} className="p-6 bg-ghost/30 border-t border-border flex gap-4">
                        <input 
                            type="text" 
                            value={chatMessage}
                            onChange={(e) => setChatMessage(e.target.value)}
                            className="flex-1 px-6 py-4 neu-inset rounded-2xl bg-white/50 focus:outline-none text-sm font-semibold"
                            placeholder="Interrogez l'intelligence sur vos données..."
                        />
                        <button type="submit" className="w-14 h-14 rounded-2xl bg-eerie text-ghost flex items-center justify-center hover:scale-105 transition-transform active:scale-95">
                            <Send size={20} />
                        </button>
                    </form>
                        <div style={{ textAlign: 'center', marginTop: '16px' }}>
                             <Link to="/client" style={{ fontSize: '11px', fontWeight: 700, color: 'var(--secondary)', textDecoration: 'underline' }}>
                                Créer un compte pour sauvegarder cette conversation
                             </Link>
                        </div>
                    </NeuCard>

                <div className="space-y-8 flex flex-col justify-center">
                    <div className="neu p-8 rounded-3xl space-y-2">
                        <LeadScore score={92} size={80} />
                        <h4 className="text-lg font-black mt-4">Scoring haute-fidélité</h4>
                        <p className="text-sm text-muted-foreground">Notre algorithme analyse plus de 40 points de données pour qualifier vos leads.</p>
                    </div>
                    <div className="neu p-8 rounded-3xl flex items-center gap-6">
                        <div className="w-16 h-16 rounded-2xl bg-honeydew flex items-center justify-center shrink-0">
                            <Activity size={32} />
                        </div>
                        <div>
                            <h4 className="text-lg font-black">Performance Live</h4>
                            <p className="text-sm text-muted-foreground">Suivez l'efficacité de vos agents en temps réel.</p>
                        </div>
                    </div>
                </div>
            </div>
        </Section>

        {/* AGENTS SECTION */}
        <Section 
            anchor="experts"
            title="Le Réseau d'Élite"
            description="Plus qu'une plateforme, Rawabet connecte les experts les plus performants du marché."
        >
            <div className="grid md:grid-cols-3 gap-8">
                {[
                    { n: "Sara", r: "Expert Transaction", s: 98 },
                    { n: "Mehdi", r: "Responsable Grands Comptes", s: 94 },
                    { n: "Yasmine", r: "Conseillère IA", s: 96 }
                ].map((a, i) => (
                    <NeuCard key={a.n} pressable className="text-center p-10 space-y-6">
                        <Avatar name={a.n} size={96} className="mx-auto ring-8 ring-ghost" />
                        <div>
                            <h3 className="text-xl font-black">{a.n} El Idrissi</h3>
                            <SoftBadge tone="info" className="mt-2">{a.r}</SoftBadge>
                        </div>
                        <div className="pt-6 border-t border-border/50">
                            <div className="flex justify-between text-[10px] font-black uppercase mb-2">
                                <span>Maîtrise Rawabet</span>
                                <span>{a.s}%</span>
                            </div>
                            <div className="h-2 bg-ghost rounded-full overflow-hidden neu-inset">
                                <div className="h-full bg-vanilla" style={{ width: `${a.s}%` }} />
                            </div>
                        </div>
                        <button className="w-full py-4 rounded-xl neu-sm text-sm font-black flex items-center justify-center gap-2 hover:bg-eerie hover:text-ghost transition-all">
                            Voir le profil <ArrowUpRight size={16} />
                        </button>
                    </NeuCard>
                ))}
            </div>
        </Section>

        {/* FINAL CTA */}
        <section className="py-20 text-center space-y-12 bg-eerie rounded-[3rem] text-ghost p-12 shadow-neu-lg">
            <h2 className="text-4xl md:text-6xl font-black tracking-tight leading-tight">
                Rejoignez le futur <br/> de l'immobilier.
            </h2>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                <button className="px-10 py-5 rounded-2xl bg-vanilla text-eerie font-black text-xl hover:scale-105 transition-transform">
                    Commencer l'Intégration
                </button>
                <button className="px-10 py-5 rounded-2xl bg-white/10 text-ghost font-black text-xl border border-white/20 hover:bg-white/20">
                    Parler à un Spécialiste
                </button>
            </div>
            <p className="text-ghost/40 text-sm font-semibold tracking-widest uppercase">
                Déploiement en moins de 24 heures · Support 24/7
            </p>
        </section>

      </main>

      {/* FOOTER */}
      <footer className="max-w-7xl mx-auto px-6 py-12 border-t border-border">
         <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-eerie flex items-center justify-center text-ghost">
                    <Building2 size={18} />
                </div>
                <span className="text-lg font-black tracking-tighter uppercase">Rawabet</span>
            </div>
            <div className="text-sm text-muted-foreground font-medium">
                © 2024 Rawabet. Engineering the Real Estate Future.
            </div>
            <div className="flex items-center gap-8 text-sm font-bold text-muted-foreground">
                <a href="#" className="hover:text-eerie transition-colors">Mentions</a>
                <a href="#" className="hover:text-eerie transition-colors">Support</a>
            </div>
         </div>
      </footer>
    </div>
  )
}
