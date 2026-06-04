import { useMemo, useState, useRef, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { fetchDossiers, type DossierSummary } from "@/api/dossiersApi";
import { NeuCard } from "@/components/ui/neu-card";
import { LeadScore, SoftBadge, StageBadge } from "@/components/ui/design-bits";
import { Sparkles, Plus, AlertCircle, Clock, ChevronRight, Search, Filter, X, ChevronDown, ChevronLeft } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";

export const Route = createFileRoute("/agent/dossiers/")({
  component: DossiersListing,
});

function NeuSelect({ 
  value, 
  onChange, 
  options, 
  placeholder 
}: { 
  value: string; 
  onChange: (val: string) => void; 
  options: { label: string; value: string }[];
  placeholder: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className="relative min-w-[160px]" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm transition-all ${
          isOpen ? "neu-inset text-primary" : "neu-sm text-eerie hover:neu-pressable"
        }`}
      >
        <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
        <ChevronDown size={14} className={`ml-2 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 p-1.5 bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 z-50 animate-in fade-in zoom-in duration-200 origin-top">
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                value === opt.value 
                  ? "bg-eerie text-ghost" 
                  : "text-muted-foreground hover:bg-alice/50 hover:text-eerie"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function DossiersListing() {
  const { data: rawDossiers, isLoading, isError } = useQuery({
    queryKey: ["dossiers"],
    queryFn: fetchDossiers,
  });

  // États pour les filtres
  const [searchTerm, setSearchTerm] = useState("");
  const [clientType, setClientType] = useState<string>("ALL");
  const [stage, setStage] = useState<string>("ALL");
  const [isUrgent, setIsUrgent] = useState(false);
  const [isHighScoring, setIsHighScoring] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const [isInactive, setIsInactive] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 4;

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, clientType, stage, isUrgent, isHighScoring, isNew, isInactive]);

  const dossiers = useMemo(() => {
     if (!rawDossiers) return [];
     
     let filtered = [...rawDossiers];

     // 1. Recherche textuelle
     if (searchTerm) {
       const term = searchTerm.toLowerCase();
       filtered = filtered.filter(d => 
         d.clientFullName.toLowerCase().includes(term)
       );
     }

     // 2. Type de client
     if (clientType !== "ALL") {
       filtered = filtered.filter(d => d.clientType === clientType);
     }

     // 3. Étape du pipeline
     if (stage !== "ALL") {
       filtered = filtered.filter(d => d.stage === stage);
     }

     // 4. Urgence IA
     if (isUrgent) {
       filtered = filtered.filter(d => d.isUrgent);
     }

     // 5. Score élevé (> 80)
     if (isHighScoring) {
       filtered = filtered.filter(d => (d.aiLeadScore || 0) > 80);
     }

     // 6. À confirmer (New)
     if (isNew) {
       filtered = filtered.filter(d => d.newDossier);
     }

     // 7. Inactifs (> 7 jours)
     if (isInactive) {
       const sevenDaysAgo = new Date();
       sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
       filtered = filtered.filter(d => {
         if (!d.lastInteractionAt) return true;
         return new Date(d.lastInteractionAt) < sevenDaysAgo;
       });
     }

     // Tri
     return filtered.sort((a, b) => {
        if (a.newDossier && !b.newDossier) return -1;
        if (!a.newDossier && b.newDossier) return 1;
        if (a.isUrgent && !b.isUrgent) return -1;
        if (!a.isUrgent && b.isUrgent) return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
   }, [rawDossiers, searchTerm, clientType, stage, isUrgent, isHighScoring, isNew, isInactive]);

  const totalPages = Math.ceil(dossiers.length / ITEMS_PER_PAGE);
  const paginatedDossiers = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return dossiers.slice(start, start + ITEMS_PER_PAGE);
  }, [dossiers, currentPage]);

  const resetFilters = () => {
    setSearchTerm("");
    setClientType("ALL");
    setStage("ALL");
    setIsUrgent(false);
    setIsHighScoring(false);
    setIsNew(false);
    setIsInactive(false);
  };

  const hasActiveFilters = searchTerm || clientType !== "ALL" || stage !== "ALL" || isUrgent || isHighScoring || isNew || isInactive;

  if (isLoading) return <div className="p-8 text-center">Chargement des dossiers...</div>;
  if (isError) return <div className="p-8 text-center text-red-500">Erreur lors du chargement des dossiers.</div>;

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-eerie">Espace Dossiers</h1>
          <p className="text-muted-foreground text-sm">Gérez vos transactions actives et suivez les priorités IA.</p>
        </div>
        <Link 
          to="/agent/dossiers/create" 
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-eerie text-ghost font-medium hover:opacity-90 transition-all shadow-lg"
        >
          <Plus size={18} /> Nouveau Dossier
        </Link>
      </div>

      {/* Barre de filtrage intelligente */}
      <NeuCard className="p-4 md:p-6 space-y-4 bg-alice/10 border-dashed border-2">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Recherche textuelle */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <input 
              type="text"
              placeholder="Rechercher par nom, email ou téléphone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 neu-inset rounded-xl bg-transparent focus:outline-none text-sm"
            />
          </div>

          {/* Filtres Dropdowns */}
          <div className="flex flex-wrap gap-3">
            <NeuSelect 
              value={clientType}
              onChange={setClientType}
              placeholder="Tous les types"
              options={[
                { label: "Tous les types", value: "ALL" },
                { label: "Acheteurs", value: "BUYER" },
                { label: "Vendeurs", value: "SELLER" },
              ]}
            />

            <NeuSelect 
              value={stage}
              onChange={setStage}
              placeholder="Toutes les étapes"
              options={[
                { label: "Toutes les étapes", value: "ALL" },
                { label: "COLD", value: "COLD" },
                { label: "WARM", value: "WARM" },
                { label: "HOT", value: "HOT" },
                { label: "NEGOTIATION", value: "NEGOTIATION" },
              ]}
            />
          </div>
        </div>

        {/* Filtres IA et Quick Toggles */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-border/40">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setIsUrgent(!isUrgent)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all ${
                isUrgent ? "bg-red-500 text-ghost shadow-lg shadow-red-500/20" : "neu-sm text-muted-foreground hover:text-red-500"
              }`}
            >
              <AlertCircle size={14} /> Urgence IA
            </button>
            <button
              onClick={() => setIsHighScoring(!isHighScoring)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all ${
                isHighScoring ? "bg-vanilla text-eerie shadow-lg" : "neu-sm text-muted-foreground hover:text-eerie"
              }`}
            >
              <Sparkles size={14} /> Score &gt; 80
            </button>
            <button
              onClick={() => setIsNew(!isNew)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all ${
                isNew ? "bg-amber-500 text-ghost shadow-lg shadow-amber-500/20" : "neu-sm text-muted-foreground hover:text-amber-500"
              }`}
            >
              <Plus size={14} /> À confirmer
            </button>
            <button
              onClick={() => setIsInactive(!isInactive)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all ${
                isInactive ? "bg-eerie text-ghost shadow-lg" : "neu-sm text-muted-foreground hover:text-eerie"
              }`}
            >
              <Clock size={14} /> Inactifs (+7j)
            </button>
          </div>

          {hasActiveFilters && (
            <button 
              onClick={resetFilters}
              className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-red-500 transition-colors"
            >
              <X size={14} /> Réinitialiser
            </button>
          )}
        </div>
      </NeuCard>

      <div className="grid grid-cols-1 gap-4">
        {dossiers?.length === 0 ? (
          <NeuCard className="py-12 text-center text-muted-foreground bg-white/30 border-dashed border-2">
            <div className="flex flex-col items-center gap-2">
              <Filter size={32} className="opacity-20 mb-2" />
              <p>Aucun dossier ne correspond à vos filtres.</p>
              {hasActiveFilters && (
                <button onClick={resetFilters} className="text-primary text-xs font-bold underline mt-2">
                  Effacer tous les filtres
                </button>
              )}
            </div>
          </NeuCard>
        ) : (
          paginatedDossiers.map((dossier) => (
            <DossierRow key={dossier.idDeal || dossier.idProfile} dossier={dossier} />
          ))
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-8">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(p => p - 1)}
            className="w-10 h-10 rounded-xl neu-sm flex items-center justify-center disabled:opacity-30 disabled:pointer-events-none hover:neu-pressable transition-all"
          >
            <ChevronLeft size={18} />
          </button>
          
          <div className="flex items-center gap-2">
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`w-10 h-10 rounded-xl text-xs font-bold transition-all ${
                  currentPage === i + 1 
                    ? "neu-inset text-eerie" 
                    : "neu-sm text-muted-foreground hover:text-eerie"
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>

          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(p => p + 1)}
            className="w-10 h-10 rounded-xl neu-sm flex items-center justify-center disabled:opacity-30 disabled:pointer-events-none hover:neu-pressable transition-all"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
}

function DossierRow({ dossier }: { dossier: DossierSummary }) {
  return (
    <NeuCard 
      size="sm" 
      className={`relative group transition-all ${dossier.newDossier ? 'border-amber-200 bg-amber-50/30 shadow-sm' : ''}`}
    >
      <div className="flex flex-col md:flex-row items-center gap-6 p-1">
        {/* Score IA */}
        <div className="shrink-0">
          <LeadScore score={dossier.aiLeadScore ?? 0} size={70} />
        </div>
        {/* Info Client & Dossier */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-lg text-eerie truncate">{dossier.clientFullName}</h3>
            {dossier.newDossier && (
              <span className="bg-amber-500 text-ghost text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-tighter shadow-sm">
                NEW
              </span>
            )}
            {dossier.isUrgent && (
              <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full border border-red-100">
                <AlertCircle size={10} /> Urgent
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <SoftBadge tone="info" className="text-[10px]">{dossier.clientType === 'BUYER' ? 'ACHETEUR' : 'VENDEUR'}</SoftBadge>
            <StageBadge stage={dossier.stage} />
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground ml-2">
              <Clock size={12} />
              <span>Dernier échange : {formatRelativeTime(dossier.lastInteractionAt)}</span>
            </div>
          </div>
        </div>

        {/* Action Recommandée */}
        <div className="hidden lg:flex flex-col max-w-[280px] text-right">
          <span className="text-[10px] uppercase font-bold text-muted-foreground mb-1 flex items-center justify-end gap-1">
            <Sparkles size={10} className="text-vanilla" /> Action recommandée
          </span>
          <p className="text-sm font-medium text-eerie line-clamp-2 italic">
            "{dossier.aiRecommendedAction}"
          </p>
        </div>

        {/* Action Button */}
        <div className="shrink-0 w-full md:w-auto flex items-center gap-2">
          {dossier.newDossier ? (
            <Link
              to="/agent/dossiers/create"
              search={{ confirmId: dossier.idProfile }}
              className="px-4 py-3 rounded-xl bg-amber-500 text-ghost text-sm font-bold hover:bg-amber-600 transition-colors shadow-lg shadow-amber-500/20"
            >
              Confirmer
            </Link>
          ) : (
            <Link 
              to="/agent/dossier" 
              search={{ id: dossier.idDeal ?? undefined, from: "/agent/dossiers" }}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl neu-sm hover:neu-pressable text-sm font-bold group-hover:bg-alice/10"
            >
              Détails <ChevronRight size={16} />
            </Link>
          )}
        </div>
      </div>
    </NeuCard>
  );
}
