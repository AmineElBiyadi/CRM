import { createFileRoute } from "@tanstack/react-router";
import React, { useState, type FormEvent, type ChangeEvent } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { NeuCard } from "@/components/ui/neu-card";
import { Avatar, SoftBadge } from "@/components/ui/design-bits";
import { 
  User, Mail, Lock, Save, 
  Star, Award, CheckCircle2, AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import { changePassword, forgotPassword } from "@/api/authApi";
import { apiLinkGoogle, getUser, apiMe } from "@/lib/auth";

export const Route = createFileRoute("/admin/profile")({
  component: AdminProfile,
});

function AdminProfile() {
  const user = getUser();
  const [loading, setLoading] = useState(false);
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
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <NeuCard className="p-8 md:p-10 flex flex-col md:flex-row items-center md:items-start gap-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-vanilla/5 rounded-full -mr-16 -mt-16" />
        
        <div className="relative">
          <Avatar name={admin.name} size={120} className="ring-4 ring-vanilla/20 shadow-xl" />
          <div className="absolute -bottom-2 -right-2 bg-vanilla p-2.5 rounded-full shadow-lg border-2 border-white/10">
            <Star size={20} className="text-eerie" fill="currentColor" />
          </div>
        </div>

        <div className="flex-1 text-center md:text-left space-y-4">
          <div className="space-y-1">
            <h1 className="text-3xl md:text-4xl font-black tracking-tight">{admin.name}</h1>
            <p className="text-lg text-muted-foreground font-medium flex items-center justify-center md:justify-start gap-2">
              <Award size={20} className="text-vanilla" /> Administrateur Système
            </p>
          </div>
        </div>
      </NeuCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <NeuCard className="p-8 space-y-6 flex flex-col h-full">
          <div className="flex items-center justify-between border-b border-vanilla/10 pb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <User size={22} className="text-vanilla" /> Informations
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-6 flex-1">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Email Professionnel</label>
              <div className="flex items-center gap-3 p-3 rounded-xl neu-inset bg-transparent group transition-colors overflow-hidden">
                <Mail size={18} className="text-vanilla/70 shrink-0" />
                <span className="text-sm font-medium break-all">{admin.email}</span>
              </div>
            </div>
          </div>
        </NeuCard>

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

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-4 rounded-xl neu-sm hover:neu-pressable bg-eerie text-white font-bold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Save size={18} /> {loading ? "Mise à jour..." : "Enregistrer les modifications"}
            </button>
          </form>

          <div className="pt-6 border-t border-vanilla/10 space-y-4">
            <h3 className="text-sm font-black uppercase text-muted-foreground tracking-widest ml-1">Connexion Google</h3>
            
            {isLinked ? (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-honeydew/20 border border-honeydew/30">
                <CheckCircle2 size={20} className="text-success" />
                <div className="flex-1">
                  <p className="text-sm font-bold">Compte Google lié</p>
                  <p className="text-xs text-muted-foreground">Vous pouvez désormais vous connecter avec votre compte Google.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 rounded-xl bg-alice/20 border border-alice/30">
                  <AlertCircle size={20} className="text-info shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-bold">Lier votre compte Google</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      L'email de votre compte Google doit être identique à <strong>{admin.email}</strong> pour que le lien fonctionne.
                    </p>
                  </div>
                </div>
                <div className="flex justify-center md:justify-start">
                  <GoogleLogin
                    onSuccess={handleGoogleLinkSuccess}
                    onError={() => toast.error("Échec de la connexion Google")}
                    text="signup_with"
                    shape="rectangular"
                    theme="outline"
                    locale="fr"
                  />
                </div>
              </div>
            )}
          </div>
        </NeuCard>
      </div>
    </div>
  );
}
