import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useClientData, useUpdateProfile } from "@/hooks/use-client-data";
import { NeuCard } from "@/components/ui/neu-card";
import { Avatar, SoftBadge } from "@/components/ui/design-bits";
import { User, Mail, Phone, ShieldCheck, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

export const Route = createFileRoute("/client/profil")({
  component: ClientProfilePage,
});

const profileSchema = z.object({
  firstName: z.string().min(2, "Le prénom est trop court"),
  lastName: z.string().min(2, "Le nom est trop court"),
  email: z.string().email("Email invalide"),
  phone: z.string().min(10, "Numéro de téléphone invalide"),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

function ClientProfilePage() {
  const { data, isLoading } = useClientData();
  const updateProfile = useUpdateProfile();
  
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
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

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center p-12">
        <Loader2 className="animate-spin text-vanilla" size={32} />
      </div>
    );
  }

  const profile = data?.profile;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4 mb-2">
        <div className="w-12 h-12 rounded-2xl bg-vanilla flex items-center justify-center neu-sm text-eerie">
          <User size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Mon Profil</h1>
          <p className="text-sm text-muted-foreground">Gérez vos informations personnelles</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Sidebar Info */}
        <div className="md:col-span-1 space-y-6">
          <NeuCard className="flex flex-col items-center text-center p-8 bg-alice/20">
            <Avatar name={`${profile?.firstName} ${profile?.lastName}`} size={96} className="ring-4 ring-vanilla/30" />
            <h2 className="mt-4 font-bold text-lg">{profile?.firstName} {profile?.lastName}</h2>
            <SoftBadge tone="info" className="mt-1">Client Premium</SoftBadge>
            <div className="mt-6 w-full pt-6 border-t border-border/50 space-y-4">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <ShieldCheck size={16} className="text-honeydew-dark" />
                <span>Compte vérifié</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <User size={16} />
                <span>Membre depuis {new Date(profile?.idClient ? parseInt(profile.idClient.substring(0, 8), 16) * 1000 : Date.now()).getFullYear()}</span>
              </div>
            </div>
          </NeuCard>

          <NeuCard className="p-6 bg-vanilla/10 border-vanilla/20">
            <h3 className="text-xs font-bold uppercase tracking-widest text-eerie/60 mb-4 text-center">Sécurité</h3>
            <p className="text-[11px] text-muted-foreground text-center leading-relaxed italic">
              Vos données sont chiffrées et sécurisées conformément aux normes de protection de la vie privée.
            </p>
          </NeuCard>
        </div>

        {/* Main Form */}
        <NeuCard className="md:col-span-2 p-8">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-eerie/70 ml-1">Prénom</label>
                <div className="relative group">
                  <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-eerie transition-colors" />
                  <input
                    {...form.register("firstName")}
                    className="w-full pl-11 pr-4 py-3 rounded-xl neu-inset bg-transparent text-sm focus:outline-none transition-all"
                    placeholder="Votre prénom"
                  />
                </div>
                {form.formState.errors.firstName && (
                  <p className="text-[10px] text-destructive ml-1">{form.formState.errors.firstName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-eerie/70 ml-1">Nom</label>
                <div className="relative group">
                  <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-eerie transition-colors" />
                  <input
                    {...form.register("lastName")}
                    className="w-full pl-11 pr-4 py-3 rounded-xl neu-inset bg-transparent text-sm focus:outline-none transition-all"
                    placeholder="Votre nom"
                  />
                </div>
                {form.formState.errors.lastName && (
                  <p className="text-[10px] text-destructive ml-1">{form.formState.errors.lastName.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-eerie/70 ml-1">Email</label>
              <div className="relative group">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-eerie transition-colors" />
                <input
                  {...form.register("email")}
                  type="email"
                  className="w-full pl-11 pr-4 py-3 rounded-xl neu-inset bg-transparent text-sm focus:outline-none transition-all"
                  placeholder="votre@email.com"
                />
              </div>
              {form.formState.errors.email && (
                <p className="text-[10px] text-destructive ml-1">{form.formState.errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-eerie/70 ml-1">Téléphone</label>
              <div className="relative group">
                <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-eerie transition-colors" />
                <input
                  {...form.register("phone")}
                  className="w-full pl-11 pr-4 py-3 rounded-xl neu-inset bg-transparent text-sm focus:outline-none transition-all"
                  placeholder="06 12 34 56 78"
                />
              </div>
              {form.formState.errors.phone && (
                <p className="text-[10px] text-destructive ml-1">{form.formState.errors.phone.message}</p>
              )}
            </div>

            <div className="pt-4 flex items-center justify-between">
              <p className="text-[10px] text-muted-foreground italic flex-1 mr-4">
                Dernière modification : {profile?.status === "ACTIVE" ? "Récemment" : "Jamais"}
              </p>
              <button
                type="submit"
                disabled={updateProfile.isPending}
                className="flex items-center gap-2 px-8 py-3 rounded-xl bg-eerie text-ghost text-sm font-bold shadow-xl hover:opacity-90 disabled:opacity-50 transition-all active:scale-95"
              >
                {updateProfile.isPending ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                Enregistrer les modifications
              </button>
            </div>
          </form>
        </NeuCard>
      </div>
    </div>
  );
}
