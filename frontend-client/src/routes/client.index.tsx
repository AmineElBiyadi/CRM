import { createFileRoute, Link } from "@tanstack/react-router";
import { NeuCard } from "@/components/ui/neu-card";
import { Avatar, SoftBadge } from "@/components/ui/design-bits";
import { CheckCircle2, Circle, MessageCircle, CalendarPlus, Upload, FileText, MapPin, Clock } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/client/")({
  component: ClientHome,
});

const steps = [
  { label: "Profil créé", done: true },
  { label: "Recherche", done: true },
  { label: "Visite", done: true, active: true },
  { label: "Négociation", done: false },
  { label: "Contrat", done: false },
  { label: "Clôturé", done: false },
];

function ClientHome() {
  return (
    <div className="space-y-6 md:space-y-8 max-w-[1200px]">
      {/* Greeting */}
      <NeuCard className="flex flex-col md:flex-row items-center gap-6 bg-alice/40">
        <Avatar name="Karim Benchekroun" size={72} />
        <div className="flex-1 text-center md:text-left">
          <p className="text-sm text-muted-foreground">Bienvenue</p>
          <h1 className="text-2xl md:text-3xl font-bold mt-1">Bonjour M. Benchekroun 👋</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Votre dossier est suivi par <span className="font-semibold text-eerie">Sara El Idrissi</span>.
          </p>
        </div>
        <Link
          to="/client/assistant"
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-eerie text-ghost text-sm font-medium hover:opacity-90"
        >
          <MessageCircle size={16} /> Contacter Sara
        </Link>
      </NeuCard>

      {/* Stepper */}
      <NeuCard>
        <h2 className="font-semibold mb-6">Avancement de votre dossier</h2>
        <div className="flex items-center overflow-x-auto soft-scroll pb-2">
          {steps.map((s, i) => (
            <div key={s.label} className="flex-1 min-w-[100px] flex items-center last:flex-none">
              <button
                onClick={() => toast(`Étape : ${s.label}${s.done ? " — terminée" : s.active ? " — en cours" : " — à venir"}`)}
                className="flex flex-col items-center gap-2 group"
              >
                <div className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${
                  s.active ? "bg-honeydew ring-4 ring-honeydew/30 animate-pulse" :
                  s.done ? "bg-eerie text-ghost" : "neu-inset"
                }`}>
                  {s.done ? <CheckCircle2 size={18} /> : <Circle size={16} className="opacity-40" />}
                </div>
                <span className={`text-xs text-center max-w-[80px] ${s.active ? "font-bold" : s.done ? "" : "text-muted-foreground"}`}>{s.label}</span>
              </button>
              {i < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 ${s.done ? "bg-eerie" : "bg-border"}`} />
              )}
            </div>
          ))}
        </div>
      </NeuCard>

      <div className="grid md:grid-cols-2 gap-6">
        <NeuCard className="bg-vanilla/40">
          <SoftBadge tone="warn" className="mb-3">Prochaine étape</SoftBadge>
          <h3 className="font-bold text-lg">Préparation de l'offre d'achat</h3>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            Sara prépare avec vous une proposition financière sur le bien d'Anfa.
            Vous recevrez le brouillon par email avant signature.
          </p>
        </NeuCard>

        <NeuCard>
          <div className="flex items-center justify-between mb-3">
            <SoftBadge tone="info"><Clock size={12} /> Prochain RDV</SoftBadge>
          </div>
          <h3 className="font-bold text-lg">Visite — Bois de Boulogne</h3>
          <div className="space-y-1 mt-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2"><CalendarPlus size={14} /> Vendredi 21 nov · 16:00</div>
            <div className="flex items-center gap-2"><MapPin size={14} /> 12 rue des Pins, Casablanca</div>
          </div>
          <button
            onClick={() => toast.success("Événement ajouté à votre calendrier")}
            className="mt-4 px-4 py-2.5 rounded-lg neu-sm hover:neu-pressable text-sm font-medium flex items-center gap-2"
          >
            <CalendarPlus size={14} /> Ajouter à mon calendrier
          </button>
        </NeuCard>
      </div>

      <NeuCard>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h3 className="font-bold flex items-center gap-2"><FileText size={16} /> Documents</h3>
          <div className="flex gap-2 text-xs">
            <SoftBadge tone="success">3 reçus</SoftBadge>
            <SoftBadge tone="danger">2 manquants</SoftBadge>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Il manque encore : <span className="text-destructive font-medium">Justificatif de revenus 2024</span>, <span className="text-destructive font-medium">Pré-accord bancaire</span>
        </p>
        <Link
          to="/client/documents"
          className="px-5 py-3 rounded-xl bg-eerie text-ghost text-sm font-medium hover:opacity-90 inline-flex items-center gap-2"
        >
          <Upload size={16} /> Uploader un document
        </Link>
      </NeuCard>
    </div>
  );
}
