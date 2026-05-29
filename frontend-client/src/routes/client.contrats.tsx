import { createFileRoute } from "@tanstack/react-router";
import { NeuCard } from "@/components/ui/neu-card";
import { SoftBadge } from "@/components/ui/design-bits";
import { FileSignature, ShieldCheck, AlertTriangle, Coins, FileText, Download, Loader2 } from "lucide-react";
import { useClientData } from "@/hooks/use-client-data";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export const Route = createFileRoute("/client/contrats")({
  component: ClientContracts,
});

function ClientContracts() {
  const { data, isLoading } = useClientData();

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center p-12">
        <Loader2 className="animate-spin text-vanilla" size={32} />
      </div>
    );
  }

  const contracts = data?.contracts || [];

  const formatPrice = (p?: number) => p ? new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD', maximumFractionDigits: 0 }).format(p) : "--";

  return (
    <div className="space-y-8 max-w-[1000px]">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Mes contrats</h1>
        <p className="text-sm text-muted-foreground mt-1">Suivi de vos engagements et signatures</p>
      </div>

      <div className="grid gap-6">
        {contracts.map((c) => (
          <NeuCard key={c.idContract} className="grid md:grid-cols-[1fr_300px] gap-8">
            <div className="space-y-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-honeydew flex items-center justify-center text-eerie">
                    <FileSignature size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Compromis de vente</h3>
                    <p className="text-sm text-muted-foreground">Créé le {format(new Date(c.createdAt), "d MMMM yyyy", { locale: fr })}</p>
                  </div>
                </div>
                <SoftBadge tone={c.status === "SIGNED" ? "success" : "warn"}>{c.status}</SoftBadge>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="neu-inset p-4 rounded-2xl">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider mb-1">
                    <Coins size={14} /> Prix convenu
                  </div>
                  <div className="text-lg font-bold">{formatPrice(c.agreedPrice)}</div>
                </div>
                <div className="neu-inset p-4 rounded-2xl">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider mb-1">
                    <ShieldCheck size={14} /> Dépôt de garantie
                  </div>
                  <div className="text-lg font-bold">{formatPrice(c.depositAmount)}</div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <FileText size={16} /> Documents liés
                </h4>
                <div className="flex flex-wrap gap-2">
                  <button className="px-4 py-2 rounded-xl neu-sm hover:neu-pressable text-xs font-medium flex items-center gap-2">
                    <Download size={14} /> Projet_Compromis.pdf
                  </button>
                  <button className="px-4 py-2 rounded-xl neu-sm hover:neu-pressable text-xs font-medium flex items-center gap-2">
                    <Download size={14} /> Annexe_Technique.pdf
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-alice/30 rounded-3xl p-6 space-y-4 border border-border/50">
              <div className="flex items-center gap-2 text-eerie font-bold">
                <AlertTriangle size={18} className="text-warn" /> Analyse IA des risques
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed italic">
                {c.aiRiskSummary || "L'intelligence artificielle analyse les clauses de votre contrat pour votre sécurité."}
              </p>
              <div className="pt-4">
                <button className="w-full py-3 rounded-xl bg-eerie text-ghost font-bold text-sm hover:opacity-90">
                  Valider pour signature
                </button>
              </div>
            </div>
          </NeuCard>
        ))}

        {contracts.length === 0 && (
          <div className="py-20 text-center neu-inset rounded-3xl">
            <div className="w-16 h-16 bg-border/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileSignature size={32} className="text-muted-foreground/30" />
            </div>
            <p className="text-muted-foreground">Aucun contrat n'est actuellement en cours de signature.</p>
          </div>
        )}
      </div>
    </div>
  );
}
