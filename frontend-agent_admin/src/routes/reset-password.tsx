import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { NeuCard } from "@/components/ui/neu-card";
import { Building2, Lock, ArrowRight, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { apiResetPassword } from "@/lib/auth";

export const Route = createFileRoute("/reset-password")({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      token: (search.token as string) || "",
    };
  },
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const { token } = Route.useSearch();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token) {
      toast.error("Jeton de réinitialisation manquant.");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);
    try {
      const message = await apiResetPassword(token, newPassword);
      toast.success(message);
      setSuccess(true);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de la réinitialisation.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-ghost flex items-center justify-center px-4">
        <NeuCard className="max-w-md w-full text-center flex flex-col gap-6 py-12">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-honeydew flex items-center justify-center text-eerie">
              <CheckCircle2 size={32} />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold">Mot de passe réinitialisé !</h1>
            <p className="text-muted-foreground mt-2">
              Votre mot de passe a été mis à jour avec succès. Vous pouvez maintenant vous connecter.
            </p>
          </div>
          <button
            onClick={() => navigate({ to: "/login" })}
            className="neu-pressable bg-eerie text-ghost rounded-md py-3 font-semibold"
          >
            Aller à la connexion
          </button>
        </NeuCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ghost relative overflow-hidden flex items-center justify-center px-4 py-12">
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-honeydew/40 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-vanilla/40 blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md">
        <div className="flex items-center gap-3 justify-center mb-8">
          <div className="w-12 h-12 rounded-2xl neu-sm flex items-center justify-center bg-eerie text-white">
            <Building2 size={20} />
          </div>
          <div className="font-bold text-lg">Rawabet</div>
        </div>

        <NeuCard size="lg" className="flex flex-col gap-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Nouveau mot de passe
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Choisissez un mot de passe sécurisé pour votre compte.
            </p>
          </div>

          {!token ? (
            <div className="p-4 bg-alice/50 rounded-lg text-sm text-eerie border border-alice">
              Lien de réinitialisation invalide. Veuillez recommencer la procédure.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <Field icon={<Lock size={16} />} label="Nouveau mot de passe">
                <input
                  className="input-neu pl-10 pr-10 w-full"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </Field>

              <Field icon={<Lock size={16} />} label="Confirmer le mot de passe">
                <input
                  className="input-neu pl-10 w-full"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </Field>

              <button
                type="submit"
                disabled={loading}
                className="neu-pressable bg-eerie text-ghost rounded-md py-3 text-sm font-semibold flex items-center justify-center gap-2 mt-2 disabled:opacity-60"
              >
                {loading ? "Réinitialisation…" : "Changer le mot de passe"}
                <ArrowRight size={16} />
              </button>
            </form>
          )}
        </NeuCard>
      </div>
    </div>
  );
}

function Field({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          {icon}
        </span>
        {children}
      </div>
    </label>
  );
}
