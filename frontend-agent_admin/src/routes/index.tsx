import { createFileRoute, Link } from "@tanstack/react-router";
import { NeuCard } from "@/components/ui/neu-card";
import { Shield, UserCog, User, ArrowRight, Sparkles } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SmartEstateHub — CRM immobilier nouvelle génération" },
      { name: "description", content: "Plateforme CRM 3-en-1 pour directeurs d'agence, agents commerciaux et clients : pipeline, IA, automatisations." },
    ],
  }),
  component: Landing,
});

const spaces = [
  { to: "/admin", label: "Admin", role: "Directeur d'agence", desc: "Pilote ton agence : agents, pipeline global, automatisations et analytique.", Icon: Shield, accent: "bg-alice" },
  { to: "/agent", label: "Agent", role: "Commercial", desc: "Dossiers clients, recommandations IA, calendrier et signatures.", Icon: UserCog, accent: "bg-honeydew" },
];

function Landing() {
  return (
    <div className="min-h-screen bg-ghost relative overflow-hidden">
      {/* Decorative blurs */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-honeydew/40 blur-3xl pointer-events-none" />
      <div className="absolute top-40 -right-32 w-96 h-96 rounded-full bg-vanilla/40 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 w-96 h-96 rounded-full bg-alice/40 blur-3xl pointer-events-none" />

      <div className="relative max-w-6xl mx-auto px-6 py-16">
        <header className="flex items-center justify-between mb-20">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl neu-sm flex items-center justify-center bg-vanilla">
              <Sparkles size={20} className="text-eerie" strokeWidth={1.8} />
            </div>
            <div>
              <div className="font-bold text-lg">SmartEstateHub</div>
              <div className="text-xs text-muted-foreground">CRM immobilier</div>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2 text-xs px-4 py-2 rounded-full neu-sm">
            <span className="w-2 h-2 rounded-full bg-honeydew" />
            v1.0 · prototype
          </div>
        </header>

        <section className="text-center mb-16 max-w-3xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold leading-[1.05] tracking-tight">
            Le CRM immobilier qui pense
            <span className="block italic font-serif text-eerie/70"> à votre place.</span>
          </h1>
          <p className="mt-6 text-muted-foreground text-lg max-w-xl mx-auto">
            Trois espaces parfaitement orchestrés. Une expérience douce, claire, augmentée par l'IA.
            Choisissez le vôtre pour entrer.
          </p>
        </section>

        <div className="grid md:grid-cols-2 max-w-4xl mx-auto gap-6">
          {spaces.map(({ to, label, role, desc, Icon, accent }) => (
            <Link key={to} to={to}>
              <NeuCard pressable size="lg" className="h-full flex flex-col gap-5">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${accent}`}>
                  <Icon size={24} className="text-eerie" strokeWidth={1.8} />
                </div>
                <div>
                  <div className="text-xs uppercase tracking-widest text-muted-foreground">{role}</div>
                  <h2 className="text-2xl font-bold mt-1">{label}</h2>
                </div>
                <p className="text-sm text-muted-foreground flex-1">{desc}</p>
                <div className="flex items-center justify-between pt-2">
                  <span className="text-sm font-medium">Entrer</span>
                  <div className="w-9 h-9 rounded-full neu-sm flex items-center justify-center">
                    <ArrowRight size={16} />
                  </div>
                </div>
              </NeuCard>
            </Link>
          ))}
        </div>

        <footer className="mt-20 text-center text-xs text-muted-foreground">
          Palette douce · neumorphisme · glass · pensé pour des agences exigeantes.
          <Link to="/design-system" className="block mt-3 text-eerie hover:underline font-medium">
            Voir le Design System →
          </Link>
        </footer>
      </div>
    </div>
  );
}
