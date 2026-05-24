import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchIdentities } from "@/api/clientsApi";
import { createDossier, type CreateDossierRequest } from "@/api/dossiersApi";
import { NeuCard } from "@/components/ui/neu-card";
import { Avatar, SoftBadge } from "@/components/ui/design-bits";
import { 
  ChevronLeft, ChevronRight, User, ShoppingCart, Home, 
  MapPin, Layers, Maximize, CircleSlash, CheckCircle2, Sparkles
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/agent/dossiers/create")({
  component: CreateDossierPage,
});

function CreateDossierPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<Partial<CreateDossierRequest>>({
    type: 'BUYER',
    budgetMin: 0,
    budgetMax: 0,
    propertySpecificType: 'Appartement',
    preferredArea: '',
    surfaceM2: 0,
    floor: -1,
  });

  const { data: identities, isLoading } = useQuery({
    queryKey: ["identities"],
    queryFn: fetchIdentities,
  });

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

  const nextStep = () => setStep((s) => s + 1);
  const prevStep = () => setStep((s) => s - 1);

  const handleSubmit = () => {
    if (!formData.idClient) {
      toast.error("Veuillez sélectionner un client.");
      return;
    }
    mutation.mutate(formData as CreateDossierRequest);
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
      <div className="flex items-center gap-2 px-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex-1 flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${step >= i ? "bg-eerie text-ghost" : "neu-inset text-muted-foreground"}`}>
              {step > i ? <CheckCircle2 size={16} /> : i}
            </div>
            {i < 3 && <div className={`flex-1 h-px ${step > i ? "bg-eerie" : "bg-border"}`} />}
          </div>
        ))}
      </div>

      <NeuCard className="p-8">
        {step === 1 && (
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <User className="text-muted-foreground" size={20} />
              <h2 className="text-xl font-bold">Sélection du client</h2>
            </div>
            
            {isLoading ? (
              <div className="py-8 text-center">Chargement des clients...</div>
            ) : (
              <div className="grid grid-cols-1 gap-3 max-h-[400px] overflow-y-auto pr-2 soft-scroll">
                {identities?.map((id) => (
                  <button
                    key={id.idClient}
                    onClick={() => setFormData({ ...formData, idClient: id.idClient })}
                    className={`flex items-center gap-4 p-4 rounded-xl transition-all text-left ${formData.idClient === id.idClient ? "neu-inset ring-2 ring-eerie/10" : "neu-sm hover:bg-alice/10"}`}
                  >
                    <Avatar name={id.firstName} size={40} />
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-eerie text-sm">{id.firstName} {id.lastName}</div>
                      <div className="text-xs text-muted-foreground truncate">{id.email}</div>
                    </div>
                    {formData.idClient === id.idClient && <CheckCircle2 size={18} className="text-eerie" />}
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
            <div className="flex items-center gap-2 mb-4">
              <ShoppingCart className="text-muted-foreground" size={20} />
              <h2 className="text-xl font-bold">Type & Budget</h2>
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
                <select
                  value={formData.propertySpecificType}
                  onChange={(e) => setFormData({ ...formData, propertySpecificType: e.target.value })}
                  className="w-full px-4 py-3 neu-inset rounded-xl bg-ghost focus:outline-none text-sm font-medium appearance-none"
                >
                  <option>Appartement</option>
                  <option>Maison / Villa</option>
                  <option>Terrain</option>
                  <option>Local Commercial</option>
                </select>
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
                    <select
                      value={formData.floor}
                      onChange={(e) => setFormData({ ...formData, floor: Number(e.target.value) })}
                      className="w-full pl-10 pr-4 py-3 neu-inset rounded-xl bg-ghost focus:outline-none text-sm font-medium appearance-none"
                    >
                      <option value="-1">Indifférent</option>
                      <option value="0">Rez-de-chaussée</option>
                      <option value="1">1er étage</option>
                      <option value="2">2ème étage</option>
                      <option value="3">3ème étage et +</option>
                      <option value="-2">Dernier étage</option>
                    </select>
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
