import { createFileRoute } from "@tanstack/react-router";
import React, { useState, type FormEvent, type ChangeEvent } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { NeuCard } from "@/components/ui/neu-card";
import { Avatar, SoftBadge } from "@/components/ui/design-bits";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  User, Mail, Lock, Save, 
  Star, Award, CheckCircle2, AlertCircle, ShieldCheck, KeyRound, Eye, EyeOff, Loader2
} from "lucide-react";
import { toast } from "sonner";
import { changePassword } from "@/api/authApi";
import { apiLinkGoogle, getUser, apiMe } from "@/lib/auth";

export const Route = createFileRoute("/admin/profile")({
  component: AdminProfile,
});

function AdminProfile() {
  const user = getUser();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState("info");
  const [isLinked, setIsLinked] = useState(user?.googleLinked || false);
  const [passwords, setPasswords] = useState({
    current: "",
    new: "",
    confirm: ""
  });

  const admin = {
    name: user ? `${user.firstName} ${user.lastName}` : "Administrateur",
    role: user?.role || "ADMIN",
    email: user?.email || "chargement...",
  };

  const handleGoogleLinkSuccess = async (credentialResponse: any) => {
    if (!credentialResponse.credential) return;
    
    setLoading(true);
    try {
      await apiLinkGoogle(credentialResponse.credential);
      toast.success("Compte Google lié avec succès !");
      setIsLinked(true);
      await apiMe();
    } catch (error: any) {
      toast.error(error.message || "Erreur lors du lien avec Google");
    } finally {
      setLoading(false);
    }
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

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>, field: keyof typeof passwords) => {
    setPasswords(prev => ({ ...prev, [field]: e.target.value }));
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-vanilla/10 flex items-center justify-center text-vanilla-foreground shadow-inner border border-vanilla/20">
            <ShieldCheck size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-eerie">Mon Profil Admin</h1>
            <p className="text-sm text-muted-foreground font-medium">Gérez vos accès et paramètres de sécurité</p>
          </div>
        </div>
      </header>

      <div className="grid md:grid-cols-12 gap-8 items-start">
        {/* Left Column: Avatar & Summary */}
        <div className="md:col-span-4 sticky top-8">
          <NeuCard className="p-0 overflow-hidden flex flex-col relative">
            <div className="absolute top-0 left-0 w-full h-2 bg-vanilla/40" />
            
            <div className="p-8 flex flex-col items-center text-center">
              <div className="relative mt-4">
                <Avatar name={admin.name} size={120} className="ring-8 ring-vanilla/5 shadow-xl" />
                <div className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full bg-vanilla flex items-center justify-center border-4 border-ghost text-eerie shadow-sm">
                  <Star size={18} fill="currentColor" />
                </div>
              </div>

              <div className="mt-6 space-y-1">
                <h2 className="font-bold text-2xl text-eerie">{admin.name}</h2>
                <p className="text-sm text-muted-foreground font-medium">{admin.email}</p>
              </div>

              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <SoftBadge tone="info" className="px-4 py-1 font-bold">Administrateur</SoftBadge>
                <SoftBadge tone="success" className="px-4 py-1 font-bold">Système</SoftBadge>
              </div>
              
              <div className="mt-8 w-full space-y-4 pt-6 border-t border-border/40">
                <div className="flex items-center gap-4 text-sm text-muted-foreground px-2">
                  <div className="w-10 h-10 rounded-xl neu-inset flex items-center justify-center shrink-0 text-eerie">
                    <Mail size={16} />
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Email Pro</span>
                    <span className="font-semibold truncate max-w-[180px]">{admin.email}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground px-2">
                  <div className="w-10 h-10 rounded-xl neu-inset flex items-center justify-center shrink-0 text-eerie">
                    <Award size={16} />
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Rôle</span>
                    <span className="font-semibold">Gestionnaire Système</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-vanilla/5 border-t border-vanilla/10 p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-vanilla/20 text-vanilla-foreground">
                  <ShieldCheck size={18} />
                </div>
                <h3 className="text-xs font-black uppercase tracking-widest text-eerie/70">Contrôle Accès</h3>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed font-medium">
                En tant qu'administrateur, vous disposez des droits de gestion globale. Assurez-vous de maintenir vos identifiants en sécurité.
              </p>
            </div>
          </NeuCard>
        </div>

        {/* Right Column: Settings */}
        <div className="md:col-span-8">
          <NeuCard className="p-0 overflow-hidden">
            <Tabs defaultValue="info" value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="w-full justify-start h-auto p-0 bg-alice/5 border-b rounded-none">
                <TabsTrigger 
                  value="info" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-vanilla data-[state=active]:bg-transparent px-8 py-6 font-bold text-sm flex items-center gap-3 transition-all"
                >
                  <User size={18} />
                  MON COMPTE
                </TabsTrigger>
                <TabsTrigger 
                  value="security" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-vanilla data-[state=active]:bg-transparent px-8 py-6 font-bold text-sm flex items-center gap-3 transition-all"
                >
                  <KeyRound size={18} />
                  SÉCURITÉ & GOOGLE
                </TabsTrigger>
              </TabsList>

              <div className="p-8">
                <TabsContent value="info" className="mt-0 space-y-8 animate-in fade-in duration-300">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Prénom & Nom</label>
                      <div className="relative opacity-60">
                        <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input
                          value={admin.name}
                          disabled
                          className="w-full pl-11 pr-4 py-4 rounded-xl neu-inset bg-ghost/20 text-sm cursor-not-allowed font-medium"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Email Professionnel</label>
                      <div className="relative opacity-60">
                        <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input
                          value={admin.email}
                          disabled
                          className="w-full pl-11 pr-4 py-4 rounded-xl neu-inset bg-ghost/20 text-sm cursor-not-allowed font-medium"
                        />
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="security" className="mt-0 space-y-8 animate-in fade-in duration-300">
                  <form onSubmit={handlePasswordChange} className="space-y-8">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Mot de passe actuel</label>
                      <div className="relative group">
                        <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-vanilla transition-colors" />
                        <input
                          type={showPassword ? "text" : "password"}
                          className="w-full pl-11 pr-12 py-4 rounded-xl neu-inset bg-transparent text-sm focus:outline-none transition-all font-medium"
                          value={passwords.current}
                          onChange={e => handleInputChange(e, 'current')}
                          placeholder="••••••••"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-vanilla transition-colors"
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Nouveau mot de passe</label>
                        <div className="relative group">
                          <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-vanilla transition-colors" />
                          <input
                            type={showPassword ? "text" : "password"}
                            className="w-full pl-11 pr-4 py-4 rounded-xl neu-inset bg-transparent text-sm focus:outline-none transition-all font-medium"
                            value={passwords.new}
                            onChange={e => handleInputChange(e, 'new')}
                            placeholder="8+ caractères"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Confirmation</label>
                        <div className="relative group">
                          <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-vanilla transition-colors" />
                          <input
                            type={showPassword ? "text" : "password"}
                            className="w-full pl-11 pr-4 py-4 rounded-xl neu-inset bg-transparent text-sm focus:outline-none transition-all font-medium"
                            value={passwords.confirm}
                            onChange={e => handleInputChange(e, 'confirm')}
                            placeholder="••••••••"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    <div className="pt-8 border-t flex justify-end">
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full sm:w-auto flex items-center justify-center gap-3 px-10 py-4 rounded-xl bg-eerie text-white text-sm font-bold shadow-xl hover:bg-eerie/90 disabled:opacity-50 transition-all active:scale-95"
                      >
                        {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                        Mettre à jour le mot de passe
                      </button>
                    </div>
                  </form>

                  <div className="pt-10 border-t space-y-6">
                    <div>
                      <h3 className="text-sm font-black uppercase tracking-widest text-eerie/70">Comptes liés</h3>
                      <p className="text-xs text-muted-foreground mt-1">Liez votre compte Google pour une connexion administrateur simplifiée.</p>
                    </div>

                    <div className="flex items-center justify-between p-6 rounded-2xl bg-alice/10 border border-alice-dark/5">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center border border-border/40">
                          <svg width="20" height="20" viewBox="0 0 24 24">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z" fill="#EA4335" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-eerie">Google OAuth</p>
                          <p className="text-xs text-muted-foreground">
                            {isLinked ? "Compte lié avec succès" : "Non connecté"}
                          </p>
                        </div>
                      </div>

                      {isLinked ? (
                        <div className="flex items-center gap-2 text-honeydew-dark font-bold text-xs bg-honeydew/20 px-4 py-2 rounded-full border border-honeydew/30">
                          <CheckCircle2 size={14} />
                          LIÉ
                        </div>
                      ) : (
                        <GoogleLogin
                          onSuccess={handleGoogleLinkSuccess}
                          onError={() => toast.error("Échec Google")}
                          text="continue_with"
                          shape="pill"
                          theme="outline"
                        />
                      )}
                    </div>
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </NeuCard>
        </div>
      </div>
    </div>
  );
}
