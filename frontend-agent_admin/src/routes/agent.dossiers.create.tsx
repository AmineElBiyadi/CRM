import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchIdentities } from "@/api/clientsApi";
import { createDossier, fetchDossierDetail, fetchPropertyTypes, type CreateDossierRequest } from "@/api/dossiersApi";
import { useConfirmDossier } from "@/hooks/useDossiers";
import { NeuCard } from "@/components/ui/neu-card";
import { Avatar, SoftBadge } from "@/components/ui/design-bits";
import {
  ChevronLeft, ChevronRight, User, ShoppingCart, Home,
  MapPin, Layers, Maximize, CircleSlash, CheckCircle2, Sparkles, ChevronDown,
  DollarSign, Building2, Hash, ArrowUpDown, Upload, X, ImageIcon, Loader2
} from "lucide-react";
import { toast } from "sonner";

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

type CreateDossierSearch = {
  clientId?: string;
  confirmId?: string;
};

export const Route = createFileRoute("/agent/dossiers/create")({
  validateSearch: (search: Record<string, unknown>): CreateDossierSearch => {
    return {
      clientId: search.clientId as string | undefined,
      confirmId: search.confirmId as string | undefined,
    };
  },
  component: CreateDossierPage,
});

function CreateDossierPage() {
  const { clientId, confirmId } = Route.useSearch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [step, setStep] = useState((clientId || confirmId) ? 2 : 1);
  const [formData, setFormData] = useState<Partial<CreateDossierRequest>>({
    idClient: clientId,
    type: 'BUYER',
    // Buyer defaults
    budgetMin: 0,
    budgetMax: 0,
    propertySpecificType: 'Appartement',
    preferredArea: '',
    surfaceM2: 0,
    floor: -1,
    // Seller defaults
    propertyTitle: '',
    address: '',
    city: '',
    askingPrice: 0,
    propertySurfaceM2: 0,
    numRooms: 0,
    propertyFloor: 0,
  });

  const [openPropertyType, setOpenPropertyType] = useState(false);
  const [openFloor, setOpenFloor] = useState(false);
  const [propertyImages, setPropertyImages] = useState<{ id: string; preview: string; uploading: boolean }[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageFiles = useCallback(async (files: FileList | null) => {
    if (!files) return;

    const newUploads = Array.from(files).filter(f => f.type.startsWith('image/')).map(file => ({
      id: Math.random().toString(36).substring(7),
      preview: URL.createObjectURL(file),
      uploading: true,
      file
    }));

    setPropertyImages(prev => [...prev, ...newUploads.map(({ id, preview, uploading }) => ({ id, preview, uploading }))]);

    for (const item of newUploads) {
      const formData = new FormData();
      formData.append("file", item.file);
      formData.append("upload_preset", CLOUDINARY_PRESET);

      try {
        const res = await fetch(CLOUDINARY_URL, {
          method: "POST",
          body: formData,
        });
        const data = await res.json();

        if (data.secure_url) {
          setPropertyImages(prev => prev.map(p => p.id === item.id ? { ...p, uploading: false, preview: data.secure_url } : p));
          setFormData(prev => ({
            ...prev,
            propertyImageUrls: [...(prev.propertyImageUrls || []), data.secure_url],
          }));
        } else {
          toast.error("Erreur lors de l'upload vers Cloudinary");
          setPropertyImages(prev => prev.filter(p => p.id !== item.id));
        }
      } catch (err) {
        console.error("Cloudinary upload error", err);
        toast.error("Erreur de connexion à Cloudinary");
        setPropertyImages(prev => prev.filter(p => p.id !== item.id));
      }
    }
  }, []);

  const removeImage = (idx: number) => {
    const imgToRemove = propertyImages[idx];
    setPropertyImages(prev => prev.filter((_, i) => i !== idx));
    setFormData(prev => ({
      ...prev,
      propertyImageUrls: (prev.propertyImageUrls || []).filter(url => url !== imgToRemove.preview),
    }));
  };

  const { data: identities, isLoading: isLoadingIdentities } = useQuery({
    queryKey: ["identities"],
    queryFn: fetchIdentities,
  });

  const { data: propertyTypes } = useQuery({
    queryKey: ["property-types"],
    queryFn: fetchPropertyTypes,
  });

  const { data: dossierToConfirm } = useQuery({
    queryKey: ["dossier-to-confirm", confirmId],
    queryFn: () => fetchDossierDetail(confirmId!),
    enabled: !!confirmId,
  });

  // Pre-fill form if confirming
  useEffect(() => {
    if (dossierToConfirm) {
      if (dossierToConfirm.clientType === 'BUYER') {
        setFormData({
          idClient: dossierToConfirm.idClient,
          type: 'BUYER',
          budgetMin: dossierToConfirm.budgetMin,
          budgetMax: dossierToConfirm.budgetMax,
          propertySpecificType: dossierToConfirm.propertyType,
          preferredArea: dossierToConfirm.preferredArea,
          surfaceM2: dossierToConfirm.preferredSizeM2,
          floor: dossierToConfirm.preferredFloor,
        });
      } else {
        setFormData({
          idClient: dossierToConfirm.idClient,
          type: 'SELLER',
        });
      }
    }
  }, [dossierToConfirm]);

  // Set default property type when list loads
  useEffect(() => {
    if (propertyTypes?.length && !formData.propertySpecificType) {
      setFormData(prev => ({ ...prev, propertySpecificType: propertyTypes[0].specificType }));
    }
  }, [propertyTypes]);

  const mutation = useMutation({
    mutationFn: createDossier,
    onSuccess: () => {
      toast.success("Dossier créé avec succès !");
      queryClient.invalidateQueries({ queryKey: ["dossiers"] });
      navigate({ to: "/agent/dossiers" });
    },
    onError: (error) => {
      console.error(error);
      toast.error("Erreur lors de la création du dossier.");
    },
  });

  const confirmMutation = useConfirmDossier();

  const nextStep = () => setStep((s) => s + 1);
  const prevStep = () => setStep((s) => s - 1);

  const handleSubmit = () => {
    const finalIdClient = formData.idClient || dossierToConfirm?.idClient;

    if (!finalIdClient) {
      toast.error("Veuillez sélectionner un client.");
      return;
    }

    // Seller validation
    if (formData.type === 'SELLER' && (!formData.propertyTitle || formData.propertyTitle.trim() === '')) {
      toast.error("Veuillez renseigner le titre du bien à vendre.");
      return;
    }

    if (confirmId) {
      confirmMutation.mutate(
        { id: confirmId, data: formData },
        {
          onSuccess: () => {
            toast.success("Dossier confirmé avec succès !");
            queryClient.invalidateQueries({ queryKey: ["dossiers"] });
            navigate({ to: "/agent/dossiers" });
          },
          onError: () => toast.error("Erreur lors de la confirmation")
        }
      );
    } else {
      mutation.mutate(formData as CreateDossierRequest);
    }
  };

  const isBuyer = formData.type === 'BUYER';
  const floorOptions = [
    { value: -1, label: "Indifférent" },
    { value: 0, label: "Rez-de-chaussée" },
    { value: 1, label: "1er étage" },
    { value: 2, label: "2ème étage" },
    { value: 3, label: "3ème étage et +" },
    { value: -2, label: "Dernier étage" },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate({ to: "/agent/dossiers" })}
          className="w-10 h-10 rounded-full neu-sm flex items-center justify-center hover:neu-pressable"
        >
          <ChevronLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-eerie">Nouveau Dossier</h1>
          <p className="text-muted-foreground text-sm">Créer une opportunité transactionnelle.</p>
        </div>
      </div>

      {/* Progress Stepper */}
      <div className="flex items-center justify-center gap-2 px-4 py-2">
        {[1, 2].map((i) => (
          <div key={i} className={`flex items-center ${i < 2 ? "flex-1" : ""}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shadow-sm transition-all ${step >= i ? "bg-eerie text-ghost scale-110" : "neu-inset text-muted-foreground"}`}>
              {step > i ? <CheckCircle2 size={20} /> : i}
            </div>
            {i < 2 && <div className={`flex-1 h-0.5 mx-2 rounded-full ${step > i ? "bg-eerie" : "bg-border/60"}`} />}
          </div>
        ))}
      </div>

      <NeuCard className="p-10 shadow-xl border border-border/5">
        {/* ── STEP 1: Client selection ────────────────────────────── */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <User className="text-muted-foreground" size={20} />
              <h2 className="text-xl font-bold">Sélection du client</h2>
            </div>

            {isLoadingIdentities ? (
              <div className="py-8 text-center">Chargement des clients...</div>
            ) : (
              <div className="grid grid-cols-1 gap-4 max-h-[400px] overflow-y-auto px-1.5 py-1.5 soft-scroll">
                {identities?.map((id) => (
                  <button
                    key={id.idClient}
                    onClick={() => setFormData({ ...formData, idClient: id.idClient })}
                    className={`flex items-center gap-4 p-5 rounded-2xl transition-all text-left mx-1 ${formData.idClient === id.idClient ? "neu-inset ring-2 ring-eerie" : "neu-sm hover:translate-y-[-2px]"}`}
                  >
                    <Avatar name={id.firstName} size={48} />
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-eerie truncate">{id.firstName} {id.lastName}</div>
                      <div className="text-sm text-muted-foreground truncate">{id.email}</div>
                    </div>
                    {formData.idClient === id.idClient && (
                      <CheckCircle2 size={22} className="text-eerie shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            )}

            <button
              disabled={!formData.idClient}
              onClick={nextStep}
              className="w-full mt-6 flex items-center justify-center gap-2 py-3 rounded-xl bg-eerie text-ghost font-bold disabled:opacity-50"
            >
              Suivant <ChevronRight size={18} />
            </button>
          </div>
        )}

        {/* ── STEP 2: Type + dynamic fields ───────────────────────── */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ShoppingCart className="text-muted-foreground" size={20} />
                <h2 className="text-xl font-bold">Type de dossier</h2>
              </div>
              {formData.idClient && identities && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-alice/50 border border-alice">
                  <Avatar name={identities.find(id => id.idClient === formData.idClient)?.firstName || ""} size={20} />
                  <span className="text-xs font-medium text-eerie">
                    {identities.find(id => id.idClient === formData.idClient)?.firstName}{" "}
                    {identities.find(id => id.idClient === formData.idClient)?.lastName}
                  </span>
                </div>
              )}
            </div>

            {/* Buyer / Seller toggle */}
            <div className="flex gap-4">
              <button
                onClick={() => setFormData({ ...formData, type: 'BUYER' })}
                className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-all ${formData.type === 'BUYER' ? "neu-inset ring-2 ring-eerie" : "neu-sm"}`}
              >
                <ShoppingCart size={16} /> Acheteur
              </button>
              <button
                onClick={() => setFormData({ ...formData, type: 'SELLER' })}
                className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-all ${formData.type === 'SELLER' ? "neu-inset ring-2 eerie" : "neu-sm"}`}
              >
                <Home size={16} /> Vendeur
              </button>
            </div>

            {/* ── BUYER fields ── */}
            {isBuyer && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-1 duration-200">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pt-2">Préférences de l'acheteur</p>

                <div className="grid grid-cols-2 gap-4">
                  <label className="block">
                    <span className="text-sm font-semibold text-muted-foreground block mb-2">Budget Min (MAD)</span>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                      <input
                        type="number"
                        value={formData.budgetMin}
                        onChange={(e) => setFormData({ ...formData, budgetMin: Number(e.target.value) })}
                        className="w-full pl-9 pr-4 py-3 neu-inset rounded-xl bg-transparent focus:outline-none text-sm font-medium"
                      />
                    </div>
                  </label>
                  <label className="block">
                    <span className="text-sm font-semibold text-muted-foreground block mb-2">Budget Max (MAD)</span>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                      <input
                        type="number"
                        value={formData.budgetMax}
                        onChange={(e) => setFormData({ ...formData, budgetMax: Number(e.target.value) })}
                        className="w-full pl-9 pr-4 py-3 neu-inset rounded-xl bg-transparent focus:outline-none text-sm font-medium"
                      />
                    </div>
                  </label>
                </div>

                <label className="block">
                  <span className="text-sm font-semibold text-muted-foreground block mb-2">Type de bien souhaité</span>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setOpenPropertyType(!openPropertyType)}
                      className="w-full px-4 py-3 neu-inset rounded-xl bg-ghost focus:outline-none text-sm font-medium flex items-center justify-between"
                    >
                      <span>{formData.propertySpecificType || "Sélectionner..."}</span>
                      <ChevronDown size={16} className={`transition-transform duration-200 ${openPropertyType ? "rotate-180" : ""}`} />
                    </button>
                    {openPropertyType && (
                      <div className="absolute z-50 w-full mt-2 py-2 neu-sm rounded-xl bg-ghost/95 backdrop-blur-sm shadow-2xl max-h-[240px] overflow-y-auto soft-scroll animate-in fade-in zoom-in-95 duration-100">
                        {propertyTypes?.map((pt) => (
                          <button key={pt.idPropertyType} type="button"
                            onClick={() => { setFormData({ ...formData, propertySpecificType: pt.specificType }); setOpenPropertyType(false); }}
                            className={`w-full px-4 py-2.5 text-left text-sm font-medium hover:bg-eerie hover:text-ghost transition-colors ${formData.propertySpecificType === pt.specificType ? "bg-alice" : ""}`}
                          >{pt.specificType}</button>
                        ))}
                      </div>
                    )}
                  </div>
                </label>

                <label className="block">
                  <span className="text-sm font-semibold text-muted-foreground block mb-2">Quartier(s) souhaité(s)</span>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                    <input
                      type="text"
                      value={formData.preferredArea}
                      onChange={(e) => setFormData({ ...formData, preferredArea: e.target.value })}
                      placeholder="ex: Anfa, Bourgogne..."
                      className="w-full pl-10 pr-4 py-3 neu-inset rounded-xl bg-transparent focus:outline-none text-sm font-medium"
                    />
                  </div>
                </label>

                <div className="grid grid-cols-2 gap-4">
                  <label className="block">
                    <span className="text-sm font-semibold text-muted-foreground block mb-2">Superficie min (m²)</span>
                    <div className="relative">
                      <Maximize className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                      <input
                        type="number"
                        value={formData.surfaceM2}
                        onChange={(e) => setFormData({ ...formData, surfaceM2: Number(e.target.value) })}
                        className="w-full pl-10 pr-4 py-3 neu-inset rounded-xl bg-transparent focus:outline-none text-sm font-medium"
                      />
                    </div>
                  </label>
                  <label className="block">
                    <span className="text-sm font-semibold text-muted-foreground block mb-2">Étage préféré</span>
                    <div className="relative">
                      <Layers className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                      <button type="button" onClick={() => setOpenFloor(!openFloor)}
                        className="w-full pl-11 pr-4 py-3 neu-inset rounded-xl bg-ghost focus:outline-none text-sm font-medium flex items-center justify-between"
                      >
                        <span>{floorOptions.find(o => o.value === formData.floor)?.label ?? "Indifférent"}</span>
                        <ChevronDown size={14} className={`transition-transform duration-200 ${openFloor ? "rotate-180" : ""}`} />
                      </button>
                      {openFloor && (
                        <div className="absolute z-50 w-full mt-2 py-2 neu-sm rounded-xl bg-ghost/95 backdrop-blur-sm shadow-2xl animate-in fade-in zoom-in-95 duration-100">
                          {floorOptions.map((opt) => (
                            <button key={opt.value} type="button"
                              onClick={() => { setFormData({ ...formData, floor: opt.value }); setOpenFloor(false); }}
                              className={`w-full px-4 py-2 text-left text-sm font-medium hover:bg-eerie hover:text-ghost transition-colors ${formData.floor === opt.value ? "bg-alice" : ""}`}
                            >{opt.label}</button>
                          ))}
                        </div>
                      )}
                    </div>
                  </label>
                </div>
              </div>
            )}

            {/* ── SELLER fields ── */}
            {!isBuyer && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-1 duration-200">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pt-2">Caractéristiques du bien à vendre</p>

                <label className="block">
                  <span className="text-sm font-semibold text-muted-foreground block mb-2">Titre du bien <span className="text-warn">*</span></span>
                  <div className="relative">
                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                    <input
                      type="text"
                      value={formData.propertyTitle}
                      onChange={(e) => setFormData({ ...formData, propertyTitle: e.target.value })}
                      placeholder="ex: Villa 5 pièces Anfa"
                      className="w-full pl-10 pr-4 py-3 neu-inset rounded-xl bg-transparent focus:outline-none text-sm font-medium"
                    />
                  </div>
                </label>

                <label className="block">
                  <span className="text-sm font-semibold text-muted-foreground block mb-2">Type de bien</span>
                  <div className="relative">
                    <button type="button" onClick={() => setOpenPropertyType(!openPropertyType)}
                      className="w-full px-4 py-3 neu-inset rounded-xl bg-ghost focus:outline-none text-sm font-medium flex items-center justify-between"
                    >
                      <span>{formData.propertySpecificType || "Sélectionner..."}</span>
                      <ChevronDown size={16} className={`transition-transform duration-200 ${openPropertyType ? "rotate-180" : ""}`} />
                    </button>
                    {openPropertyType && (
                      <div className="absolute z-50 w-full mt-2 py-2 neu-sm rounded-xl bg-ghost/95 backdrop-blur-sm shadow-2xl max-h-[240px] overflow-y-auto soft-scroll animate-in fade-in zoom-in-95 duration-100">
                        {propertyTypes?.map((pt) => (
                          <button key={pt.idPropertyType} type="button"
                            onClick={() => { setFormData({ ...formData, propertySpecificType: pt.specificType }); setOpenPropertyType(false); }}
                            className={`w-full px-4 py-2.5 text-left text-sm font-medium hover:bg-eerie hover:text-ghost transition-colors ${formData.propertySpecificType === pt.specificType ? "bg-alice" : ""}`}
                          >{pt.specificType}</button>
                        ))}
                      </div>
                    )}
                  </div>
                </label>

                <div className="grid grid-cols-2 gap-4">
                  <label className="block">
                    <span className="text-sm font-semibold text-muted-foreground block mb-2">Adresse</span>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                      <input
                        type="text"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        placeholder="ex: 12 Rue des Fleurs"
                        className="w-full pl-10 pr-4 py-3 neu-inset rounded-xl bg-transparent focus:outline-none text-sm font-medium"
                      />
                    </div>
                  </label>
                  <label className="block">
                    <span className="text-sm font-semibold text-muted-foreground block mb-2">Ville</span>
                    <div className="relative">
                      <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                      <input
                        type="text"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        placeholder="ex: Casablanca"
                        className="w-full pl-10 pr-4 py-3 neu-inset rounded-xl bg-transparent focus:outline-none text-sm font-medium"
                      />
                    </div>
                  </label>
                </div>

                <label className="block">
                  <span className="text-sm font-semibold text-muted-foreground block mb-2">Prix demandé (MAD)</span>
                  <div className="relative">
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                    <input
                      type="number"
                      value={formData.askingPrice}
                      onChange={(e) => setFormData({ ...formData, askingPrice: Number(e.target.value) })}
                      className="w-full pl-10 pr-4 py-3 neu-inset rounded-xl bg-transparent focus:outline-none text-sm font-medium"
                    />
                  </div>
                </label>

                <div className="grid grid-cols-3 gap-4">
                  <label className="block">
                    <span className="text-sm font-semibold text-muted-foreground block mb-2">Superficie (m²)</span>
                    <div className="relative">
                      <Maximize className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={13} />
                      <input
                        type="number"
                        value={formData.propertySurfaceM2}
                        onChange={(e) => setFormData({ ...formData, propertySurfaceM2: Number(e.target.value) })}
                        className="w-full pl-9 pr-3 py-3 neu-inset rounded-xl bg-transparent focus:outline-none text-sm font-medium"
                      />
                    </div>
                  </label>
                  <label className="block">
                    <span className="text-sm font-semibold text-muted-foreground block mb-2">Nb pièces</span>
                    <div className="relative">
                      <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={13} />
                      <input
                        type="number"
                        value={formData.numRooms}
                        onChange={(e) => setFormData({ ...formData, numRooms: Number(e.target.value) })}
                        className="w-full pl-9 pr-3 py-3 neu-inset rounded-xl bg-transparent focus:outline-none text-sm font-medium"
                      />
                    </div>
                  </label>
                  <label className="block">
                    <span className="text-sm font-semibold text-muted-foreground block mb-2">Étage</span>
                    <div className="relative">
                      <ArrowUpDown className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                      <button type="button" onClick={() => setOpenFloor(!openFloor)}
                        className="w-full pl-11 pr-4 py-3 neu-inset rounded-xl bg-ghost focus:outline-none text-sm font-medium flex items-center justify-between"
                      >
                        <span>{floorOptions.find(o => o.value === formData.propertyFloor)?.label ?? "Rez-de-chaussée"}</span>
                        <ChevronDown size={14} className={`transition-transform duration-200 ${openFloor ? "rotate-180" : ""}`} />
                      </button>
                      {openFloor && (
                        <div className="absolute z-50 w-full mt-2 py-2 neu-sm rounded-xl bg-ghost/95 backdrop-blur-sm shadow-2xl animate-in fade-in zoom-in-95 duration-100">
                          {floorOptions.filter(o => o.value !== -1).map((opt) => (
                            <button key={opt.value} type="button"
                              onClick={() => { setFormData({ ...formData, propertyFloor: opt.value }); setOpenFloor(false); }}
                              className={`w-full px-4 py-2 text-left text-sm font-medium hover:bg-eerie hover:text-ghost transition-colors ${formData.propertyFloor === opt.value ? "bg-alice" : ""}`}
                            >{opt.label}</button>
                          ))}
                        </div>
                      )}
                    </div>
                  </label>
                </div>

                {/* ── Image upload zone ── */}
                <div>
                  <span className="text-sm font-semibold text-muted-foreground block mb-2">Photos du bien</span>
                  <div
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleImageFiles(e.dataTransfer.files); }}
                    onClick={() => fileInputRef.current?.click()}
                    className={`flex flex-col items-center justify-center gap-2 py-7 rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-200 ${isDragging ? "border-eerie bg-eerie/5 scale-[1.01]" : "border-border/40 bg-alice/20 hover:border-eerie/40 hover:bg-alice/40"}`}
                  >
                    <Upload size={22} className={isDragging ? "text-eerie" : "text-muted-foreground"} />
                    <p className="text-sm text-muted-foreground text-center">
                      <span className="font-semibold text-eerie">Cliquez</span> ou glissez vos photos ici
                    </p>
                    <p className="text-xs text-muted-foreground/60">JPG, PNG, WEBP acceptés</p>
                    <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleImageFiles(e.target.files)} />
                  </div>
                  {propertyImages.length > 0 && (
                    <div className="grid grid-cols-4 gap-2 mt-3">
                      {propertyImages.map((img, idx) => (
                        <div key={img.id} className="relative group rounded-xl overflow-hidden aspect-square shadow-sm">
                          <img src={img.preview} alt="" className={`w-full h-full object-cover ${img.uploading ? "opacity-40 blur-[2px]" : ""}`} />
                          {img.uploading && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <Loader2 className="animate-spin text-eerie" size={20} />
                            </div>
                          )}
                          <button type="button" onClick={(e) => { e.stopPropagation(); removeImage(idx); }}
                            className="absolute top-1 right-1 w-5 h-5 rounded-full bg-warn/90 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
                          ><X size={10} /></button>
                          {idx === 0 && (
                            <div className="absolute bottom-0 left-0 right-0 bg-eerie/70 text-ghost text-[9px] font-bold text-center py-0.5">PHOTO PRINCIPALE</div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex gap-4 mt-8">
              <button onClick={prevStep} className="flex-1 py-3 rounded-xl neu-sm text-sm font-bold">Retour</button>
              <button
                onClick={handleSubmit}
                disabled={mutation.isPending || confirmMutation.isPending}
                className="flex-1 py-3 rounded-xl bg-eerie text-ghost text-sm font-bold flex items-center justify-center gap-2 shadow-xl hover:shadow-2xl transition-all disabled:opacity-60"
              >
                {mutation.isPending || confirmMutation.isPending ? "Enregistrement..." : (confirmId ? "Confirmer le dossier" : "Créer le dossier")}
              </button>
            </div>
          </div>
        )}
      </NeuCard>
    </div>
  );
}
