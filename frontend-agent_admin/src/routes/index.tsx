import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { NeuCard } from "@/components/ui/neu-card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Sparkles,
  ArrowRight,
  Brain,
  Bell,
  FileSignature,
  LayoutDashboard,
  Search,
  BarChart3,
  Check,
  Star,
  Plus,
  Minus,
  AlertTriangle,
  Clock,
  EyeOff,
  MessageSquareWarning,
  Mail,
  Twitter,
  Linkedin,
  Github,
  Phone,
  User as UserIcon,
  Building2,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Rawabet — Le CRM immobilier qui close pour vous" },
      {
        name: "description",
        content:
          "CRM immobilier propulsé par l'IA pour agents et directeurs d'agence. Scoring de leads, relances automatiques, contrats, portail client. Closez plus, gérez moins.",
      },
      { property: "og:title", content: "Rawabet — CRM immobilier IA pour agents et agences" },
      {
        property: "og:description",
        content: "Closez plus de mandats. Laissez l'IA gérer le reste.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-ghost relative">
      {/* Decorative blurs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-honeydew/40 blur-3xl" />
        <div className="absolute top-[600px] -right-32 w-[28rem] h-[28rem] rounded-full bg-vanilla/40 blur-3xl" />
        <div className="absolute top-[1400px] left-1/4 w-96 h-96 rounded-full bg-alice/40 blur-3xl" />
        <div className="absolute top-[2400px] -right-32 w-96 h-96 rounded-full bg-honeydew/40 blur-3xl" />
      </div>

      <Header />
      <main className="relative">
        <Hero />
        <Problem />
        <Features />
        <HowItWorks />
        <Testimonials />
        <Pricing />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}

/* ---------- Header ---------- */

function Header() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-ghost/70 backdrop-blur-md border-b border-border/50 py-3 shadow-sm"
          : "bg-transparent py-6"
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl neu-sm flex items-center justify-center bg-eerie text-white">
            <Building2 size={20} />
          </div>
          <div>
            <div className="font-bold text-base leading-none">Rawabet</div>
            <div className="text-[11px] text-muted-foreground mt-1">CRM immobilier</div>
          </div>
        </Link>
        <nav className="hidden md:flex items-center gap-7 text-sm text-muted-foreground">
          <a href="#features" className="hover:text-eerie transition-colors">Fonctionnalités</a>
          <a href="#how" className="hover:text-eerie transition-colors">Comment ça marche</a>
          <a href="#pricing" className="hover:text-eerie transition-colors">Tarifs</a>
          <a href="#faq" className="hover:text-eerie transition-colors">FAQ</a>
        </nav>
        <div className="flex items-center gap-2">
          <Link
            to="/login"
            className="hidden sm:inline-flex px-4 py-2 text-sm font-medium text-eerie hover:underline"
          >
            Connexion
          </Link>
          <AccessModal>
            <button className="neu-pressable bg-eerie text-ghost rounded-md px-4 py-2 text-sm font-semibold inline-flex items-center gap-2 cursor-pointer">
              Demander un accès <ArrowRight size={14} />
            </button>
          </AccessModal>
        </div>
      </div>
    </header>
  );
}

/* ---------- 1. Hero ---------- */

function Hero() {
  return (
    <section className="relative max-w-6xl mx-auto px-6 pt-16 pb-24 text-center">
      <div className="inline-flex items-center gap-2 text-xs px-4 py-2 rounded-full neu-sm mb-8">
        <span className="w-2 h-2 rounded-full bg-honeydew" />
        Nouveau · Scoring de leads par IA
      </div>
        <h1 className="text-5xl md:text-7xl font-bold leading-[1.05] tracking-tight max-w-4xl mx-auto">
          Faites grandir votre agence.
          <span className="block italic font-serif text-eerie/70">L'IA s'occupe du reste.</span>
        </h1>
      <p className="mt-7 text-muted-foreground text-lg max-w-2xl mx-auto">
        Rawabet donne à votre agence les outils que les grands réseaux ont :
        scoring IA, relances automatiques, pipeline clair et portail client.
        Conçu pour les directeurs d'agence qui veulent faire grandir leur équipe,
        pas gérer cinq outils différents.
      </p>
      <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3">
        <AccessModal>
          <button className="neu-pressable bg-eerie text-ghost rounded-md px-6 py-3 text-sm font-semibold inline-flex items-center gap-2 cursor-pointer">
            Nous contacter <ArrowRight size={16} />
          </button>
        </AccessModal>
        <a
          href="#how"
          className="neu-sm neu-pressable bg-ghost rounded-md px-6 py-3 text-sm font-semibold inline-flex items-center gap-2"
        >
          Voir comment ça marche
        </a>
      </div>
      <p className="mt-4 text-xs text-muted-foreground">
        Réponse sous 24h · Setup complet en une journée · Accompagnement inclus
      </p>

      {/* Product mock */}
      <div className="mt-16 relative max-w-5xl mx-auto">
        <NeuCard size="lg" className="p-0 overflow-hidden">
          <div className="bg-alice/40 px-5 py-3 flex items-center gap-2 border-b border-border/50">
            <span className="w-3 h-3 rounded-full bg-[oklch(0.78_0.15_25)]" />
            <span className="w-3 h-3 rounded-full bg-vanilla" />
            <span className="w-3 h-3 rounded-full bg-honeydew" />
            <span className="ml-4 text-xs text-muted-foreground">app.rawabet.fr/agent</span>
          </div>
          <div className="p-6 grid md:grid-cols-3 gap-4 bg-ghost">
            {[
              { label: "Leads chauds", value: "24", delta: "+6 cette semaine", tone: "bg-vanilla" },
              { label: "Mandats signés", value: "12", delta: "+2 ce mois", tone: "bg-honeydew" },
              { label: "Pipeline", value: "1,4 M€", delta: "+18% vs M-1", tone: "bg-alice" },
            ].map((s) => (
              <div key={s.label} className="neu-sm p-5 rounded-xl text-left">
                <div className="text-xs text-muted-foreground">{s.label}</div>
                <div className="text-3xl font-bold mt-1">{s.value}</div>
                <div className={`inline-block mt-3 text-[11px] px-2 py-1 rounded-full ${s.tone} text-eerie`}>
                  {s.delta}
                </div>
              </div>
            ))}
            <div className="md:col-span-3 neu-inset p-5 rounded-xl text-left">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm font-semibold">Recommandations IA</div>
                <span className="text-[11px] text-muted-foreground">il y a 2 min</span>
              </div>
              <div className="space-y-2 text-sm">
                {[
                  "Relancer Mme Bernard — score passé de 62 à 84",
                  "Proposer le bien #1129 à M. Lopez (match 92%)",
                  "Préparer le compromis pour la villa de Saint-Cloud",
                ].map((t) => (
                  <div key={t} className="flex items-center gap-2 text-eerie">
                    <span className="w-1.5 h-1.5 rounded-full bg-eerie/60" />
                    {t}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </NeuCard>
      </div>
    </section>
  );
}

/* ---------- 2. Problem ---------- */

const problems = [
  { Icon: AlertTriangle, title: "Des leads qui s'évaporent", desc: "Un prospect chaud reçoit une réponse 48h plus tard. Il a déjà signé ailleurs." },
  { Icon: Clock, title: "Des relances oubliées", desc: "Vous savez qu'il faut relancer. Vous le notez. Vous oubliez. Le mandat passe." },
  { Icon: EyeOff, title: "Zéro visibilité pipeline", desc: "Combien de dossiers actifs ce mois ? Aucun manager ne sait répondre sans Excel." },
  { Icon: MessageSquareWarning, title: "Contrats en vrac", desc: "WhatsApp, mail, drive, papier. Le compromis prend 3 semaines au lieu de 3 jours." },
];

function Problem() {
  return (
    <section className="relative max-w-6xl mx-auto px-6 py-24">
      <div className="text-center max-w-2xl mx-auto mb-14">
        <div className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Le problème</div>
        <h2 className="text-4xl md:text-5xl font-bold leading-tight">
          Vous ne perdez pas des ventes.
          <span className="block italic font-serif text-eerie/70">Vous perdez du temps.</span>
        </h2>
        <p className="mt-5 text-muted-foreground">
          La plupart des directeurs d'agence gèrent leur activité avec 5 outils différents
          qui ne se parlent pas. Sans visibilité sur le pipeline, impossible de piloter
          la croissance.
        </p>
      </div>
      <div className="grid md:grid-cols-2 gap-5">
        {problems.map(({ Icon, title, desc }) => (
          <NeuCard key={title} size="md" className="flex gap-4">
            <div className="w-11 h-11 rounded-xl neu-sm flex items-center justify-center bg-ghost shrink-0">
              <Icon size={18} className="text-eerie" strokeWidth={1.8} />
            </div>
            <div>
              <div className="font-semibold">{title}</div>
              <p className="text-sm text-muted-foreground mt-1">{desc}</p>
            </div>
          </NeuCard>
        ))}
      </div>
    </section>
  );
}

/* ---------- 3. Features ---------- */

const features = [
  { Icon: Brain, accent: "bg-vanilla", title: "Lead Scoring IA", desc: "Chaque prospect reçoit un score de 0 à 100 mis à jour en temps réel. Vous savez qui appeler en premier." },
  { Icon: Bell, accent: "bg-honeydew", title: "Relances automatiques", desc: "Séquences mail et SMS personnalisées qui se déclenchent au bon moment, sans intervention." },
  { Icon: FileSignature, accent: "bg-alice", title: "Gestion de contrats", desc: "Mandats, compromis, baux : générés, envoyés et signés en ligne. Archivage automatique." },
  { Icon: LayoutDashboard, accent: "bg-honeydew", title: "Portail client", desc: "Chaque client suit son dossier, dépose ses documents et discute avec un assistant IA 24/7." },
  { Icon: Search, accent: "bg-vanilla", title: "Recherche de biens", desc: "Matching automatique entre besoins clients et biens du portefeuille. Recommandations IA." },
  { Icon: BarChart3, accent: "bg-alice", title: "Rapports hebdo", desc: "Lundi matin, vous recevez la photo de votre pipeline. Plus besoin de courir après les chiffres." },
];

function Features() {
  return (
    <section id="features" className="relative max-w-6xl mx-auto px-6 py-24">
      <div className="text-center max-w-2xl mx-auto mb-14">
        <div className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Fonctionnalités</div>
        <h2 className="text-4xl md:text-5xl font-bold leading-tight">
          Tout ce qu'il faut pour piloter votre agence.
          <span className="block italic font-serif text-eerie/70">Rien de plus.</span>
        </h2>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map(({ Icon, accent, title, desc }) => (
          <NeuCard key={title} size="md" className="flex flex-col gap-4 h-full">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${accent}`}>
              <Icon size={20} className="text-eerie" strokeWidth={1.8} />
            </div>
            <div>
              <div className="text-lg font-bold">{title}</div>
              <p className="text-sm text-muted-foreground mt-2">{desc}</p>
            </div>
          </NeuCard>
        ))}
      </div>
    </section>
  );
}

/* ---------- 4. How it works ---------- */

const steps = [
  { n: "01", title: "Contactez notre équipe", desc: "Remplissez le formulaire, nous revenons vers vous sous 24h pour comprendre vos besoins." },
  { n: "02", title: "Nous créons votre compte", desc: "Votre espace admin est configuré sur-mesure. Vous recevez vos identifiants et les accès agents." },
  { n: "03", title: "Vous paramétrez votre agence", desc: "Changez votre mot de passe, invitez vos agents, importez vos clients. On vous accompagne." },
  { n: "04", title: "Vos agents closent", desc: "Plateforme complète dès le premier jour. Scoring IA, relances auto, pipeline — tout est là." },
];

function HowItWorks() {
  return (
    <section id="how" className="relative max-w-6xl mx-auto px-6 py-24">
      <div className="text-center max-w-2xl mx-auto mb-14">
        <div className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Comment ça marche</div>
        <h2 className="text-4xl md:text-5xl font-bold leading-tight">
          Votre agence opérationnelle
          <span className="italic font-serif text-eerie/70"> en une journée.</span>
        </h2>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
        {steps.map(({ n, title, desc }) => (
          <NeuCard key={n} size="md" className="flex flex-col gap-3 h-full">
            <div className="text-3xl font-bold text-eerie/30 font-serif">{n}</div>
            <div className="font-semibold">{title}</div>
            <p className="text-sm text-muted-foreground">{desc}</p>
          </NeuCard>
        ))}
      </div>
    </section>
  );
}

/* ---------- 5. Testimonials ---------- */

const testimonials = [
  {
    name: "Camille Reynaud",
    role: "Directrice, Agence Lumière (Lyon)",
    quote: "On a doublé notre taux de transformation en 4 mois. Mes agents sont plus productifs et je vois enfin ce qui se passe dans mon pipeline.",
  },
  {
    name: "Karim Benhaddou",
    role: "Directeur général, Urbanis (Casablanca)",
    quote: "J'ai enfin une vision claire sur l'activité de mes 12 agents. Le scoring IA nous a fait gagner un temps fou sur la qualification.",
  },
  {
    name: "Sophie Marchand",
    role: "Co-fondatrice, Côte d'Azur Estates",
    quote: "Enfin un outil qui parle le langage des agences, pas celui des consultants. Notre onboarding a été fait en une matinée avec leur équipe.",
  },
];

function Testimonials() {
  return (
    <section className="relative max-w-6xl mx-auto px-6 py-24">
      <div className="text-center max-w-2xl mx-auto mb-14">
        <div className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Ils nous font confiance</div>
        <h2 className="text-4xl md:text-5xl font-bold leading-tight">
          400+ agences,
          <span className="italic font-serif text-eerie/70"> une seule plateforme.</span>
        </h2>
      </div>
      <div className="grid md:grid-cols-3 gap-6">
        {testimonials.map((t) => (
          <NeuCard key={t.name} size="md" className="flex flex-col gap-4 h-full">
            <div className="flex gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} size={14} className="fill-vanilla text-vanilla" strokeWidth={0} />
              ))}
            </div>
            <p className="text-sm leading-relaxed">"{t.quote}"</p>
            <div className="mt-auto pt-3 border-t border-border/60">
              <div className="text-sm font-semibold">{t.name}</div>
              <div className="text-xs text-muted-foreground">{t.role}</div>
            </div>
          </NeuCard>
        ))}
      </div>
      <div className="mt-12 flex flex-wrap items-center justify-center gap-x-10 gap-y-4 text-sm text-muted-foreground">
        <span className="font-serif italic text-lg">Lumière</span>
        <span className="font-bold tracking-widest">CÔTE D'AZUR ESTATES</span>
        <span className="font-serif italic text-lg">Maison &amp; Co</span>
        <span className="font-bold tracking-widest">URBANIS</span>
        <span className="font-serif italic text-lg">Belle Pierre</span>
      </div>
    </section>
  );
}

/* ---------- 6. Pricing ---------- */

const plans = [
  {
    name: "Par Agent",
    price: "Sur devis",
    desc: "Vous payez en fonction du nombre d'agents sur la plateforme. Échelonnez vos coûts avec votre croissance.",
    features: ["Prix dégressif par agent", "Clients illimités", "Lead scoring IA", "Relances automatiques", "Portail client", "Support prioritaire"],
    cta: "Nous contacter",
    highlight: false,
  },
  {
    name: "Forfait Mensuel",
    price: "Sur devis",
    desc: "Prix fixe mensuel quel que soit le nombre d'agents. Idéal pour les agences structurées.",
    features: ["Agents illimités", "Clients illimités", "Gestion de contrats", "Rapports hebdo", "Automatisations avancées", "Onboarding dédié"],
    cta: "Nous contacter",
    highlight: true,
  },
];

function Pricing() {
  return (
    <section id="pricing" className="relative max-w-6xl mx-auto px-6 py-24">
      <div className="text-center max-w-2xl mx-auto mb-14">
        <div className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Tarifs</div>
        <h2 className="text-4xl md:text-5xl font-bold leading-tight">
          Simple, transparent,
          <span className="italic font-serif text-eerie/70"> sans surprise.</span>
        </h2>
        <p className="mt-5 text-muted-foreground">
          Deux modèles, un seul objectif : adapter la facturation à la structure de votre agence.
          Aucun paiement en ligne — on discute ensemble pour trouver la formule qui vous convient.
        </p>
      </div>
      <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
        {plans.map((p) => (
          <NeuCard
            key={p.name}
            size="lg"
            className={`flex flex-col gap-5 h-full ${p.highlight ? "bg-vanilla/40" : ""}`}
          >
            <div className="flex items-center justify-between">
              <div className="text-lg font-bold">{p.name}</div>
              {p.highlight && (
                <span className="text-[10px] uppercase tracking-widest bg-eerie text-ghost px-2 py-1 rounded-full font-semibold">
                  Populaire
                </span>
              )}
            </div>
            <div>
              <div className="flex items-baseline gap-1">
                {p.price === "Sur devis" ? (
                  <span className="text-3xl font-bold">Sur devis</span>
                ) : (
                  <>
                    <span className="text-4xl font-bold">{p.price}€</span>
                    <span className="text-muted-foreground text-sm">/ agent / mois</span>
                  </>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-2">{p.desc}</p>
            </div>
            <ul className="flex flex-col gap-2.5 text-sm flex-1">
              {p.features.map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-honeydew flex items-center justify-center shrink-0 mt-0.5">
                    <Check size={10} strokeWidth={3} className="text-eerie" />
                  </span>
                  <span dangerouslySetInnerHTML={{ __html: f }} />
                </li>
              ))}
            </ul>
            <AccessModal>
              <button
                className={`neu-pressable rounded-md py-3 text-sm font-semibold flex items-center justify-center gap-2 w-full cursor-pointer ${
                  p.highlight ? "bg-eerie text-ghost" : "neu-sm bg-ghost"
                }`}
              >
                {p.cta} <ArrowRight size={14} />
              </button>
            </AccessModal>
          </NeuCard>
        ))}
      </div>
    </section>
  );
}

/* ---------- 7. FAQ ---------- */

const faqs = [
  { q: "Puis-je importer mes clients existants ?", a: "Oui, l'import se fait en quelques clics depuis un CSV ou Excel. Notre équipe vous accompagne gratuitement sur la migration lors de votre onboarding." },
  { q: "Combien d'agents puis-je ajouter ?", a: "Avec le modèle Par Agent, vos coûts évoluent avec votre équipe. Avec le Forfait Mensuel, vous avez un nombre illimité d'agents pour un prix fixe." },
  { q: "Mes données sont-elles sécurisées ?", a: "Vos données sont hébergées en Europe, chiffrées au repos et en transit. Nous sommes conformes RGPD et auditons régulièrement notre infrastructure." },
  { q: "Faut-il un engagement ?", a: "Non engagement de durée. Vous pouvez résilier à tout moment avec un préavis de 30 jours. Nous préférons vous convaincre par la valeur de l'outil." },
  { q: "L'IA remplace-t-elle l'agent ?", a: "Au contraire : elle libère vos agents du temps administratif pour leur permettre de se concentrer sur la relation client. C'est un copilote, pas un pilote automatique." },
  { q: "Comment se passe l'onboarding ?", a: "Dès votre premier contact, nous vous attribuons un interlocuteur dédié. Votre compte est configuré sur-mesure, vos agents sont formés, et vous êtes opérationnels en une journée." },
  { q: "Puis-je tester avant de m'engager ?", a: "Oui, nous proposons une période de test de 14 jours après notre premier appel. Aucune carte bancaire n'est demandée — on commence par un échange humain." },
];

function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="relative max-w-3xl mx-auto px-6 py-24">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <div className="text-xs uppercase tracking-widest text-muted-foreground mb-3">FAQ</div>
        <h2 className="text-4xl md:text-5xl font-bold leading-tight">
          Les questions
          <span className="italic font-serif text-eerie/70"> qu'on nous pose le plus.</span>
        </h2>
      </div>
      <div className="flex flex-col gap-3">
        {faqs.map((f, i) => {
          const isOpen = open === i;
          return (
            <NeuCard key={f.q} size="sm" className="!p-0">
              <button
                onClick={() => setOpen(isOpen ? null : i)}
                className="w-full flex items-center justify-between gap-4 p-5 text-left"
              >
                <span className="font-medium text-sm">{f.q}</span>
                <span className="w-7 h-7 rounded-full neu-sm flex items-center justify-center shrink-0">
                  {isOpen ? <Minus size={14} /> : <Plus size={14} />}
                </span>
              </button>
              {isOpen && (
                <div className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed">{f.a}</div>
              )}
            </NeuCard>
          );
        })}
      </div>
    </section>
  );
}

/* ---------- 8. Final CTA ---------- */

function FinalCTA() {
  return (
    <section className="relative max-w-6xl mx-auto px-6 py-24">
      <NeuCard size="lg" className="bg-eerie text-ghost text-center py-16 px-6 relative overflow-hidden">
        <div className="absolute -top-20 -left-20 w-72 h-72 rounded-full bg-vanilla/20 blur-3xl" />
        <div className="absolute -bottom-20 -right-20 w-72 h-72 rounded-full bg-honeydew/20 blur-3xl" />
        <div className="relative">
          <h2 className="text-4xl md:text-5xl font-bold leading-tight max-w-2xl mx-auto">
            Prêt à transformer
            <span className="italic font-serif text-vanilla"> votre agence ?</span>
          </h2>
          <p className="mt-5 text-ghost/70 max-w-xl mx-auto">
            Rejoignez les agences qui ont cessé de courir après leurs leads et ont repris le contrôle de leur croissance.
            Première réponse sous 24h.
          </p>
          <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3">
            <AccessModal>
              <button className="bg-ghost text-eerie rounded-md px-6 py-3 text-sm font-semibold inline-flex items-center gap-2 hover:bg-vanilla transition-colors cursor-pointer">
                Demander un accès <ArrowRight size={16} />
              </button>
            </AccessModal>
            <AccessModal>
              <button className="border border-ghost/30 rounded-md px-6 py-3 text-sm font-semibold inline-flex items-center gap-2 hover:bg-ghost/10 transition-colors cursor-pointer">
                Parler à un humain
              </button>
            </AccessModal>
          </div>
        </div>
      </NeuCard>
    </section>
  );
}

/* ---------- 9. Footer ---------- */

function Footer() {
  return (
    <footer className="relative border-t border-border/60 mt-12">
      <div className="max-w-6xl mx-auto px-6 py-14 grid md:grid-cols-4 gap-10">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl neu-sm flex items-center justify-center bg-eerie text-white">
              <Building2 size={18} />
            </div>
            <div className="font-bold">Rawabet</div>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Le CRM immobilier nouvelle génération. Pensé pour les directeurs d'agence, conçu pour faire grandir les équipes.
          </p>
        </div>
        <FooterCol
          title="Produit"
          links={[
            { label: "Fonctionnalités", href: "#features" },
            { label: "Tarifs", href: "#pricing" },
            { label: "FAQ", href: "#faq" },
            { label: "Connexion", href: "/login" },
          ]}
        />
        <FooterCol
          title="Entreprise"
          links={[
            { label: "À propos", href: "#" },
            { label: "Blog", href: "#" },
            { label: "Carrières", href: "#" },
            { label: "Contact", href: "mailto:hello@rawabet.fr" },
          ]}
        />
        <FooterCol
          title="Légal"
          links={[
            { label: "Mentions légales", href: "#" },
            { label: "Confidentialité", href: "#" },
            { label: "CGU", href: "#" },
            { label: "RGPD", href: "#" },
          ]}
        />
      </div>
      <div className="border-t border-border/60">
        <div className="max-w-6xl mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <div>© {new Date().getFullYear()} Rawabet. Tous droits réservés.</div>
          <div className="flex items-center gap-4">
            <a href="mailto:hello@rawabet.fr" className="hover:text-eerie"><Mail size={14} /></a>
            <a href="#" className="hover:text-eerie"><Twitter size={14} /></a>
            <a href="#" className="hover:text-eerie"><Linkedin size={14} /></a>
            <a href="#" className="hover:text-eerie"><Github size={14} /></a>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-widest text-eerie font-semibold mb-4">{title}</div>
      <ul className="flex flex-col gap-2.5 text-sm text-muted-foreground">
        {links.map((l) => (
          <li key={l.label}>
            <a href={l.href} className="hover:text-eerie transition-colors">{l.label}</a>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------- 10. Access Modal ---------- */

function AccessModal({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<"choice" | "form">("choice");
  
  return (
    <Dialog onOpenChange={(open) => { if (!open) setMode("choice"); }}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md border-border bg-ghost p-6">
        <DialogHeader>
          <DialogTitle className="text-xl">Demander un accès</DialogTitle>
          <DialogDescription>
            {mode === "choice" 
              ? "Comment préférez-vous échanger avec notre équipe ?"
              : "Remplissez ce formulaire et nous vous contacterons sous 24h."}
          </DialogDescription>
        </DialogHeader>
        
        {mode === "choice" ? (
          <div className="grid gap-4 py-4">
            <button 
              onClick={() => setMode("form")}
              className="flex items-center gap-4 p-4 rounded-xl border border-border bg-ghost hover:bg-vanilla/20 transition-colors text-left group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-full neu-sm flex items-center justify-center bg-vanilla shrink-0 group-hover:scale-105 transition-transform">
                <FileSignature size={18} className="text-eerie" />
              </div>
              <div>
                <div className="font-semibold text-eerie">Remplir le formulaire</div>
                <div className="text-xs text-muted-foreground mt-0.5">Laissez-nous vos coordonnées, on vous rappelle.</div>
              </div>
            </button>
            
            <a 
              href="tel:+33123456789"
              className="flex items-center gap-4 p-4 rounded-xl border border-border bg-ghost hover:bg-honeydew/20 transition-colors text-left group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-full neu-sm flex items-center justify-center bg-honeydew shrink-0 group-hover:scale-105 transition-transform">
                <Phone size={18} className="text-eerie" />
              </div>
              <div>
                <div className="font-semibold text-eerie">Appeler un conseiller</div>
                <div className="text-xs text-muted-foreground mt-0.5">Échangez de vive voix immédiatement.</div>
              </div>
            </a>
          </div>
        ) : (
          <form className="flex flex-col gap-4 py-4" onSubmit={(e) => { e.preventDefault(); alert("Formulaire envoyé ! Nous vous recontacterons bientôt."); }}>
            <Field icon={<UserIcon size={16} />} label="Nom complet">
              <input type="text" className="input-neu pl-10" placeholder="Jeanne Dupont" required />
            </Field>
            
            <Field icon={<Building2 size={16} />} label="Agence">
              <input type="text" className="input-neu pl-10" placeholder="Nom de l'agence" required />
            </Field>
            
            <Field icon={<Mail size={16} />} label="Email professionnel">
              <input type="email" className="input-neu pl-10" placeholder="jeanne@agence.fr" required />
            </Field>
            
            <Field icon={<Phone size={16} />} label="Téléphone">
              <input type="tel" className="input-neu pl-10" placeholder="06 12 34 56 78" required />
            </Field>

            <div className="flex items-center gap-3 mt-4">
              <button type="button" onClick={() => setMode("choice")} className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-eerie cursor-pointer">
                Retour
              </button>
              <button type="submit" className="flex-1 neu-pressable bg-eerie text-ghost rounded-md py-2.5 text-sm font-semibold cursor-pointer">
                Envoyer la demande
              </button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
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
