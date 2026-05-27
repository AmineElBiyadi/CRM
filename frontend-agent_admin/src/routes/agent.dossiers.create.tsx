import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchIdentities } from "@/api/clientsApi";
import { createDossier, fetchDossierDetail, fetchPropertyTypes, type CreateDossierRequest } from "@/api/dossiersApi";
import { useConfirmDossier } from "@/hooks/useDossiers";
import { NeuCard } from "@/components/ui/neu-card";
import { Avatar, SoftBadge } from "@/components/ui/design-bits";
import { 
  ChevronLeft, ChevronRight, User, ShoppingCart, Home, 
  MapPin, Layers, Maximize, CircleSlash, CheckCircle2, Sparkles, ChevronDown
} from "lucide-react";
import { toast } from "sonner";

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
    budgetMin: 0,
    budgetMax: 0,
    propertySpecificType: 'Appartement',
    preferredArea: '',
    surfaceM2: 0,
    floor: -1,
  });
  
  const [openPropertyType, setOpenPropertyType] = useState(false);
  const [openFloor, setOpenFloor] = useState(false);

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
      setFormData({
        idClient: dossierToConfirm.idClient,
        type: dossierToConfirm.clientType,
        budgetMin: dossierToConfirm.budgetMin,
        budgetMax: dossierToConfirm.budgetMax,
        propertySpecificType: dossierToConfirm.propertyType,
        preferredArea: dossierToConfirm.preferredArea,
        surfaceM2: dossierToConfirm.preferredSizeM2,
        floor: dossierToConfirm.preferredFloor,
      });
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
          <p className="text-muted-foreground text-sm">Formulaire 2 : Créer une opportunité transactionnelle.</p>
        </div>
      </div>

      {/* Progress Stepper */}
      {/* Stepper dynamic layout */}
      <div className="flex items-center justify-center gap-2 px-4 py-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className={`flex items-center ${i < 3 ? "flex-1" : ""}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shadow-sm transition-all ${step >= i ? "bg-eerie text-ghost scale-110" : "neu-inset text-muted-foreground"}`}>
              {step > i ? <CheckCircle2 size={20} /> : i}
            </div>
            {i < 3 && <div className={`flex-1 h-0.5 mx-2 rounded-full ${step > i ? "bg-eerie" : "bg-border/60"}`} />}
          </div>
        ))}
      </div>

      <NeuCard className="p-10 shadow-xl border border-border/5">
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

        {step === 2 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ShoppingCart className="text-muted-foreground" size={20} />
                <h2 className="text-xl font-bold">Type & Budget</h2>
              </div>
              {formData.idClient && identities && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-alice/50 border border-alice">
                  <Avatar name={identities.find(id => id.idClient === formData.idClient)?.firstName || ""} size={20} />
                  <span className="text-xs font-medium text-eerie">
                    {identities.find(id => id.idClient === formData.idClient)?.firstName} {identities.find(id => id.idClient === formData.idClient)?.lastName}
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <label className="block">
                <span className="text-sm font-semibold text-muted-foreground block mb-2">Type de dossier</span>
                <div className="flex gap-4">
                  <button
                    onClick={() => setFormData({ ...formData, type: 'BUYER' })}
                    className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-all ${formData.type === 'BUYER' ? "neu-inset" : "neu-sm"}`}
                  >
                    <ShoppingCart size={16} /> Acheteur
                  </button>
                  <button
                    onClick={() => setFormData({ ...formData, type: 'SELLER' })}
                    className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-all ${formData.type === 'SELLER' ? "neu-inset" : "neu-sm"}`}
                  >
                    <Home size={16} /> Vendeur
                  </button>
                </div>
              </label>

              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-sm font-semibold text-muted-foreground block mb-2">Budget Min (MAD)</span>
                  <input
                    type="number"
                    value={formData.budgetMin}
                    onChange={(e) => setFormData({ ...formData, budgetMin: Number(e.target.value) })}
                    className="w-full px-4 py-3 neu-inset rounded-xl bg-transparent focus:outline-none text-sm font-medium"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-semibold text-muted-foreground block mb-2">Budget Max (MAD)</span>
                  <input
                    type="number"
                    value={formData.budgetMax}
                    onChange={(e) => setFormData({ ...formData, budgetMax: Number(e.target.value) })}
                    className="w-full px-4 py-3 neu-inset rounded-xl bg-transparent focus:outline-none text-sm font-medium"
                  />
                </label>
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <button onClick={prevStep} className="flex-1 py-3 rounded-xl neu-sm text-sm font-bold">Retour</button>
              <button onClick={nextStep} className="flex-1 py-3 rounded-xl bg-eerie text-ghost text-sm font-bold">Suivant</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="text-muted-foreground" size={20} />
              <h2 className="text-xl font-bold">Préférences immobilières</h2>
            </div>

            <div className="space-y-4">
              <label className="block">
                <span className="text-sm font-semibold text-muted-foreground block mb-2">Type de bien</span>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setOpenPropertyType(!openPropertyType)}
                    className="w-full px-4 py-3 neu-inset rounded-xl bg-ghost focus:outline-none text-sm font-medium flex items-center justify-between transition-all hover:bg-alice/20"
                  >
                    <span>{formData.propertySpecificType || "Sélectionner..."}</span>
                    <ChevronDown size={16} className={`transition-transform duration-200 ${openPropertyType ? "rotate-180" : ""}`} />
                  </button>
                  
                  {openPropertyType && (
                    <div className="absolute z-50 w-full mt-2 py-2 neu-sm rounded-xl bg-ghost/95 backdrop-blur-sm shadow-2xl max-h-[300px] overflow-y-auto soft-scroll animate-in fade-in zoom-in-95 duration-100">
                      {propertyTypes?.map((pt) => (
                        <button
                          key={pt.idPropertyType}
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, propertySpecificType: pt.specificType });
                            setOpenPropertyType(false);
                          }}
                          className={`w-full px-4 py-2.5 text-left text-sm font-medium hover:bg-eerie hover:text-ghost transition-colors ${formData.propertySpecificType === pt.specificType ? "bg-alice" : ""}`}
                        >
                          {pt.specificType}
                        </button>
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
                  <span className="text-sm font-semibold text-muted-foreground block mb-2">Superficie (m²)</span>
                  <div className="relative">
                    <Maximize className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
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
                    <Layers className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                    <button
                      type="button"
                      onClick={() => setOpenFloor(!openFloor)}
                      className="w-full pl-11 pr-4 py-3 neu-inset rounded-xl bg-ghost focus:outline-none text-sm font-medium flex items-center justify-between transition-all hover:bg-alice/20"
                    >
                      <span className="truncate">
                        {formData.floor === -1 && "Indifférent"}
                        {formData.floor === 0 && "Rez-de-chaussée"}
                        {formData.floor === 1 && "1er étage"}
                        {formData.floor === 2 && "2ème étage"}
                        {formData.floor === 3 && "3ème étage et +"}
                        {formData.floor === -2 && "Dernier étage"}
                      </span>
                      <ChevronDown size={14} className={`transition-transform duration-200 ${openFloor ? "rotate-180" : ""}`} />
                    </button>

                    {openFloor && (
                      <div className="absolute z-50 w-full mt-2 py-2 neu-sm rounded-xl bg-ghost/95 backdrop-blur-sm shadow-2xl animate-in fade-in zoom-in-95 duration-100">
                        {[
                          { value: -1, label: "Indifférent" },
                          { value: 0, label: "Rez-de-chaussée" },
                          { value: 1, label: "1er étage" },
                          { value: 2, label: "2ème étage" },
                          { value: 3, label: "3ème étage et +" },
                          { value: -2, label: "Dernier étage" },
                        ].map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => {
                              setFormData({ ...formData, floor: opt.value });
                              setOpenFloor(false);
                            }}
                            className={`w-full px-4 py-2 text-left text-sm font-medium hover:bg-eerie hover:text-ghost transition-colors ${formData.floor === opt.value ? "bg-alice" : ""}`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </label>
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <button onClick={prevStep} className="flex-1 py-3 rounded-xl neu-sm text-sm font-bold">Retour</button>
              <button 
                onClick={handleSubmit} 
                disabled={mutation.isPending}
                className="flex-1 py-3 rounded-xl bg-eerie text-ghost text-sm font-bold flex items-center justify-center gap-2 shadow-xl hover:shadow-2xl transition-all"
              >
                {mutation.isPending ? "Création..." : "Créer le dossier"}
              </button>
            </div>
          </div>
        )}
      </NeuCard>
    </div>
  );
}
