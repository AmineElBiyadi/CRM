import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { NeuCard } from "@/components/ui/neu-card";
import { SoftBadge } from "@/components/ui/design-bits";
import { MapPin, Maximize2, X, Heart, Phone, Calendar, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useClientData, DossierDetail } from "@/hooks/use-client-data";

export const Route = createFileRoute("/client/proprietes")({
  component: ClientProperties,
});

function ClientProperties() {
  const { data, isLoading } = useClientData();
  const [selected, setSelected] = useState<DossierDetail | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center p-12">
        <Loader2 className="animate-spin text-vanilla" size={32} />
      </div>
    );
  }

  const dossiersWithProperties = data?.dossiers?.filter(d => d.propertyTitle) || [];

  const toggleFav = (id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); toast("Retiré des favoris"); }
      else { next.add(id); toast.success("Ajouté à vos favoris"); }
      return next;
    });
  };

  const formatPrice = (p?: number) => p ? new Intl.NumberFormat('fr-MA', { style: 'currency', currency: '$', maximumFractionDigits: 0 }).format(p) : "P.A.";

  return (
    <div className="space-y-6 max-w-[1200px]">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Mes propriétés</h1>
        <p className="text-sm text-muted-foreground mt-1">Biens sélectionnés par votre agent</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-5 md:gap-6">
        {dossiersWithProperties.map((p) => (
          <NeuCard key={p.idDeal} className="overflow-hidden p-0">
            <img 
              src={p.propertyImageUrls?.[0] || "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600"} 
              alt={p.propertyTitle} 
              className="w-full h-48 md:h-56 object-cover" 
            />
            <div className="p-5 md:p-6">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-bold text-lg truncate">{p.propertyTitle}</h3>
                  <div className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
                    <MapPin size={12} /> {p.city} · {p.address}
                  </div>
                </div>
                {p.visitStatus === "VISITED" && (
                  <SoftBadge tone="success">Visitée</SoftBadge>
                )}
                {p.visitStatus === "VISIT_PLANNED" && (
                  <SoftBadge tone="info">Visite planifiée</SoftBadge>
                )}
              </div>
              <div className="grid grid-cols-3 gap-3 mt-5">
                <div className="neu-inset rounded-lg p-3 text-center">
                  <div className="text-sm md:text-base font-bold">{formatPrice(p.askingPrice)}</div>
                  <div className="text-[10px] uppercase text-muted-foreground">Prix</div>
                </div>
                <div className="neu-inset rounded-lg p-3 text-center">
                  <div className="text-sm md:text-base font-bold">{p.propertySurfaceM2 || "--"} m²</div>
                  <div className="text-[10px] uppercase text-muted-foreground">Surface</div>
                </div>
                <div className="neu-inset rounded-lg p-3 text-center">
                  <div className="text-sm md:text-base font-bold">{p.clientType === "BUYER" ? "Réf" : "Possédé"}</div>
                  <div className="text-[10px] uppercase text-muted-foreground">Type</div>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => setSelected(p)}
                  className="flex-1 py-2.5 rounded-lg bg-eerie text-ghost text-sm font-medium hover:opacity-90 flex items-center justify-center gap-2"
                >
                  <Maximize2 size={14} /> Voir les détails
                </button>
                <button
                  onClick={() => toggleFav(p.idDeal)}
                  className={`px-3 rounded-lg neu-sm hover:neu-pressable transition-colors ${favorites.has(p.idDeal) ? "text-destructive" : ""}`}
                >
                  <Heart size={16} fill={favorites.has(p.idDeal) ? "currentColor" : "none"} />
                </button>
              </div>
            </div>
          </NeuCard>
        ))}
        {dossiersWithProperties.length === 0 && (
          <div className="col-span-full py-12 text-center neu-inset rounded-3xl">
            <p className="text-muted-foreground">Aucune propriété associée à votre dossier pour le moment.</p>
          </div>
        )}
      </div>

      {/* Detail modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="absolute inset-0 bg-eerie/60 backdrop-blur-sm" />
          <div
            className="relative bg-ghost rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto soft-scroll shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative h-64 md:h-80 w-full">
              <img 
                src={selected.propertyImageUrls?.[0] || "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800"} 
                alt={selected.propertyTitle} 
                className="w-full h-full object-cover rounded-t-3xl" 
              />
              <button
                onClick={() => setSelected(null)}
                className="absolute top-4 right-4 w-10 h-10 rounded-full glass flex items-center justify-center"
              >
                <X size={16} />
              </button>
            </div>
            <div className="p-6 md:p-8 space-y-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <h2 className="text-2xl font-bold">{selected.propertyTitle}</h2>
                  <div className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
                    <MapPin size={12} /> {selected.address}, {selected.city}
                  </div>
                </div>
                <SoftBadge tone="info">{selected.stage}</SoftBadge>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { l: "Prix demandé", v: formatPrice(selected.askingPrice) },
                  { l: "Surface", v: `${selected.propertySurfaceM2 || "--"} m²` },
                  { l: "Dossier", v: selected.clientType },
                  { l: "Agent", v: selected.assignedAgentName },
                ].map((s) => (
                  <div key={s.l} className="neu-inset rounded-xl p-3 text-center">
                    <div className="font-bold text-sm md:text-base">{s.v}</div>
                    <div className="text-[10px] uppercase text-muted-foreground mt-0.5">{s.l}</div>
                  </div>
                ))}
              </div>

              <div>
                <h3 className="font-semibold mb-2">Résumé IA du dossier</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {selected.aiSummary || "Analyse en cours..."}
                </p>
                <div className="mt-3 p-4 rounded-xl bg-honeydew/30 border border-honeydew/50">
                  <p className="text-xs font-semibold text-eerie uppercase tracking-wider mb-1">Recommandation :</p>
                  <p className="text-sm text-eerie">{selected.aiRecommendedAction}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 pt-3 border-t border-border">
                <button
                  onClick={() => { toast.success(`Demande d'info envoyée à ${selected.assignedAgentName}`); setSelected(null); }}
                  className="flex-1 min-w-[140px] py-3 rounded-xl bg-eerie text-ghost text-sm font-medium hover:opacity-90 flex items-center justify-center gap-2"
                >
                  <Calendar size={14} /> Planifier visite
                </button>
                <button
                  onClick={() => toast(`Appel en cours vers ${selected.assignedAgentName}…`)}
                  className="px-5 py-3 rounded-xl neu-sm hover:neu-pressable text-sm font-medium flex items-center gap-2"
                >
                  <Phone size={14} /> Contacter l'agent
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
