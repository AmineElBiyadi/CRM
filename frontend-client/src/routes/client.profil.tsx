import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useClientData, useUpdateProfile, useUpdatePassword, useLinkGoogle } from "@/hooks/use-client-data";
import { NeuCard } from "@/components/ui/neu-card";
import { Avatar, SoftBadge } from "@/components/ui/design-bits";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Mail, Phone, ShieldCheck, Loader2, Save, Info, AlertCircle, Lock, Eye, EyeOff, KeyRound, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { GoogleLogin } from "@react-oauth/google";

export const Route = createFileRoute("/client/profil")({
  component: ClientProfilePage,
});

const profileSchema = z.object({
  firstName: z.string().min(2, "Le prénom est trop court"),
  lastName: z.string().min(2, "Le nom est trop court"),
  email: z.string().email("Email invalide"),
  phone: z.string().min(10, "Numéro de téléphone invalide"),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Mot de passe actuel requis"),
  newPassword: z.string().min(8, "Le nouveau mot de passe doit faire au moins 8 caractères"),
  confirmPassword: z.string().min(1, "Confirmation requise"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

type ProfileFormValues = z.infer<typeof profileSchema>;
type PasswordFormValues = z.infer<typeof passwordSchema>;

function ClientProfilePage() {
  const { data, isLoading } = useClientData();
  const updateProfile = useUpdateProfile();
  const updatePassword = useUpdatePassword();
  const linkGoogle = useLinkGoogle();
  
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState("info");

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
    },
  });

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    if (data?.profile) {
      form.reset({
        firstName: data.profile.firstName,
        lastName: data.profile.lastName,
        email: data.profile.email,
        phone: data.profile.phone || "",
      });
    }
  }, [data, form]);

  const onSubmit = (values: ProfileFormValues) => {
    updateProfile.mutate(values, {
      onSuccess: () => {
        toast.success("Profil mis à jour avec succès");
      },
      onError: () => {
        toast.error("Erreur lors de la mise à jour");
      },
    });
  };

  const onPasswordSubmit = (values: PasswordFormValues) => {
    updatePassword.mutate({
      oldPassword: values.currentPassword,
      newPassword: values.newPassword,
    }, {
      onSuccess: () => {
        toast.success("Mot de passe mis à jour avec succès");
        passwordForm.reset();
      },
      onError: (error: any) => {
        const message = error.response?.data?.message || "";
        if (message.includes("actuel est incorrect")) {
          passwordForm.setError("currentPassword", { 
            type: "manual", 
            message: "Le mot de passe actuel est incorrect" 
          });
        } else {
          toast.error("Une erreur est survenue lors du changement de mot de passe");
        }
      },
    });
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center p-12">
        <Loader2 className="animate-spin text-vanilla" size={32} />
      </div>
    );
  }

  const profile = data?.profile;

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-vanilla/10 flex items-center justify-center text-vanilla-foreground shadow-inner border border-vanilla/20">
            <User size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-eerie">Mon Profil</h1>
            <p className="text-sm text-muted-foreground font-medium">Gérez vos informations et votre sécurité</p>
          </div>
        </div>
      </header>

      <div className="grid md:grid-cols-12 gap-8 items-start">
        {/* Left Column: Avatar & Summary Integrated with Security */}
        <div className="md:col-span-4 sticky top-8">
          <NeuCard className="p-0 overflow-hidden flex flex-col relative">
            <div className="absolute top-0 left-0 w-full h-2 bg-vanilla/40" />
            
            <div className="p-8 flex flex-col items-center text-center">
              <div className="relative mt-4">
                <Avatar name={`${profile?.firstName} ${profile?.lastName}`} size={120} className="ring-8 ring-vanilla/5" />
                <div className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full bg-honeydew flex items-center justify-center border-4 border-ghost text-honeydew-dark shadow-sm">
                  <ShieldCheck size={18} />
                </div>
              </div>

              <div className="mt-6 space-y-1">
                <h2 className="font-bold text-2xl text-eerie">{profile?.firstName} {profile?.lastName}</h2>
                <p className="text-sm text-muted-foreground font-medium">{profile?.email}</p>
              </div>

              <div className="mt-4 flex flex-wrap justify-center gap-2">
              <SoftBadge tone="info" className="px-4 py-1 font-bold">Client</SoftBadge>
              <SoftBadge tone="success" className="px-4 py-1 font-bold">Compte Vérifié</SoftBadge>
            </div>
              
              <div className="mt-8 w-full space-y-4 pt-6 border-t border-border/40">
                <div className="flex items-center gap-4 text-sm text-muted-foreground px-2">
                  <div className="w-10 h-10 rounded-xl neu-inset flex items-center justify-center shrink-0 text-eerie">
                    <Mail size={16} />
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Email</span>
                    <span className="font-semibold truncate max-w-[180px]">{profile?.email}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground px-2">
                  <div className="w-10 h-10 rounded-xl neu-inset flex items-center justify-center shrink-0 text-eerie">
                    <User size={16} />
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Membre depuis</span>
                    <span className="font-semibold">{profile?.createdAt ? format(new Date(profile.createdAt), "MMMM yyyy", { locale: fr }) : "..."}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-vanilla/5 border-t border-vanilla/10 p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-vanilla/20 text-vanilla-foreground">
                  <ShieldCheck size={18} />
                </div>
                <h3 className="text-xs font-black uppercase tracking-widest text-eerie/70">Sécurité certifiée</h3>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed font-medium">
                Vos données personnelles sont protégées par un chiffrement de bout en bout conforme aux standards RGPD. Toutes vos informations sensibles sont hachées en base de données.
              </p>
            </div>
          </NeuCard>
        </div>

        {/* Right Column: Integrated Settings */}
        <div className="md:col-span-8">
          <NeuCard className="p-0 overflow-hidden">
            <Tabs defaultValue="info" value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="w-full justify-start h-auto p-0 bg-alice/5 border-b rounded-none">
                <TabsTrigger 
                  value="info" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-vanilla data-[state=active]:bg-transparent px-8 py-6 font-bold text-sm flex items-center gap-3 transition-all"
                >
                  <User size={18} />
                  INFORMATIONS PERSONNELLES
                </TabsTrigger>
                <TabsTrigger 
                  value="security" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-vanilla data-[state=active]:bg-transparent px-8 py-6 font-bold text-sm flex items-center gap-3 transition-all"
                >
                  <KeyRound size={18} />
                  SÉCURITÉ DU COMPTE
                </TabsTrigger>
              </TabsList>

              <div className="p-8">
                <TabsContent value="info" className="mt-0 space-y-8 animate-in fade-in duration-300">
                  <div className="flex items-center gap-4 p-5 rounded-2xl bg-alice/20 border border-alice-dark/5">
                    <Info size={20} className="text-eerie/40 shrink-0 mt-0.5" />
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Votre <span className="font-bold text-eerie/70">Nom</span> et <span className="font-bold text-eerie/70">Prénom</span> sont verrouillés car ils figurent sur vos contrats officiels. Pour toute modification, veuillez contacter votre agent.
                    </p>
                  </div>

                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    <div className="grid sm:grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Prénom</label>
                        <div className="relative opacity-60">
                          <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                          <input
                            {...form.register("firstName")}
                            disabled
                            className="w-full pl-11 pr-4 py-4 rounded-xl neu-inset bg-ghost/20 text-sm cursor-not-allowed font-medium"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Nom</label>
                        <div className="relative opacity-60">
                          <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                          <input
                            {...form.register("lastName")}
                            disabled
                            className="w-full pl-11 pr-4 py-4 rounded-xl neu-inset bg-ghost/20 text-sm cursor-not-allowed font-medium"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Email</label>
                        <div className="relative group">
                          <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-vanilla transition-colors" />
                          <input
                            {...form.register("email")}
                            className="w-full pl-11 pr-4 py-4 rounded-xl neu-inset bg-transparent text-sm focus:outline-none transition-all font-medium"
                          />
                        </div>
                        {form.formState.errors.email && (
                          <p className="text-[10px] text-destructive ml-1 font-bold">{form.formState.errors.email.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Téléphone</label>
                        <div className="relative group">
                          <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-vanilla transition-colors" />
                          <input
                            {...form.register("phone")}
                            className="w-full pl-11 pr-4 py-4 rounded-xl neu-inset bg-transparent text-sm focus:outline-none transition-all font-medium"
                          />
                        </div>
                        {form.formState.errors.phone && (
                          <p className="text-[10px] text-destructive ml-1 font-bold">{form.formState.errors.phone.message}</p>
                        )}
                      </div>
                    </div>

                    <div className="pt-8 border-t flex flex-col sm:flex-row items-center justify-between gap-6">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Dernière mise à jour</span>
                        <p className="text-xs text-eerie/60 italic mt-1 font-medium">
                          {profile?.updatedAt ? format(new Date(profile.updatedAt), "d MMMM yyyy 'à' HH:mm", { locale: fr }) : "Aucune"}
                        </p>
                      </div>
                      <button
                        type="submit"
                        disabled={updateProfile.isPending}
                        className="w-full sm:w-auto flex items-center justify-center gap-3 px-10 py-4 rounded-xl bg-eerie text-white text-sm font-bold shadow-xl hover:bg-eerie/90 disabled:opacity-50 transition-all active:scale-95"
                      >
                        {updateProfile.isPending ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                        Enregistrer les modifications
                      </button>
                    </div>
                  </form>
                </TabsContent>

                <TabsContent value="security" className="mt-0 space-y-8 animate-in fade-in duration-300">
                  <div className="flex items-center gap-4 p-5 rounded-2xl bg-vanilla/5 border border-vanilla/10">
                    <AlertCircle size={20} className="text-vanilla shrink-0 mt-0.5" />
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Nous vous recommandons d'utiliser un mot de passe unique d'au moins 8 caractères mélangeant lettres, chiffres et symboles.
                    </p>
                  </div>

                  <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-8">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Mot de passe actuel</label>
                      <div className="relative group">
                        <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-vanilla transition-colors" />
                        <input
                          {...passwordForm.register("currentPassword")}
                          type={showPassword ? "text" : "password"}
                          className="w-full pl-11 pr-12 py-4 rounded-xl neu-inset bg-transparent text-sm focus:outline-none transition-all font-medium"
                          placeholder="••••••••"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-vanilla transition-colors"
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                      {passwordForm.formState.errors.currentPassword && (
                        <p className="text-[10px] text-destructive ml-1 font-bold">{passwordForm.formState.errors.currentPassword.message}</p>
                      )}
                    </div>

                    <div className="grid sm:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Nouveau mot de passe</label>
                        <div className="relative group">
                          <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-vanilla transition-colors" />
                          <input
                            {...passwordForm.register("newPassword")}
                            type={showPassword ? "text" : "password"}
                            className="w-full pl-11 pr-4 py-4 rounded-xl neu-inset bg-transparent text-sm focus:outline-none transition-all font-medium"
                            placeholder="8+ caractères"
                          />
                        </div>
                        {passwordForm.formState.errors.newPassword && (
                          <p className="text-[10px] text-destructive ml-1 font-bold">{passwordForm.formState.errors.newPassword.message}</p>
                        )}
                      </div>

                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Confirmation</label>
                        <div className="relative group">
                          <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-vanilla transition-colors" />
                          <input
                            {...passwordForm.register("confirmPassword")}
                            type={showPassword ? "text" : "password"}
                            className="w-full pl-11 pr-4 py-4 rounded-xl neu-inset bg-transparent text-sm focus:outline-none transition-all font-medium"
                            placeholder="••••••••"
                          />
                        </div>
                        {passwordForm.formState.errors.confirmPassword && (
                          <p className="text-[10px] text-destructive ml-1 font-bold">{passwordForm.formState.errors.confirmPassword.message}</p>
                        )}
                      </div>
                    </div>

                    <div className="pt-8 border-t flex justify-end">
                      <button
                        type="submit"
                        disabled={updatePassword.isPending}
                        className="w-full sm:w-auto flex items-center justify-center gap-3 px-10 py-4 rounded-xl bg-eerie text-white text-sm font-bold shadow-xl hover:bg-eerie/90 disabled:opacity-50 transition-all active:scale-95"
                      >
                        {updatePassword.isPending ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                        Mettre à jour le mot de passe
                      </button>
                    </div>
                  </form>

                  <div className="pt-10 border-t space-y-6">
                    <div>
                      <h3 className="text-sm font-black uppercase tracking-widest text-eerie/70">Comptes liés</h3>
                      <p className="text-xs text-muted-foreground mt-1">Liez votre compte Google pour une connexion plus rapide.</p>
                    </div>

                    <div className="flex items-center justify-between p-6 rounded-2xl bg-alice/10 border border-alice-dark/5">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center border border-border/40">
                          <svg width="20" height="20" viewBox="0 0 24 24">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z" fill="#EA4335" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-eerie">Google</p>
                          <p className="text-xs text-muted-foreground">
                            {profile?.googleLinked ? "Compte lié avec succès" : "Non connecté"}
                          </p>
                        </div>
                      </div>

                      {profile?.googleLinked ? (
                        <div className="flex items-center gap-2 text-honeydew-dark font-bold text-xs bg-honeydew/20 px-4 py-2 rounded-full border border-honeydew/30">
                          <CheckCircle2 size={14} />
                          LIÉ
                        </div>
                      ) : (
                        <GoogleLogin
                          onSuccess={(res) => {
                            if (res.credential) {
                              linkGoogle.mutate(res.credential, {
                                onSuccess: () => toast.success("Compte Google lié !"),
                                onError: () => toast.error("Erreur lors de la liaison"),
                              });
                            }
                          }}
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
