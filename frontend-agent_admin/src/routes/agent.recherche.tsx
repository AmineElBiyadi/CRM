import { createFileRoute, useSearch } from "@tanstack/react-router";
import { useState, useEffect, useRef, useCallback } from "react";
import { NeuCard } from "@/components/ui/neu-card";
import { SoftBadge } from "@/components/ui/design-bits";
import { PropertyMap } from "@/components/PropertyMap";
import { useQueryClient } from "@tanstack/react-query";
// @ts-ignore
import { searchProperties, linkPropertyToDeal } from "@/api/propertyApi";
import { Search, MapPin, Link2, Loader2, X, Building2, ChevronDown } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/agent/recherche")({
  component: RecherchePage,
});

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8081";

// Villes US populaires pour la RapidAPI Realty
const CITIES = [
  "Arleta", "Astoria", "Baisley Park", "Bayside", "Belle Harbor", "Bronx",
  "Brooklyn", "Cambria Heights", "Chicago", "East Elmhurst", "East Los Angeles",
  "Floral Park", "Flushing", "Houston", "Howard Beach", "Jamaica", "LA",
  "La Crescenta", "Los Angeles", "Manhattan", "Marina del Rey",
  "Miami", "Middle Village", "New York", "North Hollywood", "North Miami",
  "Northridge", "Pacific Palisades", "Panorama City", "Playa Del Rey", "Queens",
  "Queens Village", "San Fernando", "San Pedro", "Sherman Oaks", "Staten Island",
  "Sun Valley", "Van Nuys", "Woodland Hills"
];


type GroupedTypes = Record<string, string[]>;

function RecherchePage() {
  const routeSearch = useSearch({ strict: false }) as any;
  const dealId = routeSearch?.dealId as string | undefined;

  // Initial state from URL params
  const initialCity = routeSearch?.city || "New York";
  const initialBudget = routeSearch?.maxPrice ? (routeSearch.maxPrice / 1_000_000) : 3;
  const initialRooms = routeSearch?.minRooms || 2;
  const initialPropertyType = routeSearch?.propertyType || "";

  // City autocomplete
  const [city, setCity] = useState(initialCity);
  const [cityInput, setCityInput] = useState(initialCity);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [filteredCities, setFilteredCities] = useState<string[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Property types from backend
  const [groupedTypes, setGroupedTypes] = useState<GroupedTypes>({});
  const [loadingTypes, setLoadingTypes] = useState(true);
  const [selectedGeneral, setSelectedGeneral] = useState<string>("");
  const [selectedSpecific, setSelectedSpecific] = useState<string>(initialPropertyType);

  // Search
  const [budget, setBudget] = useState(initialBudget);
  const [rooms, setRooms] = useState(initialRooms);
  const [floor, setFloor] = useState<number | undefined>(undefined);
  const [results, setResults] = useState<any[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [detail, setDetail] = useState<any | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Map state
  const [showMapModal, setShowMapModal] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number] | undefined>(undefined);
  const [mapSelectedProperty, setMapSelectedProperty] = useState<any | null>(null);

  const queryClient = useQueryClient();

  // Load property types from backend
  useEffect(() => {
    const fetchTypes = async () => {
      setLoadingTypes(true);
      try {
        const res = await fetch(`${API_BASE}/api/property-types/grouped`, { credentials: "include" });
        if (!res.ok) throw new Error("Erreur chargement types");
        const data: GroupedTypes = await res.json();
        setGroupedTypes(data);

        // Find general type for the specific type if provided
        if (initialPropertyType) {
          const foundGeneral = Object.keys(data).find(gen => data[gen].includes(initialPropertyType));
          if (foundGeneral) {
            setSelectedGeneral(foundGeneral);
            setSelectedSpecific(initialPropertyType);
            return;
          }
        }

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


  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowCityDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const fetchResults = useCallback(async () => {
    if (!selectedSpecific) return;
    setSearching(true);
    setHasSearched(true);
    try {
      const params = new URLSearchParams({
        city,
        propertyType: selectedSpecific,
        maxPrice: String(budget * 1_000_000),
        minRooms: String(rooms),
        page: "1"
      });
      if (dealId) params.append("dealId", dealId);
      if (floor !== undefined) params.append("floor", String(floor));

      const res = await fetch(`${API_BASE}/api/properties/search?${params.toString()}`, { credentials: "include" });
      if (!res.ok) throw new Error("Erreur recherche");
      const data = await res.json();
      setResults(data.results || []);
      setTotalResults(data.total || 0);
      if ((data.results?.length || 0) === 0) {
        toast.info(`Aucun bien trouvé à ${city} pour ces critères.`);
      }
    } catch (e: any) {
      toast.error("Erreur de recherche : " + e.message);
    } finally {
      setSearching(false);
    }
  }, [city, selectedSpecific, budget, rooms, floor, dealId]);

  const handleOpenMap = (p: any) => {
    if (p.latitude && p.longitude) {
      setMapCenter([p.latitude, p.longitude]);
      setMapSelectedProperty(p);
      setShowMapModal(true);
    } else {
      toast.warning("Coordonnées non disponibles pour ce bien");
      const firstWithCoord = results.find(r => r.latitude && r.longitude);
      if (firstWithCoord) {
        setMapCenter([firstWithCoord.latitude, firstWithCoord.longitude]);
        setMapSelectedProperty(p);
        setShowMapModal(true);
      }
    }
  };

  useEffect(() => {
    if (!selectedSpecific) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchResults();
    }, 600);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [fetchResults]);

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
    <div className="space-y-8 p-4 md:p-8 max-w-7xl mx-auto">
      {/* Header & Filtres */}
      <div className="flex flex-col gap-6 bg-white/40 p-6 rounded-3xl neu-sm">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-3">
            <Building2 className="text-alice" /> Recherche Immobilière
          </h1>
          <SoftBadge tone="info">{totalResults} résultats trouvés</SoftBadge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 items-end">
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-1">Ville</label>
            <div className="relative" ref={dropdownRef}>
              <input
                type="text"
                value={cityInput}
                onChange={(e) => {
                  setCityInput(e.target.value);
                  setFilteredCities(CITIES.filter(c => c.toLowerCase().includes(e.target.value.toLowerCase())));
                  setShowCityDropdown(true);
                }}
                onFocus={() => setShowCityDropdown(true)}
                className="w-full px-4 py-2.5 rounded-xl neu-inset bg-transparent text-sm focus:outline-none"
                placeholder="Ex: Casablanca..."
              />
              {showCityDropdown && filteredCities.length > 0 && (
                <div className="absolute z-10 w-full mt-2 bg-ghost rounded-xl shadow-xl border border-border max-h-48 overflow-y-auto">
                  {filteredCities.map(c => (
                    <button
                      key={c}
                      onClick={() => {
                        setCity(c);
                        setCityInput(c);
                        setShowCityDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-alice/10 transition-colors"
                    >
                      {c}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-1">Catégorie</label>
            <select
              value={selectedGeneral}
              onChange={(e) => {
                const gen = e.target.value;
                setSelectedGeneral(gen);
                setSelectedSpecific(groupedTypes[gen]?.[0] || "");
              }}
              className="w-full px-4 py-2.5 rounded-xl neu-inset bg-transparent text-sm focus:outline-none appearance-none cursor-pointer"
            >
              {Object.keys(groupedTypes).map(gen => <option key={gen} value={gen}>{gen}</option>)}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-1">Type de bien</label>
            <select
              value={selectedSpecific}
              onChange={(e) => setSelectedSpecific(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl neu-inset bg-transparent text-sm focus:outline-none appearance-none cursor-pointer"
            >
              {groupedTypes[selectedGeneral]?.map(spec => <option key={spec} value={spec}>{spec}</option>)}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-1">
              Budget max ($)
            </label>
            <div className="px-1 py-1">
              <input
                type="number"
                value={budget * 1_000_000}
                onChange={(e) => setBudget(parseFloat(e.target.value) / 1_000_000)}
                className="w-full px-4 py-2.5 rounded-xl neu-inset bg-transparent text-sm focus:outline-none"
                placeholder="Ex: 500000"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <div className="flex-1 space-y-1.5">
              <label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-1">Étage</label>
              <select
                value={floor === undefined ? "" : floor}
                onChange={(e) => setFloor(e.target.value === "" ? undefined : parseInt(e.target.value))}
                className="w-full px-3 py-2.5 rounded-xl neu-inset bg-transparent text-sm focus:outline-none appearance-none cursor-pointer"
              >
                <option value="">Tous</option>
                <option value="0">RDC</option>
                {Array.from({ length: 15 }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1}e</option>)}
              </select>
            </div>

            <button
              onClick={fetchResults}
              disabled={searching}
              className="w-12 h-11 rounded-xl bg-eerie text-ghost flex items-center justify-center hover:opacity-90 transition-all shadow-lg disabled:opacity-50 mt-5"
            >
              {searching ? <Loader2 className="animate-spin" size={18} /> : <Search size={18} />}
            </button>
          </div>
        </div>
      </div>

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
                  {selectedGeneral !== "Land" && (
                    <SoftBadge tone="info">
                      {p.numRooms ? `${p.numRooms} pièces` : "N/D"}
                    </SoftBadge>
                  )}
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
                    onClick={() => handleOpenMap(p)}
                    className="px-3 py-2.5 rounded-lg neu-sm hover:neu-pressable text-alice"
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
                  { l: "Prix", v: "$" + detail.price?.toLocaleString("en-US"), show: true },
                  { l: "Surface", v: detail.surfaceM2 + " m²", show: true },
                  { l: "Chambres", v: String(detail.numRooms), show: selectedGeneral !== "Land" },
                  { l: "Étage", v: String(detail.floor ?? "—"), show: selectedGeneral !== "Land" },
                ].filter(s => s.show).map((s) => (
                  <div key={s.l} className="neu-inset rounded-xl p-3 text-center">
                    <div className="font-bold text-xs truncate">{s.v}</div>
                    <div className="text-[10px] uppercase text-muted-foreground mt-0.5">{s.l}</div>
                  </div>
                ))}
              </div>
              <div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Bien de type <strong>{selectedSpecific}</strong> ({selectedGeneral}) situé à {detail.city}.
                  {detail.surfaceM2} m² {selectedGeneral !== "Land" ? `— ${detail.numRooms} pièces` : ""}.
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

      {/* Modale Carte */}
      {showMapModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 md:p-10" onClick={() => setShowMapModal(false)}>
          <div className="absolute inset-0 bg-eerie/80 backdrop-blur-md" />
          <div 
            className="relative bg-ghost rounded-[2rem] w-full h-full max-w-6xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 md:p-6 border-b border-border flex items-center justify-between bg-vanilla/10">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <MapPin className="text-alice" size={20} />
                  Localisation des biens à {city}
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  {results.filter(r => r.latitude).length} biens géolocalisés affichés. Cliquez sur un marqueur pour plus d'infos.
                </p>
              </div>
              <button 
                onClick={() => setShowMapModal(false)}
                className="w-10 h-10 rounded-full neu-sm flex items-center justify-center hover:neu-pressable transition-all"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 relative">
              <PropertyMap 
                properties={results} 
                selectedProperty={mapSelectedProperty}
                center={mapCenter}
              />
              
              {/* Overlay info si un bien est sélectionné sur la carte (optionnel, déjà géré par Popup) */}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
