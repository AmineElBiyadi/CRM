import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { NeuCard } from "@/components/ui/neu-card";
import { SoftBadge } from "@/components/ui/design-bits";
import { properties } from "@/lib/mock-data";
import { MapPin, Maximize2, X, Heart, Phone, Calendar } from "lucide-react";
import { toast } from "sonner";
import type { Property } from "@/lib/mock-data";

export const Route = createFileRoute("/client/proprietes")({
  component: ClientProperties,
});

function ClientProperties() {
  const [selected, setSelected] = useState<Property | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const toggleFav = (p: Property) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(p.id)) { next.delete(p.id); toast("Retiré des favoris"); }
      else { next.add(p.id); toast.success("Ajouté à vos favoris"); }
      return next;
    });
  };

  return (
    <div className="space-y-6 max-w-[1200px]">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Mes propriétés</h1>
        <p className="text-sm text-muted-foreground mt-1">Biens sélectionnés par votre agent</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-5 md:gap-6">
        {properties.map((p) => (
          <NeuCard key={p.id} className="overflow-hidden p-0">
            <img src={p.image} alt={p.address} className="w-full h-48 md:h-56 object-cover" />
            <div className="p-5 md:p-6">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-bold text-lg truncate">{p.address}</h3>
                  <div className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
                    <MapPin size={12} /> {p.city}
                  </div>
                </div>
                <SoftBadge tone={p.status === "Visitée" ? "success" : p.status === "Proposée" ? "warn" : "info"}>{p.status}</SoftBadge>
              </div>
              <div className="grid grid-cols-3 gap-3 mt-5">
                <div className="neu-inset rounded-lg p-3 text-center">
                  <div className="text-base md:text-lg font-bold">{p.price}</div>
                  <div className="text-[10px] uppercase text-muted-foreground">Prix</div>
                </div>
                <div className="neu-inset rounded-lg p-3 text-center">
                  <div className="text-base md:text-lg font-bold">{p.surface}</div>
                  <div className="text-[10px] uppercase text-muted-foreground">Surface</div>
                </div>
                <div className="neu-inset rounded-lg p-3 text-center">
                  <div className="text-base md:text-lg font-bold">{p.rooms}</div>
                  <div className="text-[10px] uppercase text-muted-foreground">Pièces</div>
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
                  onClick={() => toggleFav(p)}
                  className={`px-3 rounded-lg neu-sm hover:neu-pressable transition-colors ${favorites.has(p.id) ? "text-destructive" : ""}`}
                  aria-label="Favori"
                  aria-pressed={favorites.has(p.id)}
                >
                  <Heart size={16} fill={favorites.has(p.id) ? "currentColor" : "none"} />
                </button>
              </div>
            </div>
          </NeuCard>
        ))}
      </div>

      {/* Detail modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="absolute inset-0 bg-eerie/60 backdrop-blur-sm" />
          <div
            className="relative bg-ghost rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto soft-scroll shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <img src={selected.image} alt={selected.address} className="w-full h-64 md:h-80 object-cover rounded-t-3xl" />
            <button
              onClick={() => setSelected(null)}
              className="absolute top-4 right-4 w-10 h-10 rounded-full glass flex items-center justify-center"
              aria-label="Fermer"
            >
              <X size={16} />
            </button>
            <div className="p-6 md:p-8 space-y-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <h2 className="text-2xl font-bold">{selected.address}</h2>
                  <div className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
                    <MapPin size={12} /> {selected.city} · {selected.floor}
                  </div>
                </div>
                <SoftBadge tone={selected.status === "Visitée" ? "success" : "info"}>{selected.status}</SoftBadge>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { l: "Prix", v: selected.price },
                  { l: "Surface", v: selected.surface },
                  { l: "Pièces", v: String(selected.rooms) },
                  { l: "Source", v: selected.source },
                ].map((s) => (
                  <div key={s.l} className="neu-inset rounded-xl p-3 text-center">
                    <div className="font-bold">{s.v}</div>
                    <div className="text-[10px] uppercase text-muted-foreground mt-0.5">{s.l}</div>
                  </div>
                ))}
              </div>

              <div>
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Appartement lumineux dans un quartier prisé, proche écoles et commerces. Cuisine équipée,
                  exposition sud, parking et cave inclus. Idéal famille — possibilité de visite ce week-end.
                </p>
              </div>

              <div className="flex flex-wrap gap-3 pt-3 border-t border-border">
                <button
                  onClick={() => { toast.success("Demande de visite envoyée à Sara"); setSelected(null); }}
                  className="flex-1 min-w-[140px] py-3 rounded-xl bg-eerie text-ghost text-sm font-medium hover:opacity-90 flex items-center justify-center gap-2"
                >
                  <Calendar size={14} /> Demander une visite
                </button>
                <button
                  onClick={() => toast("Appel en cours vers Sara El Idrissi…")}
                  className="px-5 py-3 rounded-xl neu-sm hover:neu-pressable text-sm font-medium flex items-center gap-2"
                >
                  <Phone size={14} /> Appeler l'agent
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
