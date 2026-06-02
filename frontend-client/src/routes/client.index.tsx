import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { NeuCard } from "@/components/ui/neu-card";
import { Avatar, SoftBadge, LeadScore } from "@/components/ui/design-bits";
import { 
  CheckCircle2, 
  Circle, 
  MessageCircle, 
  CalendarPlus, 
  Upload, 
  FileText, 
  MapPin, 
  Clock, 
  Loader2, 
  CheckCheck, 
  Folder, 
  TrendingUp,
  AlertCircle,
  ArrowRight,
  User,
  Activity,
  Bot,
  PieChart as PieChartIcon,
  BarChart3,
  Calendar,
  Users,
  Wallet,
  ArrowUpRight,
  Sparkles,
  ChevronRight
} from "lucide-react";
import { toast } from "sonner";
import { useClientData } from "@/hooks/use-client-data";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ContactAgentModal } from "@/components/client/ContactAgentModal";
import { cn } from "@/lib/utils";
import { RagChatWidget } from "@/components/ai/RagChatWidget";
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend 
} from "recharts";

export const Route = createFileRoute("/client/")({
  component: ClientHome,
});

const STEPS = ["Profil créé", "Recherche", "Visite", "Négociation", "Contrat", "Clôturé"];

const stageToIdx: Record<string, number> = {
  COLD: 1, WARM: 1, HOT: 2, NEGOTIATION: 3, CONTRACT: 4, CLOSED: 5,
};

function ClientHome() {
  const { data, isLoading } = useClientData();
  const [showContactModal, setShowContactModal] = useState(false);

  // Statistics calculation
  const stats = useMemo(() => {
    if (!data) return null;
    
    const dossiers = data.dossiers || [];
    const buyers = dossiers.filter(d => d.clientType === 'BUYER');
    const sellers = dossiers.filter(d => d.clientType === 'SELLER');
    
    const totalBuyerBudget = buyers.reduce((acc, d) => acc + (d.budgetMax || 0), 0);
    const totalSellerValue = sellers.reduce((acc, d) => acc + (d.askingPrice || 0), 0);

    const stageCounts: Record<string, number> = {};
    dossiers.forEach(d => {
      stageCounts[d.stage] = (stageCounts[d.stage] || 0) + 1;
    });

    const pieData = [
      { name: 'Achats', value: buyers.length, color: '#f59e0b' },
      { name: 'Ventes', value: sellers.length, color: '#10b981' }
    ];

    const barData = Object.entries(stageCounts).map(([stage, count]) => ({
      stage: stage,
      dossiers: count
    }));

    // Multi-agent logic: collect all agents across dossiers
    const agentsMap = new Map();
    dossiers.forEach(d => {
      if (d.assignedAgentName) {
        agentsMap.set(d.assignedAgentName, {
          name: d.assignedAgentName,
          count: (agentsMap.get(d.assignedAgentName)?.count || 0) + 1
        });
      }
    });

    const urgentDossiers = dossiers.filter(d => d.isUrgent);
    
    return { 
      pieData, 
      barData, 
      agentsCount: agentsMap.size, 
      agents: Array.from(agentsMap.values()),
      totalBuyerBudget,
      totalSellerValue,
      urgentDossiers
    };
  }, [data]);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center p-12">
        <Loader2 className="animate-spin text-vanilla" size={32} />
      </div>
    );
  }

  const profile = data?.profile;
  const dossiers = data?.dossiers || [];
  const primaryDossier = dossiers[0];
  const meetings = data?.meetings || [];
  const upcomingMeetings = meetings.filter((m) => m.status === "SCHEDULED" || m.status === "PENDING");
  const documents = data?.documents || [];
  const missingDocs = documents.filter((d) => !d.filePath);
  
  const currentStepIdx = primaryDossier ? (stageToIdx[primaryDossier.stage] ?? 0) : 0;
  const agentName = profile?.assignedAgentName || "votre agent";

  return (
    <div className="space-y-8 max-w-[1400px] pb-12">
      {/* Dynamic Header */}
      <div className="relative p-8 rounded-[40px] bg-eerie text-white overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-vanilla/10 rounded-full -mr-32 -mt-32 blur-[100px]" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-alice/5 rounded-full -ml-32 -mb-32 blur-[80px]" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="flex items-center gap-6">
            <div className="relative">
              <Avatar name={profile ? `${profile.firstName} ${profile.lastName}` : "User"} size={80} className="border-4 border-white/10" />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-success rounded-full border-2 border-eerie flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              </div>
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-2">
                Bonjour, {profile?.firstName || "Client"} <span className="text-vanilla">.</span>
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-white/60">
                <span className="flex items-center gap-1.5 text-xs font-bold bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
                  <Folder size={14} className="text-vanilla" /> {dossiers.length} Dossiers
                </span>
                <span className="flex items-center gap-1.5 text-xs font-bold bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
                  <Users size={14} className="text-vanilla" /> {stats?.agentsCount} Agents dédiés
                </span>
                <span className="flex items-center gap-1.5 text-xs font-bold bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
                  <Calendar size={14} className="text-vanilla" /> {upcomingMeetings.length} RDV à venir
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex gap-4">
            <button 
              onClick={() => setShowContactModal(true)}
              className="px-8 py-4 bg-vanilla text-eerie rounded-2xl font-black text-xs tracking-widest hover:scale-105 transition-all shadow-xl shadow-vanilla/20 flex items-center gap-2"
            >
              <MessageCircle size={16} /> CONTACTER L'ÉQUIPE
            </button>
          </div>
        </div>
      </div>

      {/* Financial & Priority Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <NeuCard className="p-6 bg-white border-none shadow-xl shadow-eerie/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <Wallet size={80} className="text-eerie" />
          </div>
          <div className="space-y-4 relative z-10">
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="p-2 bg-ghost rounded-xl"><Wallet size={16} /></div>
              <span className="text-[10px] font-black uppercase tracking-widest">Capacité d'Investissement</span>
            </div>
            <div>
              <div className="text-3xl font-black text-eerie">
                {stats?.totalBuyerBudget.toLocaleString()} <span className="text-lg font-bold">€</span>
              </div>
              <p className="text-[10px] font-bold text-muted-foreground mt-1">Cumul des budgets d'achat</p>
            </div>
            <div className="pt-4 border-t border-ghost flex items-center justify-between">
              <span className="text-[9px] font-black text-muted-foreground/50 uppercase tracking-widest">Patrimoine en vente</span>
              <span className="text-sm font-black text-success">+{stats?.totalSellerValue.toLocaleString()} €</span>
            </div>
          </div>
        </NeuCard>

        <NeuCard className="lg:col-span-2 p-6 bg-ghost/30 border-none shadow-inner relative overflow-hidden">
          <div className="absolute top-4 right-4"><Sparkles size={20} className="text-vanilla/40 animate-pulse" /></div>
          <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground/50 mb-6 flex items-center gap-2">
            <Bot size={14} className="text-vanilla" /> Recommandations IA & Priorités
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {stats?.urgentDossiers.length ? (
              stats.urgentDossiers.slice(0, 2).map((d, i) => (
                <div key={i} className="p-4 rounded-3xl bg-white border border-border/10 shadow-sm flex items-start gap-4 hover:border-vanilla/30 transition-colors cursor-pointer group">
                  <div className="p-3 bg-danger/10 rounded-2xl text-danger shrink-0"><AlertCircle size={20} /></div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-danger uppercase tracking-widest">Action Urgente</p>
                    <p className="text-xs font-bold text-eerie leading-snug">{d.clientFriendlyAction || "Action requise sur votre dossier"}</p>
                    <div className="flex items-center gap-1 text-[9px] font-black text-muted-foreground pt-1 uppercase">
                      {d.propertyTitle || "Dossier sans titre"} <ChevronRight size={10} />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 rounded-3xl bg-white border border-border/10 shadow-sm flex items-start gap-4">
                <div className="p-3 bg-success/10 rounded-2xl text-success shrink-0"><CheckCheck size={20} /></div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-success uppercase tracking-widest">Tout est en ordre</p>
                  <p className="text-xs font-bold text-eerie leading-snug">Vos dossiers progressent normalement. Aucune action urgente requise.</p>
                </div>
              </div>
            )}
            
            <div className="p-4 rounded-3xl bg-vanilla/10 border border-vanilla/20 shadow-sm flex items-start gap-4 hover:bg-vanilla/15 transition-all cursor-pointer group">
              <div className="p-3 bg-vanilla rounded-2xl text-white shrink-0 shadow-lg shadow-vanilla/20"><TrendingUp size={20} /></div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-vanilla uppercase tracking-widest">Opportunité</p>
                <p className="text-xs font-bold text-eerie leading-snug">Nouvelle propriété correspondant à vos critères de recherche.</p>
                <Link to="/client/proprietes" className="flex items-center gap-1 text-[9px] font-black text-vanilla pt-1 uppercase group-hover:underline">
                  Voir la sélection <ArrowRight size={10} />
                </Link>
              </div>
            </div>
          </div>
        </NeuCard>
      </div>

      {/* Statistics Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <NeuCard className="p-8 space-y-6 bg-white border-none shadow-xl shadow-eerie/5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground/50 flex items-center gap-2">
              <PieChartIcon size={14} className="text-vanilla" /> Répartition du Portefeuille
            </h3>
            <div className="flex gap-4">
              {stats?.pieData.map((d, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                  <span className="text-[9px] font-black text-muted-foreground uppercase">{d.name}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats?.pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={90}
                  paddingAngle={8}
                  dataKey="value"
                  stroke="none"
                >
                  {stats?.pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '16px' }}
                  itemStyle={{ fontSize: '12px', fontWeight: '900', textTransform: 'uppercase' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </NeuCard>

        <NeuCard className="p-8 space-y-6 bg-white border-none shadow-xl shadow-eerie/5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground/50 flex items-center gap-2">
              <BarChart3 size={14} className="text-vanilla" /> Pipeline & Étapes
            </h3>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.barData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                <XAxis 
                  dataKey="stage" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: '900', fill: '#94a3b8' }}
                  dy={10}
                />
                <YAxis hide />
                <Tooltip 
                  cursor={{ fill: '#f8fafc', radius: 12 }}
                  contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '16px' }}
                />
                <Bar dataKey="dossiers" fill="#f59e0b" radius={[12, 12, 12, 12]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </NeuCard>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Left Column - All Dossiers List */}
        <div className="xl:col-span-2 space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-eerie uppercase tracking-tight flex items-center gap-3">
              <Folder className="text-vanilla" size={24} /> Vos Dossiers Actifs
            </h2>
          </div>

          <div className="space-y-6">
            {dossiers.length > 0 ? (
              dossiers.map((dossier) => {
                const currentIdx = stageToIdx[dossier.stage] ?? 0;
                const progress = Math.round((currentIdx / (STEPS.length - 1)) * 100);
                
                return (
                  <NeuCard key={dossier.idDeal} className="p-0 overflow-hidden bg-white border-none shadow-xl shadow-eerie/5 hover:translate-y-[-4px] transition-all group">
                    <div className="flex flex-col md:flex-row">
                      {/* Left: Image/Score */}
                      <div className="w-full md:w-48 h-48 md:h-auto bg-ghost relative overflow-hidden shrink-0">
                        {dossier.propertyImageUrls?.[0] ? (
                          <img src={dossier.propertyImageUrls[0]} alt="Property" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-ghost to-alice">
                            <MapPin size={48} className="text-muted-foreground/20" />
                          </div>
                        )}
                        <div className="absolute top-4 left-4">
                          <SoftBadge tone={dossier.clientType === 'BUYER' ? 'info' : 'success'} className="font-black tracking-widest text-[8px] px-3 py-1.5 shadow-lg shadow-black/5">
                            {dossier.clientType === 'BUYER' ? 'ACHAT' : 'VENTE'}
                          </SoftBadge>
                        </div>
                        {dossier.aiLeadScore && (
                          <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-md p-2 rounded-2xl shadow-xl">
                            <LeadScore score={dossier.aiLeadScore} size={48} />
                          </div>
                        )}
                      </div>

                      {/* Right: Info */}
                      <div className="flex-1 p-6 md:p-8 space-y-6">
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                          <div className="space-y-1">
                            <h3 className="text-xl font-black text-eerie uppercase tracking-tight">
                              {dossier.propertyTitle || (dossier.clientType === 'BUYER' ? 'Recherche Immobilière' : 'Mise en Vente')}
                            </h3>
                            <p className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                              <MapPin size={14} className="text-vanilla" /> {dossier.city || 'Lieu à confirmer'}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-xl font-black text-eerie">
                              {(dossier.budgetMax || dossier.askingPrice || 0).toLocaleString()} €
                            </div>
                            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                              {dossier.clientType === 'BUYER' ? 'Budget Max' : 'Prix de Vente'}
                            </p>
                          </div>
                        </div>

                        {/* Progress */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                            <span className="text-muted-foreground/50">Étape: <span className="text-eerie">{dossier.stage}</span></span>
                            <span className="text-vanilla">{progress}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-ghost rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-vanilla transition-all duration-1000" 
                              style={{ width: `${progress}%` }} 
                            />
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-6 pt-4 border-t border-ghost">
                          <div className="flex items-center gap-3">
                            <Avatar name={dossier.assignedAgentName} size={32} className="border-2 border-white shadow-sm" />
                            <div className="flex flex-col">
                              <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest leading-none mb-1">Agent Dédié</span>
                              <span className="text-xs font-bold text-eerie">{dossier.assignedAgentName}</span>
                            </div>
                          </div>
                          
                          <Link 
                            to="/client/dossiers/$id" 
                            params={{ id: dossier.idDeal }}
                            className="flex items-center gap-2 text-[10px] font-black text-vanilla uppercase tracking-widest hover:gap-3 transition-all"
                          >
                            GÉRER LE DOSSIER <ArrowRight size={14} />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </NeuCard>
                );
              })
            ) : (
              <NeuCard className="p-12 text-center space-y-6">
                <Folder size={48} className="mx-auto text-muted-foreground/20" />
                <p className="text-sm font-medium text-muted-foreground">Aucun dossier actif pour le moment.</p>
              </NeuCard>
            )}
          </div>
        </div>

        {/* Right Column - Widgets */}
        <div className="space-y-8">
          {/* Your Team Widget */}
          <NeuCard className="p-6 space-y-6 bg-white border-none shadow-xl shadow-eerie/5">
            <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground/50 flex items-center gap-2">
              <Users size={14} className="text-vanilla" /> Votre Équipe
            </h3>
            <div className="space-y-4">
              {stats?.agents.map((agent, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-2xl bg-ghost/50 border border-border/5 group hover:bg-white hover:shadow-md transition-all">
                  <div className="flex items-center gap-3">
                    <Avatar name={agent.name} size={36} className="border-2 border-white shadow-sm" />
                    <div>
                      <p className="text-xs font-black text-eerie uppercase tracking-tight">{agent.name}</p>
                      <p className="text-[9px] font-bold text-muted-foreground uppercase">{agent.count} dossier(s)</p>
                    </div>
                  </div>
                  <button className="p-2 bg-white rounded-xl text-vanilla shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                    <MessageCircle size={14} />
                  </button>
                </div>
              ))}
            </div>
          </NeuCard>

          {/* Upcoming Meetings Widget */}
          <NeuCard className="p-6 space-y-6 bg-white border-none shadow-xl shadow-eerie/5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground/50 flex items-center gap-2">
                <CalendarPlus size={14} className="text-vanilla" /> Prochain RDV
              </h3>
              <Link to="/client/rendez-vous" className="text-[10px] font-black text-vanilla hover:underline">TOUT VOIR</Link>
            </div>
            
            {upcomingMeetings.length > 0 ? (
              <div className="space-y-4">
                {upcomingMeetings.slice(0, 3).map((m, i) => (
                  <div key={i} className="p-4 rounded-2xl bg-alice/30 border border-border/20 group hover:bg-white transition-all cursor-pointer relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-2 opacity-5"><Calendar size={40} /></div>
                    <p className="text-[10px] font-black text-vanilla uppercase tracking-widest mb-1">{m.type.replace(/_/g, " ")}</p>
                    <p className="text-sm font-black text-eerie mb-2">
                      {format(new Date(m.scheduledAt), "d MMMM · HH:mm", { locale: fr })}
                    </p>
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground">
                      <MapPin size={10} /> {m.propertyAddress || 'Lieu à confirmer'}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center bg-ghost rounded-3xl border border-dashed border-border/40">
                <Clock className="mx-auto text-muted-foreground/20 mb-2" size={24} />
                <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest">Aucun RDV prévu</p>
              </div>
            )}
            
            <button 
              onClick={() => setShowContactModal(true)}
              className="w-full py-4 bg-eerie text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] transition-all shadow-lg shadow-eerie/20 flex items-center justify-center gap-2"
            >
              <CalendarPlus size={14} /> DEMANDER UN RDV
            </button>
          </NeuCard>

          {/* Missing Documents Widget */}
          <NeuCard className="p-6 space-y-6 bg-white border-none shadow-xl shadow-eerie/5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground/50 flex items-center gap-2">
                <Upload size={14} className="text-danger" /> Pièces Manquantes
              </h3>
              <Link to="/client/documents" className="text-[10px] font-black text-vanilla hover:underline">GÉRER</Link>
            </div>
            
            {missingDocs.length > 0 ? (
              <div className="space-y-3">
                {missingDocs.slice(0, 3).map((doc, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-2xl bg-danger/5 border border-danger/10 group hover:bg-danger/10 transition-colors cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-danger shadow-sm">
                        <FileText size={14} />
                      </div>
                      <span className="text-[10px] font-black text-eerie uppercase tracking-tight">{doc.documentType.replace(/_/g, ' ')}</span>
                    </div>
                    <Upload size={12} className="text-danger/40 group-hover:text-danger transition-colors" />
                  </div>
                ))}
                {missingDocs.length > 3 && (
                  <p className="text-[9px] font-bold text-muted-foreground text-center">+{missingDocs.length - 3} autres documents attendus</p>
                )}
              </div>
            ) : (
              <div className="py-8 text-center bg-success/5 rounded-3xl border border-dashed border-success/20">
                <CheckCheck className="mx-auto text-success/40 mb-2" size={24} />
                <p className="text-[10px] font-black text-success uppercase tracking-widest">Dossier complet !</p>
              </div>
            )}
          </NeuCard>

          {/* Activity Summary Widget */}
          <NeuCard className="p-6 space-y-6 bg-white border-none shadow-xl shadow-eerie/5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground/50 flex items-center gap-2">
                <Activity size={14} className="text-vanilla" /> Activité Récente
              </h3>
              <Link to="/client/chronologie" className="text-[10px] font-black text-vanilla hover:underline">VOIR TOUT</Link>
            </div>
            
            <div className="space-y-4">
              {data?.timeline?.slice(0, 3).map((event, i) => (
                <div key={i} className="flex gap-4 items-start relative">
                  {i < 2 && <div className="absolute left-[11px] top-6 w-0.5 h-6 bg-ghost" />}
                  <div className="w-6 h-6 rounded-full bg-ghost flex items-center justify-center shrink-0 border-2 border-white shadow-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-vanilla" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-eerie uppercase tracking-tight leading-none">{event.title}</p>
                    <p className="text-[8px] font-bold text-muted-foreground uppercase">{event.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </NeuCard>
        </div>
      </div>

      {showContactModal && (
        <ContactAgentModal
          agentName={agentName}
          onClose={() => setShowContactModal(false)}
        />
      )}

      {primaryDossier && <RagChatWidget dealId={primaryDossier.idDeal} />}
    </div>
  );
}
