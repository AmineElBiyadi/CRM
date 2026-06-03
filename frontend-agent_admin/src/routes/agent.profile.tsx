import { createFileRoute } from "@tanstack/react-router";
import React, { useState, type FormEvent, type ChangeEvent } from "react";
import { NeuCard } from "@/components/ui/neu-card";
import { Avatar, SoftBadge } from "@/components/ui/design-bits";
import { 
  User, Mail, Phone, Shield, Lock, Save, 
  TrendingUp, Star, Award, Zap, Clock 
} from "lucide-react";
import { toast } from "sonner";
import { useAgentDashboard } from "@/hooks/useDashboard";

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
    name: data?.agentFullName || "Sara El Idrissi",
    role: data?.agentRole || "Commercial Senior",
    email: "sara.idrissi@rawabet.ma",
    phone: "+212 6 61 23 45 67",
    since: "Janvier 2024",
    performance: "Top 5%",
    deals: 24
  };

  const handlePasswordChange = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) {
      toast.error("Les mots de passe ne correspondent pas");
      return;
    }
    setLoading(true);
    // Simuler une mise à jour
    setTimeout(() => {
      setLoading(false);
      toast.success("Mot de passe mis à jour avec succès");
      setPasswords({ current: "", new: "", confirm: "" });
    }, 1000);
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>, field: keyof typeof passwords) => {
    setPasswords(prev => ({ ...prev, [field]: e.target.value }));
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row gap-8 items-start">
        {/* Profile Card */}
        <div className="w-full md:w-1/3 space-y-6">
          <NeuCard className="p-8 text-center flex flex-col items-center gap-4">
            <div className="relative">
              <Avatar name={agent.name} size={100} className="ring-4 ring-vanilla/20" />
              <div className="absolute -bottom-2 -right-2 bg-vanilla p-2 rounded-full shadow-lg">
                <Star size={16} className="text-eerie" fill="currentColor" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold">{agent.name}</h1>
              <p className="text-muted-foreground">{agent.role}</p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              <SoftBadge tone="info">{agent.performance}</SoftBadge>
              <SoftBadge tone="success">{agent.deals} Closings</SoftBadge>
            </div>
          </NeuCard>

          <NeuCard className="p-6 space-y-4">
            <h3 className="font-bold flex items-center gap-2 text-sm uppercase tracking-wider text-muted-foreground">
              <User size={16} /> Informations
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Mail size={16} className="text-muted-foreground" />
                <span>{agent.email}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Phone size={16} className="text-muted-foreground" />
                <span>{agent.phone}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Shield size={16} className="text-muted-foreground" />
                <span>Agent Certifié Rawabet</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Clock size={16} className="text-muted-foreground" />
                <span>Membre depuis {agent.since}</span>
              </div>
            </div>
          </NeuCard>
        </div>

        {/* Settings & Insights */}
        <div className="flex-1 space-y-8">
          {/* Security Section */}
          <NeuCard className="p-8 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Lock size={20} className="text-vanilla" /> Sécurité
              </h2>
            </div>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                  <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Mot de passe actuel</label>
                  <input 
                    type="password" 
                    className="w-full p-3 rounded-xl neu-inset bg-transparent focus:outline-none"
                    value={passwords.current}
                    onChange={e => handleInputChange(e, 'current')}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Nouveau mot de passe</label>
                  <input 
                    type="password" 
                    className="w-full p-3 rounded-xl neu-inset bg-transparent focus:outline-none"
                    value={passwords.new}
                    onChange={e => handleInputChange(e, 'new')}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Confirmer le mot de passe</label>
                  <input 
                    type="password" 
                    className="w-full p-3 rounded-xl neu-inset bg-transparent focus:outline-none"
                    value={passwords.confirm}
                    onChange={e => handleInputChange(e, 'confirm')}
                    required
                  />
                </div>
              </div>
              <div className="pt-2">
                <button 
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-eerie text-white font-bold hover:opacity-90 transition-all disabled:opacity-50"
                >
                  <Save size={18} /> {loading ? "Mise à jour..." : "Sauvegarder les modifications"}
                </button>
              </div>
            </form>
          </NeuCard>

          {/* AI Insights / Suggestions */}
          <div className="grid grid-cols-1 gap-6">
            <NeuCard className="p-6 bg-vanilla/5 border-vanilla/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-vanilla/20 text-vanilla">
                  <TrendingUp size={20} />
                </div>
                <h3 className="font-bold">Objectif Trimestriel</h3>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between text-xs font-bold">
                  <span>PROGRESSION DES VENTES</span>
                  <span className="text-vanilla">85%</span>
                </div>
                <div className="h-3 w-full bg-ghost/20 rounded-full overflow-hidden">
                  <div className="h-full bg-vanilla w-[85%] rounded-full shadow-[0_0_10px_rgba(234,179,8,0.3)]" />
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground italic">
                  <Zap size={14} className="text-vanilla" />
                  <span>Plus que 2 closings pour atteindre votre bonus de performance !</span>
                </div>
              </div>
            </NeuCard>
          </div>
        </div>
      </div>
    </div>
  );
}
