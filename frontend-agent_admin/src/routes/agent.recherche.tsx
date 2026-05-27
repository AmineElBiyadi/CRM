import { createFileRoute, useSearch } from "@tanstack/react-router";
import { useState, useEffect, useRef, useCallback } from "react";
import { NeuCard } from "@/components/ui/neu-card";
import { SoftBadge } from "@/components/ui/design-bits";
// @ts-ignore
import { searchProperties, linkPropertyToDeal } from "@/api/propertyApi";
import { Search, MapPin, Link2, Loader2, X, Building2, ChevronDown } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/agent/recherche")({
  component: RecherchePage,
});

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8081";

// Villes US populaires pour la RapidAPI Realty
const US_CITIES = [
  "New York", "Los Angeles", "Chicago", "Houston", "Phoenix",
  "Philadelphia", "San Antonio", "San Diego", "Dallas", "San Jose",
  "Austin", "Jacksonville", "Fort Worth", "Columbus", "Charlotte",
  "Indianapolis", "San Francisco", "Seattle", "Denver", "Nashville",
  "Oklahoma City", "El Paso", "Washington", "Boston", "Las Vegas",
  "Portland", "Memphis", "Louisville", "Baltimore", "Milwaukee",
  "Albuquerque", "Tucson", "Fresno", "Sacramento", "Mesa",
  "Kansas City", "Atlanta", "Omaha", "Colorado Springs", "Raleigh",
  "Long Beach", "Virginia Beach", "Minneapolis", "Tampa", "New Orleans",
  "Arlington", "Bakersfield", "Honolulu", "Anaheim", "Aurora",
];


type GroupedTypes = Record<string, string[]>;

function RecherchePage() {
  const routeSearch = useSearch({ strict: false }) as any;
  const dealId = routeSearch?.dealId as string | undefined;

  // City autocomplete
  const [city, setCity] = useState("New York");
  const [cityInput, setCityInput] = useState("New York");
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [filteredCities, setFilteredCities] = useState<string[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Property types from backend
  const [groupedTypes, setGroupedTypes] = useState<GroupedTypes>({});
  const [loadingTypes, setLoadingTypes] = useState(true);
  const [selectedGeneral, setSelectedGeneral] = useState<string>("");
  const [selectedSpecific, setSelectedSpecific] = useState<string>("");

  // Search
  const [budget, setBudget] = useState(3);
  const [rooms, setRooms] = useState(2);
  const [results, setResults] = useState<any[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [detail, setDetail] = useState<any | null>(null);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load property types from backend
  useEffect(() => {
    const fetchTypes = async () => {
      setLoadingTypes(true);
      try {
        const res = await fetch(`${API_BASE}/api/property-types/grouped`, { credentials: "include" });
        if (!res.ok) throw new Error("Erreur chargement types");
        const data: GroupedTypes = await res.json();
        setGroupedTypes(data);
        // Sélectionner le premier groupe/type par défaut
        const firstGeneral = Object.keys(data)[0];
        if (firstGeneral) {
          setSelectedGeneral(firstGeneral);
          setSelectedSpecific(data[firstGeneral][0] || "");
        }
      } catch (e) {
        toast.error("Impossible de charger les types de biens");
      } finally {
        setLoadingTypes(false);
      }
    };
    fetchTypes();
  }, []);

  // City autocomplete logic
  const handleCityInputChange = (val: string) => {
    setCityInput(val);
    const filtered = US_CITIES.filter((c) =>
      c.toLowerCase().startsWith(val.toLowerCase())
    ).slice(0, 8);
    setFilteredCities(filtered.length > 0 ? filtered : US_CITIES.slice(0, 8));
    setShowCityDropdown(true);
  };

  const selectCity = (c: string) => {
    setCity(c);
    setCityInput(c);
    setShowCityDropdown(false);
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowCityDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Interactive search with debounce
  const doSearch = useCallback(async (
    searchCity: string, specificType: string, bgt: number, rms: number
  ) => {
    if (!specificType) return;
    setSearching(true);
    setHasSearched(true);
    try {
      const data = await searchProperties({
        city: searchCity,
        propertyType: specificType,
        maxPrice: bgt * 1_000_000,
        minRooms: rms,
        page: 1,
      });
      setResults(data.results || []);
      setTotalResults(data.total || data.results?.length || 0);
      if ((data.results?.length || 0) === 0) {
        toast.info(`Aucun bien trouvé à ${searchCity} pour ces critères.`);
      }
    } catch (e: any) {
      toast.error("Erreur de recherche : " + e.message);
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    if (!selectedSpecific) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      doSearch(city, selectedSpecific, budget, rooms);
    }, 600);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [city, selectedSpecific, budget, rooms, doSearch]);

  const handleLink = async (prop: any) => {
    if (!dealId) {
      toast.warning("Aucun dossier sélectionné. Accédez à cette page depuis un dossier client.");
      return;
    }
    try {
      await linkPropertyToDeal(dealId, {
        externalId: prop.externalId,
        title: prop.title,
        address: prop.address,
        city: prop.city,
        price: prop.price,
        surfaceM2: prop.surfaceM2,
        numRooms: prop.numRooms,
        listingUrl: prop.listingUrl,
        propertyTypeGeneral: selectedGeneral,
        propertyTypeSpecific: selectedSpecific,
        imageUrls: prop.imageUrls,
      });
      toast.success(`${prop.title} lié au dossier`);
    } catch (e: any) {
      toast.error("Liaison échouée : " + e.message);
    }
  };

  return (
    <div className="space-y-6 md:space-y-8 max-w-[1400px]">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Recherche immobilière</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Résultats mis à jour automatiquement · RapidAPI Realty in US
        </p>
      </div>

      <NeuCard>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">

          {/* Ville avec autocomplete */}
          <div ref={dropdownRef} className="relative">
            <label className="text-xs font-medium text-muted-foreground">Ville</label>
            <div className="relative mt-2">
              <input
                value={cityInput}
                onChange={(e) => handleCityInputChange(e.target.value)}
                onFocus={() => {
                  const filtered = US_CITIES.filter((c) =>
                    c.toLowerCase().startsWith(cityInput.toLowerCase())
                  ).slice(0, 8);
                  setFilteredCities(filtered.length > 0 ? filtered : US_CITIES.slice(0, 8));
                  setShowCityDropdown(true);
                }}
                onBlur={() => {
                  const match = US_CITIES.find((c) => c.toLowerCase() === cityInput.toLowerCase());
                  if (match) { setCity(match); setCityInput(match); }
                  else setCityInput(city);
                }}
                placeholder="Chercher une ville US…"
                className="w-full px-4 py-3 neu-inset rounded-lg bg-transparent focus:outline-none pr-8"
              />
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            </div>
            {showCityDropdown && filteredCities.length > 0 && (
              <div className="absolute z-30 top-full left-0 right-0 mt-1 bg-ghost border border-border rounded-xl shadow-xl overflow-hidden">
                {filteredCities.map((c) => (
                  <button
                    key={c}
                    onMouseDown={() => selectCity(c)}
                    className={`w-full text-left px-4 py-2.5 text-sm hover:bg-alice/40 transition-colors ${c === city ? "font-semibold bg-alice/20" : ""}`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Sélecteur Catégorie générale */}
          <div>
            <label className="text-xs font-medium text-muted-foreground">Catégorie</label>
            {loadingTypes ? (
              <div className="mt-2 px-4 py-3 neu-inset rounded-lg flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 size={14} className="animate-spin" /> Chargement…
              </div>
            ) : (
              <select
                value={selectedGeneral}
                onChange={(e) => {
                  setSelectedGeneral(e.target.value);
                  const firstSpecific = groupedTypes[e.target.value]?.[0] || "";
                  setSelectedSpecific(firstSpecific);
                }}
                className="mt-2 w-full px-4 py-3 neu-inset rounded-lg bg-transparent focus:outline-none cursor-pointer text-sm"
              >
                {Object.keys(groupedTypes).map((generalType) => (
                  <option key={generalType} value={generalType}>
                    {generalType}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Sélecteur Type spécifique */}
          <div>
            <label className="text-xs font-medium text-muted-foreground">Type de bien</label>
            {loadingTypes ? (
              <div className="mt-2 px-4 py-3 neu-inset rounded-lg" />
            ) : (
              <select
                value={selectedSpecific}
                onChange={(e) => setSelectedSpecific(e.target.value)}
                className="mt-2 w-full px-4 py-3 neu-inset rounded-lg bg-transparent focus:outline-none cursor-pointer text-sm"
              >
                {(groupedTypes[selectedGeneral] || []).map((specificType) => (
                  <option key={specificType} value={specificType}>
                    {specificType}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Budget + Chambres */}
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Budget max · <span className="font-bold text-foreground">${budget}M</span>
              </label>
              <div className="mt-2 px-1">
                <input
                  type="range" min={0.5} max={10} step={0.1}
                  value={budget}
                  onChange={(e) => setBudget(parseFloat(e.target.value))}
                  className="w-full accent-eerie"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>$0.5M</span><span>$10M</span>
                </div>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Chambres min</label>
              <div className="mt-1 flex items-center gap-2 neu-inset rounded-lg p-1">
                <button
                  onClick={() => setRooms((r) => Math.max(1, r - 1))}
                  aria-label="Moins"
                  className="w-8 h-8 rounded-md neu-sm hover:neu-pressable active:scale-95 transition-transform font-bold"
                >−</button>
                <span className="flex-1 text-center font-semibold text-sm">{rooms}</span>
                <button
                  onClick={() => setRooms((r) => Math.min(10, r + 1))}
                  aria-label="Plus"
                  className="w-8 h-8 rounded-md neu-sm hover:neu-pressable active:scale-95 transition-transform font-bold"
                >+</button>
              </div>
            </div>
          </div>
        </div>

        {searching && (
          <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 size={13} className="animate-spin" /> Mise à jour des résultats…
          </div>
        )}

        {/* Badge de la sélection en cours */}
        {selectedSpecific && (
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <span className="text-[11px] text-muted-foreground">Filtres actifs :</span>
            <span className="text-[11px] bg-eerie/10 text-eerie px-2.5 py-1 rounded-full font-medium">
              {selectedGeneral}
            </span>
            <span className="text-[11px] bg-alice/50 text-foreground px-2.5 py-1 rounded-full font-medium">
              {selectedSpecific}
            </span>
            <span className="text-[11px] bg-alice/50 text-foreground px-2.5 py-1 rounded-full font-medium">
              {city} · ≤{budget}M$ · {rooms}+ ch.
            </span>
          </div>
        )}
      </NeuCard>

      {/* Résultats */}
      <div>
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          Résultats
          {!searching && hasSearched && (
            <span className="text-xs font-normal text-muted-foreground">
              · {results.length} affiché{results.length !== 1 ? "s" : ""} sur {totalResults} trouvé{totalResults !== 1 ? "s" : ""}
            </span>
          )}
        </h2>

        {searching ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
            <Loader2 className="animate-spin" size={32} />
            <span className="text-sm">Recherche en cours…</span>
          </div>
        ) : results.length === 0 && hasSearched ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <Building2 size={48} className="text-muted-foreground/30" />
            <div>
              <p className="font-semibold text-muted-foreground">Aucun bien trouvé</p>
              <p className="text-xs text-muted-foreground mt-1">
                Essayez de modifier la ville, le type de bien ou d'élargir votre budget.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {results.map((p, index) => (
              <NeuCard key={p.externalId + "-" + index}>
                <button onClick={() => setDetail(p)} className="block w-full text-left group" aria-label={`Détails ${p.address}`}>
                  <img
                    src={p.imageUrls?.[0] || "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80"}
                    alt={p.address}
                    className="w-full h-44 object-cover rounded-lg group-hover:opacity-95 transition-opacity"
                  />
                </button>
                <div className="mt-3 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-semibold truncate">{p.title}</div>
                    <div className="text-xs text-muted-foreground truncate">{p.address}</div>
                  </div>
                  <SoftBadge className="shrink-0">{p.source?.split(" ")[0]}</SoftBadge>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="font-bold">{p.price?.toLocaleString('en-US')} $</span>
                  <SoftBadge tone="info">
                    {p.numRooms ? `${p.numRooms} pièces` : "N/D"}
                  </SoftBadge>
                </div>
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => setDetail(p)}
                    className="flex-1 py-2.5 rounded-lg neu-sm hover:neu-pressable text-xs font-medium flex items-center justify-center gap-1.5"
                  >
                    <Building2 size={12} /> Détails
                  </button>
                  {dealId && (
                    <button
                      onClick={() => handleLink(p)}
                      className="flex-1 py-2.5 rounded-lg bg-eerie text-ghost text-xs font-medium flex items-center justify-center gap-1.5"
                    >
                      <Link2 size={12} /> Lier
                    </button>
                  )}
                  <button
                    onClick={() => toast.info(p.city)}
                    className="px-3 py-2.5 rounded-lg neu-sm hover:neu-pressable"
                    aria-label="Voir sur carte"
                  >
                    <MapPin size={14} />
                  </button>
                </div>
              </NeuCard>
            ))}
          </div>
        )}
      </div>

      {/* Modale détail */}
      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setDetail(null)}>
          <div className="absolute inset-0 bg-eerie/60 backdrop-blur-sm" />
          <div
            className="relative bg-ghost rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto soft-scroll shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={detail.imageUrls?.[0] || "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80"}
              alt={detail.address}
              className="w-full h-56 md:h-72 object-cover rounded-t-3xl"
            />
            <button onClick={() => setDetail(null)} className="absolute top-4 right-4 w-10 h-10 rounded-full glass flex items-center justify-center" aria-label="Fermer">
              <X size={16} />
            </button>
            <div className="p-6 md:p-8 space-y-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <h2 className="text-2xl font-bold">{detail.title}</h2>
                  <div className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
                    <MapPin size={12} /> {detail.address}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <SoftBadge tone="info">{selectedGeneral}</SoftBadge>
                  <SoftBadge>{selectedSpecific}</SoftBadge>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { l: "Prix", v: "$" + detail.price?.toLocaleString("en-US") },
                  { l: "Surface", v: detail.surfaceM2 + " m²" },
                  { l: "Chambres", v: String(detail.numRooms) },
                  { l: "Étage", v: String(detail.floor ?? "—") },
                ].map((s) => (
                  <div key={s.l} className="neu-inset rounded-xl p-3 text-center">
                    <div className="font-bold text-xs truncate">{s.v}</div>
                    <div className="text-[10px] uppercase text-muted-foreground mt-0.5">{s.l}</div>
                  </div>
                ))}
              </div>
              <div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Bien de type <strong>{selectedSpecific}</strong> ({selectedGeneral}) situé à {detail.city}.
                  {detail.surfaceM2} m² — {detail.numRooms} pièces.
                </p>
                <div className="mt-3">
                  <a href={detail.listingUrl} target="_blank" rel="noreferrer" className="text-xs text-alice hover:underline flex items-center gap-1">
                    <Link2 size={12} /> Voir sur le site originel
                  </a>
                </div>
              </div>
              {dealId && (
                <div className="flex flex-wrap gap-2 pt-3 border-t border-border">
                  <button
                    onClick={() => { handleLink(detail); setDetail(null); }}
                    className="flex-1 min-w-[140px] py-3 rounded-xl bg-eerie text-ghost text-sm font-medium flex items-center justify-center gap-2"
                  >
                    <Link2 size={14} /> Lier au dossier
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
