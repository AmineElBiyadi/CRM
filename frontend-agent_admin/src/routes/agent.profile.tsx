import { createFileRoute } from "@tanstack/react-router";
import React, { useState, type FormEvent, type ChangeEvent } from "react";
import { NeuCard } from "@/components/ui/neu-card";
import { Avatar, SoftBadge } from "@/components/ui/design-bits";
import { 
  User, Mail, Phone, Lock, Save, 
  TrendingUp, Star, Award, Zap, Clock 
} from "lucide-react";
import { toast } from "sonner";
import { useAgentDashboard } from "@/hooks/useDashboard";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { changePassword, forgotPassword } from "@/api/authApi";

export const Route = createFileRoute("/agent/profile")({
  component: AgentProfile,
});

function AgentProfile() {
  const { data } = useAgentDashboard();
  const [loading, setLoading] = useState(false);
  const [passwords, setPasswords] = useState({
    current: "",
    new: "",
    confirm: ""
  });

  const agent = {
    name: data?.agentFullName || "Agent",
    role: data?.agentRole || "Agent",
    email: data?.agentEmail || "chargement...",
    phone: data?.agentPhone || "non renseigné",
    since: data?.agentCreatedAt 
      ? format(new Date(data.agentCreatedAt), 'MMMM yyyy', { locale: fr }).replace(/^\w/, (c) => c.toUpperCase())
      : "en cours de chargement...",
    performance: data?.kpis?.monthlyScore ? `${data.kpis.monthlyScore}%` : "0%",
    deals: data?.kpis?.totalClosings || 0
  };

  const handlePasswordChange = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) {
      toast.error("Les nouveaux mots de passe ne correspondent pas");
      return;
    }
    
    setLoading(true);
    try {
      await changePassword({
        oldPassword: passwords.current,
        newPassword: passwords.new
      });
      toast.success("Mot de passe mis à jour avec succès");
      setPasswords({ current: "", new: "", confirm: "" });
    } catch (error: any) {
      const message = error.response?.data?.message || "Erreur lors de la mise à jour du mot de passe";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!agent.email || agent.email === "chargement...") {
      toast.error("Adresse email non disponible");
      return;
    }

    setLoading(true);
    try {
      await forgotPassword({
        email: agent.email,
        portal: "ADMIN_AGENT"
      });
      toast.success("Un lien de réinitialisation a été envoyé à votre adresse email professionnel.");
    } catch (error: any) {
      const message = error.response?.data?.message || "Erreur lors de l'envoi du lien de réinitialisation";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>, field: keyof typeof passwords) => {
    setPasswords(prev => ({ ...prev, [field]: e.target.value }));
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Hero Header Card */}
      <NeuCard className="p-8 md:p-10 flex flex-col md:flex-row items-center md:items-start gap-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-vanilla/5 rounded-full -mr-16 -mt-16" />
        
        <div className="relative">
          <Avatar name={agent.name} size={120} className="ring-4 ring-vanilla/20 shadow-xl" />
          <div className="absolute -bottom-2 -right-2 bg-vanilla p-2.5 rounded-full shadow-lg border-2 border-white/10">
            <Star size={20} className="text-eerie" fill="currentColor" />
          </div>
        </div>

        <div className="flex-1 text-center md:text-left space-y-4">
          <div className="space-y-1">
            <h1 className="text-3xl md:text-4xl font-black tracking-tight">{agent.name}</h1>
            <p className="text-lg text-muted-foreground font-medium flex items-center justify-center md:justify-start gap-2">
              <Award size={20} className="text-vanilla" /> {agent.role}
            </p>
          </div>
          
          <div className="flex flex-wrap justify-center md:justify-start gap-3">
            <SoftBadge tone="info" className="px-4 py-1.5 text-sm font-bold uppercase tracking-wider">
              <TrendingUp size={14} className="mr-2 inline" /> Performance: {agent.performance}
            </SoftBadge>
            <SoftBadge tone="success" className="px-4 py-1.5 text-sm font-bold uppercase tracking-wider">
              <Zap size={14} className="mr-2 inline" /> {agent.deals} Closings
            </SoftBadge>
          </div>
        </div>
      </NeuCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Account Details Card */}
        <NeuCard className="p-8 space-y-6 flex flex-col h-full">
          <div className="flex items-center justify-between border-b border-vanilla/10 pb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <User size={22} className="text-vanilla" /> Informations du compte
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-6 flex-1">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Email Professionnel</label>
              <div className="flex items-center gap-3 p-3 rounded-xl neu-inset bg-transparent group transition-colors overflow-hidden">
                <Mail size={18} className="text-vanilla/70 shrink-0" />
                <span className="text-sm font-medium break-all">{agent.email}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Téléphone</label>
                <div className="flex items-center gap-3 p-3 rounded-xl neu-inset bg-transparent">
                  <Phone size={18} className="text-vanilla/70 shrink-0" />
                  <span className="text-sm font-medium">{agent.phone}</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Ancienneté</label>
                <div className="flex items-center gap-3 p-3 rounded-xl neu-inset bg-transparent">
                  <Clock size={18} className="text-vanilla/70 shrink-0" />
                  <span className="text-sm font-medium">{agent.since}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-auto">
            <p className="text-xs text-muted-foreground italic leading-relaxed bg-vanilla/5 p-4 rounded-xl border border-vanilla/10">
              Note: Ces informations sont gérées par l'administration. Pour toute modification, veuillez contacter le support technique.
            </p>
          </div>
        </NeuCard>

        {/* Security Section */}
        <NeuCard className="p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-vanilla/10 pb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Lock size={22} className="text-vanilla" /> Sécurité & Accès
            </h2>
          </div>

          <form onSubmit={handlePasswordChange} className="space-y-5">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">Mot de passe actuel</label>
              <input 
                type="password" 
                className="w-full p-3.5 rounded-xl neu-inset bg-transparent focus:outline-none focus:ring-2 focus:ring-vanilla/20 transition-all"
                value={passwords.current}
                onChange={e => handleInputChange(e, 'current')}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">Nouveau</label>
                <input 
                  type="password" 
                  className="w-full p-3.5 rounded-xl neu-inset bg-transparent focus:outline-none focus:ring-2 focus:ring-vanilla/20 transition-all"
                  value={passwords.new}
                  onChange={e => handleInputChange(e, 'new')}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">Confirmation</label>
                <input 
                  type="password" 
                  className="w-full p-3.5 rounded-xl neu-inset bg-transparent focus:outline-none focus:ring-2 focus:ring-vanilla/20 transition-all"
                  value={passwords.confirm}
                  onChange={e => handleInputChange(e, 'confirm')}
                  required
                />
              </div>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row gap-4">
              <button 
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-eerie text-white font-black uppercase tracking-widest text-xs hover:opacity-90 transition-all disabled:opacity-50 shadow-lg"
              >
                <Save size={18} /> {loading ? "Mise à jour..." : "Sauvegarder"}
              </button>
              <button 
                type="button"
                disabled={loading}
                onClick={handleForgotPassword}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-vanilla/5 text-vanilla/60 font-black uppercase tracking-widest text-[10px] hover:bg-alice/10 hover:text-alice transition-all border border-vanilla/10 shadow-sm disabled:opacity-50"
              >
                Mot de passe oublié ?
              </button>
            </div>
          </form>
        </NeuCard>
      </div>
    </div>
  );
}
