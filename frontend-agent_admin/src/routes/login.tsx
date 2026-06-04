import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { NeuCard } from "@/components/ui/neu-card";
import { Building2, Mail, Lock, ArrowRight, Eye, EyeOff, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { ApiError } from "@/lib/api-error";
import { apiLogin, tryRestoreSession, apiForgotPassword } from "@/lib/auth";

export const Route = createFileRoute("/login")({
  beforeLoad: async () => {
    const user = await tryRestoreSession();

    if (!user) return;
    throw redirect({ to: user.role === "ADMIN" ? "/admin" : "/agent" });
  },
  head: () => ({
    meta: [
      { title: "Connexion — Rawabet Espace Agent/Admin" },
      { name: "description", content: "Connectez-vous pour accéder à votre espace." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isForgotMode, setIsForgotMode] = useState(false);
  const navigate = useNavigate();

  async function handleForgotSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email) {
      toast.error("Veuillez saisir votre email.");
      return;
    }
    setLoading(true);
    try {
      const message = await apiForgotPassword(email, "ADMIN_AGENT");
      toast.success(message);
      setIsForgotMode(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de la demande.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Merci de remplir tous les champs.");
      return;
    }
    setLoading(true);
    try {
      const user = await apiLogin(email, password, rememberMe);

      toast.success(`Bienvenue, ${user.firstName} !`);

      if (user.role === "ADMIN") {
        navigate({ to: "/admin" });
      } else {
        navigate({ to: "/agent" });
      }
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        const detail = err.details ? ` ${err.details}` : "";
        toast.error(`${err.message}${detail}`);
      } else {
        toast.error(err instanceof Error ? err.message : "Identifiants incorrects.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-ghost relative overflow-hidden flex items-center justify-center px-4 py-12">
      {/* Decorative blurs */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-honeydew/40 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-vanilla/40 blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-72 h-72 rounded-full bg-alice/40 blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-3 justify-center mb-8">
          <div className="w-12 h-12 rounded-2xl neu-sm flex items-center justify-center bg-eerie text-white">
            <Building2 size={20} />
          </div>
          <div className="text-center">
            <div className="font-bold text-lg leading-none">Rawabet Admin</div>
            <div className="text-xs text-muted-foreground mt-1">Espace de gestion CRM</div>
          </div>
        </Link>

        <NeuCard size="lg" className="flex flex-col gap-6">
          {isForgotMode ? (
            <>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">
                  Mot de passe oublié
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Saisissez votre email pour recevoir un lien de réinitialisation.
                </p>
              </div>

              <form onSubmit={handleForgotSubmit} className="flex flex-col gap-4">
                <Field icon={<Mail size={16} />} label="Email">
                  <input
                    className="input-neu pl-10"
                    type="email"
                    placeholder="votre@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </Field>

                <button
                  type="submit"
                  disabled={loading}
                  className="neu-pressable bg-eerie text-ghost rounded-md py-3 text-sm font-semibold flex items-center justify-center gap-2 mt-2 disabled:opacity-60 cursor-pointer"
                >
                  {loading ? "Envoi en cours…" : "Envoyer le lien"}
                  <KeyRound size={16} />
                </button>

                <button
                  type="button"
                  onClick={() => setIsForgotMode(false)}
                  className="text-xs text-muted-foreground hover:text-eerie transition-colors mt-2"
                >
                  Retour à la connexion
                </button>
              </form>
            </>
          ) : (
            <>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">
                  Bon retour parmi nous
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Connectez-vous pour accéder à votre espace.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <Field icon={<Mail size={16} />} label="Email (test: admin ou agent)">
                  <input
                    className="input-neu pl-10"
                    type="email"
                    placeholder="admin@... ou agent@..."
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                  />
                </Field>

                <Field icon={<Lock size={16} />} label="Mot de passe">
                  <input
                    className="input-neu pl-10 pr-10 w-full"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-eerie transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </Field>

                <div className="flex items-center justify-between text-xs">
                  <label className="flex items-center gap-2 cursor-pointer text-muted-foreground">
                    <input
                      type="checkbox"
                      className="accent-eerie"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                    />
                    Se souvenir de moi
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsForgotMode(true)}
                    className="text-eerie hover:underline font-medium cursor-pointer"
                  >
                    Mot de passe oublié ?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="neu-pressable bg-eerie text-ghost rounded-md py-3 text-sm font-semibold flex items-center justify-center gap-2 mt-2 disabled:opacity-60 cursor-pointer"
                >
                  {loading ? "Patientez…" : "Se connecter"}
                  <ArrowRight size={16} />
                </button>
              </form>

              <div className="relative text-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <span className="relative bg-ghost px-3 text-xs text-muted-foreground">
                  ou continuez avec
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  className="neu-sm neu-pressable py-2.5 text-sm font-medium rounded-md cursor-pointer"
                >
                  Google
                </button>
                <button
                  type="button"
                  className="neu-sm neu-pressable py-2.5 text-sm font-medium rounded-md cursor-pointer"
                >
                  Apple
                </button>
              </div>
            </>
          )}
        </NeuCard>

        <p className="text-center text-xs text-muted-foreground mt-6">
          <Link to="/" className="hover:underline">← Retour à l'accueil</Link>
        </p>
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
