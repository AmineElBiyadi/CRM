import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { NeuCard } from "@/components/ui/neu-card";
import { SoftBadge } from "@/components/ui/design-bits";
import { properties, type Property } from "@/lib/mock-data";
import { Search, Sparkles, MapPin, Link2, Loader2, X, Building2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/agent/recherche")({
  component: RecherchePage,
});

function RecherchePage() {
  const [searching, setSearching] = useState(false);
  const [rooms, setRooms] = useState(3);
  const [detail, setDetail] = useState<Property | null>(null);
  return (
    <div className="space-y-6 md:space-y-8 max-w-[1400px]">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Recherche immobilière</h1>
        <p className="text-sm text-muted-foreground mt-1">Connecté à Mubawab, Avito et Sarouty via RapidAPI</p>
      </div>

      <NeuCard>
        <div className="grid md:grid-cols-4 gap-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Ville</label>
            <input defaultValue="Casablanca" className="mt-2 w-full px-4 py-3 neu-inset rounded-lg bg-transparent focus:outline-none" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Type de bien</label>
            <select className="mt-2 w-full px-4 py-3 neu-inset rounded-lg bg-transparent focus:outline-none">
              <option>Appartement</option><option>Villa</option><option>Duplex</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Budget (M MAD)</label>
            <div className="mt-3 px-2">
              <input type="range" min={0.5} max={10} step={0.1} defaultValue={3} className="w-full accent-eerie" />
              <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                <span>0.5M</span><span className="font-semibold">3M</span><span>10M</span>
              </div>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Chambres</label>
            <div className="mt-2 flex items-center gap-2 neu-inset rounded-lg p-1">
              <button onClick={() => setRooms((r) => Math.max(1, r - 1))} aria-label="Moins" className="w-9 h-9 rounded-md neu-sm hover:neu-pressable active:scale-95 transition-transform">-</button>
              <span className="flex-1 text-center font-semibold">{rooms}</span>
              <button onClick={() => setRooms((r) => Math.min(10, r + 1))} aria-label="Plus" className="w-9 h-9 rounded-md neu-sm hover:neu-pressable active:scale-95 transition-transform">+</button>
            </div>
          </div>
        </div>
        <button
          onClick={() => { setSearching(true); setTimeout(() => { setSearching(false); toast.success("24 biens trouvés"); }, 1200); }}
          disabled={searching}
          className="mt-5 w-full md:w-auto px-6 py-3 rounded-xl bg-eerie text-ghost text-sm font-medium hover:opacity-90 flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {searching ? <><Loader2 size={16} className="animate-spin" /> Recherche…</> : <><Search size={16} /> Lancer la recherche</>}
        </button>
      </NeuCard>

      {/* Recommandation IA */}
      <div>
        <h2 className="font-semibold mb-4 flex items-center gap-2"><Sparkles size={16} /> Recommandation IA pour Karim Benchekroun</h2>
        <div className="grid md:grid-cols-3 gap-5">
          {properties.slice(0, 3).map((p, i) => (
            <NeuCard key={p.id} className="bg-vanilla/30">
              <SoftBadge tone="warn" className="mb-3">IA #{i + 1}</SoftBadge>
              <img src={p.image} alt={p.address} className="w-full h-40 object-cover rounded-lg" />
              <div className="mt-3">
                <div className="font-semibold">{p.address}</div>
                <div className="text-sm text-muted-foreground">{p.surface} · {p.rooms} pcs · {p.price}</div>
              </div>
              <p className="text-xs italic text-muted-foreground mt-3 leading-relaxed">
                {["Correspond exactement au budget et zone préférée. Étage idéal pour famille.",
                  "Surface optimale, charges réduites, école à 5 min.",
                  "Bon rapport prix/m². Quartier en valorisation."][i]}
              </p>
            </NeuCard>
          ))}
        </div>
      </div>

      <div>
        <h2 className="font-semibold mb-4">Résultats — 24 biens trouvés</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {properties.map((p) => (
            <NeuCard key={p.id}>
              <button onClick={() => setDetail(p)} className="block w-full text-left group" aria-label={`Détails ${p.address}`}>
                <img src={p.image} alt={p.address} className="w-full h-44 object-cover rounded-lg group-hover:opacity-95 transition-opacity" />
              </button>
              <div className="mt-3 flex items-start justify-between">
                <div>
                  <div className="font-semibold">{p.address}</div>
                  <div className="text-xs text-muted-foreground">{p.city} · {p.floor}</div>
                </div>
                <SoftBadge>{p.source}</SoftBadge>
              </div>
              <div className="flex items-center justify-between mt-2">
                <div className="text-lg font-bold">{p.price}</div>
                <div className="text-xs text-muted-foreground">{p.surface}</div>
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => setDetail(p)}
                  className="flex-1 py-2.5 rounded-lg neu-sm hover:neu-pressable text-xs font-medium flex items-center justify-center gap-1.5"
                >
                  <Building2 size={12} /> Détails
                </button>
                <button
                  onClick={() => toast.success(`${p.address} lié au dossier`)}
                  className="flex-1 py-2.5 rounded-lg bg-eerie text-ghost text-xs font-medium flex items-center justify-center gap-1.5"
                >
                  <Link2 size={12} /> Lier
                </button>
                <button
                  onClick={() => toast(`Localisation : ${p.city}`)}
                  className="px-3 py-2.5 rounded-lg neu-sm hover:neu-pressable"
                  aria-label="Voir sur carte"
                >
                  <MapPin size={14} />
                </button>
              </div>
            </NeuCard>
          ))}
        </div>
      </div>

      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setDetail(null)}>
          <div className="absolute inset-0 bg-eerie/60 backdrop-blur-sm" />
          <div className="relative bg-ghost rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto soft-scroll shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <img src={detail.image} alt={detail.address} className="w-full h-56 md:h-72 object-cover rounded-t-3xl" />
            <button onClick={() => setDetail(null)} className="absolute top-4 right-4 w-10 h-10 rounded-full glass flex items-center justify-center" aria-label="Fermer">
              <X size={16} />
            </button>
            <div className="p-6 md:p-8 space-y-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <h2 className="text-2xl font-bold">{detail.address}</h2>
                  <div className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
                    <MapPin size={12} /> {detail.city} · {detail.floor}
                  </div>
                </div>
                <SoftBadge>{detail.source}</SoftBadge>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { l: "Prix", v: detail.price },
                  { l: "Surface", v: detail.surface },
                  { l: "Pièces", v: String(detail.rooms) },
                  { l: "Étage", v: detail.floor },
                ].map((s) => (
                  <div key={s.l} className="neu-inset rounded-xl p-3 text-center">
                    <div className="font-bold">{s.v}</div>
                    <div className="text-[10px] uppercase text-muted-foreground mt-0.5">{s.l}</div>
                  </div>
                ))}
              </div>
              <div>
                <h3 className="font-semibold mb-2 text-sm">Description</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Bien sélectionné depuis {detail.source}. Quartier prisé, accès facile aux commerces et écoles.
                  Idéal pour acheteur recherchant {detail.rooms} pièces dans cette gamme de prix.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 pt-3 border-t border-border">
                <button
                  onClick={() => { toast.success(`${detail.address} lié au dossier client`); setDetail(null); }}
                  className="flex-1 min-w-[140px] py-3 rounded-xl bg-eerie text-ghost text-sm font-medium flex items-center justify-center gap-2"
                >
                  <Link2 size={14} /> Lier au dossier
                </button>
                <button
                  onClick={() => toast(`Ouverture carte : ${detail.city}`)}
                  className="px-5 py-3 rounded-xl neu-sm hover:neu-pressable text-sm font-medium flex items-center gap-2"
                >
                  <MapPin size={14} /> Carte
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

