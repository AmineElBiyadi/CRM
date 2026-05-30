import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useClientData, useUpdateProfile, useUpdatePassword } from "@/hooks/use-client-data";
import { NeuCard } from "@/components/ui/neu-card";
import { Avatar, SoftBadge } from "@/components/ui/design-bits";
import { User, Mail, Phone, ShieldCheck, Loader2, Save, Info, AlertCircle, Lock, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

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
  
  const [showPassword, setShowPassword] = useState(false);

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
      onError: () => {
        toast.error("Erreur lors du changement de mot de passe");
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
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-vanilla flex items-center justify-center shadow-lg text-eerie">
            <User size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Mon Profil</h1>
            <p className="text-sm text-muted-foreground">Gérez vos informations et votre sécurité</p>
          </div>
        </div>
      </header>

      <div className="grid md:grid-cols-12 gap-8 items-start">
        {/* Left Column: Avatar & Quick Info */}
        <div className="md:col-span-4 space-y-6">
          <NeuCard className="flex flex-col items-center text-center p-8 bg-alice/10 border-alice/20">
            <div className="relative">
              <Avatar name={`${profile?.firstName} ${profile?.lastName}`} size={110} className="ring-4 ring-vanilla/20" />
              <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-honeydew flex items-center justify-center border-4 border-ghost text-honeydew-dark">
                <ShieldCheck size={16} />
              </div>
            </div>
            <h2 className="mt-5 font-bold text-xl">{profile?.firstName} {profile?.lastName}</h2>
            <SoftBadge tone="info" className="mt-2 px-4">Client Premium</SoftBadge>
            
            <div className="mt-8 w-full space-y-4 pt-6 border-t border-border/40">
              <div className="flex items-center gap-3 text-sm text-muted-foreground px-2">
                <div className="w-8 h-8 rounded-lg bg-ghost flex items-center justify-center shrink-0">
                  <Mail size={14} />
                </div>
                <span className="truncate">{profile?.email}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground px-2">
                <div className="w-8 h-8 rounded-lg bg-ghost flex items-center justify-center shrink-0">
                  <User size={14} />
                </div>
                <span>Membre depuis {profile?.createdAt ? format(new Date(profile.createdAt), "MMMM yyyy", { locale: fr }) : "..."}</span>
              </div>
            </div>
          </NeuCard>

          <NeuCard className="p-6 bg-ghost/30 border-transparent">
            <div className="flex items-center gap-3 mb-3">
              <ShieldCheck size={18} className="text-muted-foreground" />
              <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Sécurité</h3>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Vos données personnelles sont protégées par un chiffrement de bout en bout conforme aux standards RGPD.
            </p>
          </NeuCard>
        </div>

        {/* Right Column: Forms */}
        <div className="md:col-span-8 space-y-8">
          {/* Personal Information Section */}
          <NeuCard className="p-8">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-alice/10 flex items-center justify-center text-eerie shadow-inner">
                <User size={24} />
              </div>
              <div>
                <h3 className="font-bold text-lg">Informations personnelles</h3>
                <p className="text-xs text-muted-foreground">Mettez à jour vos coordonnées de contact</p>
              </div>
            </div>

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="flex gap-4 p-5 rounded-2xl bg-alice/20 border border-alice-dark/5">
                <Info size={20} className="text-eerie/40 shrink-0 mt-0.5" />
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Votre <span className="font-bold text-eerie/70">Nom</span> et <span className="font-bold text-eerie/70">Prénom</span> sont verrouillés car ils figurent sur vos contrats officiels. Pour toute modification, veuillez contacter votre agent.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-8">
                <div className="space-y-2 opacity-60">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Prénom</label>
                  <div className="relative cursor-not-allowed">
                    <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      {...form.register("firstName")}
                      disabled
                      className="w-full pl-11 pr-4 py-3 rounded-xl neu-inset bg-ghost/20 text-sm cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="space-y-2 opacity-60">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Nom</label>
                  <div className="relative cursor-not-allowed">
                    <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      {...form.register("lastName")}
                      disabled
                      className="w-full pl-11 pr-4 py-3 rounded-xl neu-inset bg-ghost/20 text-sm cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Email</label>
                  <div className="relative group">
                    <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-eerie transition-colors" />
                    <input
                      {...form.register("email")}
                      className="w-full pl-11 pr-4 py-3 rounded-xl neu-inset bg-transparent text-sm focus:outline-none transition-all"
                    />
                  </div>
                  {form.formState.errors.email && (
                    <p className="text-[10px] text-destructive ml-1">{form.formState.errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Téléphone</label>
                  <div className="relative group">
                    <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-eerie transition-colors" />
                    <input
                      {...form.register("phone")}
                      className="w-full pl-11 pr-4 py-3 rounded-xl neu-inset bg-transparent text-sm focus:outline-none transition-all"
                    />
                  </div>
                  {form.formState.errors.phone && (
                    <p className="text-[10px] text-destructive ml-1">{form.formState.errors.phone.message}</p>
                  )}
                </div>
              </div>

              <div className="pt-8 border-t flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Dernière mise à jour</span>
                  <p className="text-xs text-eerie/60 italic mt-0.5">
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
          </NeuCard>

          {/* Password Change Section */}
          <NeuCard className="p-8">
            <div className="flex items-center gap-4 mb-10">
              <div className="w-12 h-12 rounded-2xl bg-vanilla/10 flex items-center justify-center text-vanilla-foreground shadow-inner">
                <Lock size={24} />
              </div>
              <div>
                <h3 className="font-bold text-lg">Sécurité du compte</h3>
                <p className="text-xs text-muted-foreground">Mettez à jour votre mot de passe pour sécuriser votre accès</p>
              </div>
            </div>

            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Mot de passe actuel</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    {...passwordForm.register("currentPassword")}
                    type={showPassword ? "text" : "password"}
                    className="w-full pl-11 pr-12 py-3 rounded-xl neu-inset bg-transparent text-sm focus:outline-none transition-all"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-eerie transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {passwordForm.formState.errors.currentPassword && (
                  <p className="text-[10px] text-destructive ml-1">{passwordForm.formState.errors.currentPassword.message}</p>
                )}
              </div>

              <div className="grid sm:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Nouveau mot de passe</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      {...passwordForm.register("newPassword")}
                      type={showPassword ? "text" : "password"}
                      className="w-full pl-11 pr-4 py-3 rounded-xl neu-inset bg-transparent text-sm focus:outline-none transition-all"
                      placeholder="8+ caractères"
                    />
                  </div>
                  {passwordForm.formState.errors.newPassword && (
                    <p className="text-[10px] text-destructive ml-1">{passwordForm.formState.errors.newPassword.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Confirmer</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      {...passwordForm.register("confirmPassword")}
                      type={showPassword ? "text" : "password"}
                      className="w-full pl-11 pr-4 py-3 rounded-xl neu-inset bg-transparent text-sm focus:outline-none transition-all"
                      placeholder="••••••••"
                    />
                  </div>
                  {passwordForm.formState.errors.confirmPassword && (
                    <p className="text-[10px] text-destructive ml-1">{passwordForm.formState.errors.confirmPassword.message}</p>
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
          </NeuCard>
        </div>
      </div>
    </div>
  );
}
