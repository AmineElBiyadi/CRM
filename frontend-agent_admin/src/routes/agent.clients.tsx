import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { NeuCard } from "@/components/ui/neu-card";
import { Avatar, LeadScore, SoftBadge, StageBadge } from "@/components/ui/design-bits";
import { Search, LayoutGrid, List, Plus, X, ChevronRight, ChevronLeft, Check, Users, FolderOpen } from "lucide-react";
import { toast } from "sonner";
import { useClientIdentities, useCreateClientIdentity } from "@/hooks/useClients";
import { checkClientExistence } from "@/api/clientsApi";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export const Route = createFileRoute("/agent/clients")({
  component: ClientsPage,
});

function ClientsPage() {
  const [view, setView] = useState<"grid" | "list">("grid");
  const [query, setQuery] = useState("");
  
  // Creation state
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    source: "Saisie manuelle"
  });
  const [existingClient, setExistingClient] = useState<any>(null);

  const { data: identities, isLoading } = useClientIdentities();
  const createIdentityMutation = useCreateClientIdentity();

  const resetForm = () => {
    setCreating(false);
    setExistingClient(null);
    setForm({
      firstName: "", lastName: "", email: "", phone: "", source: "Saisie manuelle"
    });
  };

  const handleCreate = async () => {
    try {
      const existing = await checkClientExistence({ email: form.email, phone: form.phone });
      if (existing) {
        setExistingClient(existing);
        return;
      }
      
      createIdentityMutation.mutate(form, {
        onSuccess: () => {
          toast.success("Client créé avec succès. Ses identifiants seront envoyés par email.");
          resetForm();
        },
        onError: () => toast.error("Erreur lors de la création")
      });
    } catch (err) {
      toast.error("Erreur lors de la vérification");
    }
  };

  const filtered = useMemo(() => {
    const data = identities || [];
    if (!query) return data;
    const q = query.toLowerCase();
    return data.filter(c => 
      c.firstName.toLowerCase().includes(q) || 
      c.lastName.toLowerCase().includes(q) || 
      c.email.toLowerCase().includes(q)
    );
  }, [identities, query]);

  return (
    <div className="space-y-6 max-w-[1400px] relative">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Mes clients</h1>
          <p className="text-sm text-muted-foreground mt-1">{filtered.length} clients uniques</p>
        </div>
        <div className="flex items-center gap-2 md:gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[180px]">
            <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Chercher par nom, email…"
              className="pl-10 pr-4 py-2.5 rounded-xl neu-inset bg-transparent text-sm w-full md:w-64 focus:outline-none"
            />
          </div>
          <div className="neu-sm rounded-xl p-1 flex gap-1">
            <button onClick={() => setView("grid")} className={`w-9 h-9 rounded-lg flex items-center justify-center ${view === "grid" ? "neu-inset" : ""}`}><LayoutGrid size={14} /></button>
            <button onClick={() => setView("list")} className={`w-9 h-9 rounded-lg flex items-center justify-center ${view === "list" ? "neu-inset" : ""}`}><List size={14} /></button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
      ) : filtered.length === 0 ? (
        <NeuCard className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <div className="w-14 h-14 rounded-2xl bg-alice flex items-center justify-center"><Search size={20} /></div>
          <div className="font-semibold text-lg">Aucun client trouvé</div>
          <p className="text-sm text-muted-foreground max-w-[280px]">Utilisez le bouton + pour enregistrer un nouveau client dans votre base.</p>
        </NeuCard>
      ) : view === "grid" ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((c) => (
            <NeuCard key={c.idClient} className="flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <Avatar name={`${c.firstName} ${c.lastName}`} size={56} />
                <div className="min-w-0">
                  <div className="font-bold text-lg truncate">{c.firstName} {c.lastName}</div>
                  <div className="text-xs text-muted-foreground font-medium">{c.email}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 py-2 border-y border-border/50">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Téléphone</div>
                  <div className="text-xs font-semibold">{c.phone}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Source</div>
                  <div className="text-xs font-semibold truncate">{c.source}</div>
                </div>
              </div>
              <div className="flex items-center justify-between mt-auto">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <FolderOpen size={13} />
                  <span>{c.dossierCount} dossier{c.dossierCount > 1 ? 's' : ''}</span>
                </div>
                <div className="text-[10px] text-muted-foreground">
                  Inscrit le {format(new Date(c.createdAt), "dd MMM yyyy", { locale: fr })}
                </div>
              </div>
            </NeuCard>
          ))}
        </div>
      ) : (
        <NeuCard className="overflow-x-auto p-0 soft-scroll">
          <table className="w-full text-sm min-w-[800px]">
            <thead>
              <tr className="text-left text-xs text-muted-foreground border-b border-border">
                <th className="p-4">Client</th>
                <th className="p-4">Coordonnées</th>
                <th className="p-4">Source</th>
                <th className="p-4 text-center">Dossiers</th>
                <th className="p-4">Date de création</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.idClient} className="border-b border-border last:border-0 hover:bg-alice/30 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={`${c.firstName} ${c.lastName}`} size={36} />
                      <span className="font-bold">{c.firstName} {c.lastName}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col">
                      <span className="font-medium">{c.email}</span>
                      <span className="text-xs text-muted-foreground">{c.phone}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <SoftBadge tone="info">{c.source}</SoftBadge>
                  </td>
                  <td className="p-4 text-center">
                    <span className="neu-inset px-2.5 py-1 rounded-lg font-bold text-xs">
                      {c.dossierCount}
                    </span>
                  </td>
                  <td className="p-4 text-muted-foreground text-xs">
                    {format(new Date(c.createdAt), "dd/MM/yyyy HH:mm")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </NeuCard>
      )}

      <button
        onClick={() => setCreating(true)}
        className="fixed bottom-8 right-8 w-16 h-16 rounded-full bg-eerie text-ghost shadow-[0_10px_40px_rgba(0,0,0,0.3)] flex items-center justify-center hover:scale-105 active:scale-95 transition-all z-30"
      >
        <Plus size={28} />
      </button>

      {creating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-eerie/40 backdrop-blur-md" onClick={resetForm}>
          <div 
            className="relative bg-ghost rounded-[2.5rem] max-w-lg w-full p-8 md:p-10 shadow-[0_20px_70px_rgba(0,0,0,0.4)] flex flex-col gap-8" 
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={resetForm} className="absolute top-6 right-6 w-10 h-10 rounded-full neu-sm flex items-center justify-center hover:bg-alice transition-colors">
              <X size={18} />
            </button>

            <div>
              <h2 className="text-3xl font-extrabold tracking-tight">Nouveau Client</h2>
              <p className="text-muted-foreground text-sm mt-2 font-medium">
                Enregistrez une nouvelle identité dans votre base CRM.
              </p>
            </div>

            {existingClient ? (
              <div className="flex-1 space-y-6">
                <NeuCard className="bg-amber-50/50 border-amber-200/50 flex flex-col gap-4 text-center items-center py-8">
                  <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                    <Users size={32} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Client déjà existant</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {existingClient.firstName} {existingClient.lastName} ({existingClient.email}) possède déjà un compte portail.
                    </p>
                  </div>
                </NeuCard>
                <div className="p-4 rounded-2xl bg-alice/50 border border-border text-center">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest leading-relaxed">
                    Souhaitez-vous créer un <br />
                    <span className="text-eerie text-sm tracking-normal capitalize font-bold">Nouveau Dossier Transactionnel</span> <br />
                    pour ce client ?
                  </p>
                  <button 
                    disabled
                    className="mt-4 w-full py-3.5 rounded-2xl bg-eerie/10 text-eerie/50 text-sm font-bold cursor-not-allowed opacity-60"
                  >
                    Bientôt disponible (Phase 2)
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 space-y-5">
                <div className="grid grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Prénom</label>
                    <input
                      autoFocus
                      value={form.firstName}
                      onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                      placeholder="Jean"
                      className="w-full px-5 py-4 neu-inset rounded-2xl bg-transparent focus:outline-none text-sm font-medium placeholder:text-muted-foreground/40"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Nom</label>
                    <input
                      value={form.lastName}
                      onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                      placeholder="Dupont"
                      className="w-full px-5 py-4 neu-inset rounded-2xl bg-transparent focus:outline-none text-sm font-medium placeholder:text-muted-foreground/40"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Adresse Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="jean.dupont@exemple.com"
                    className="w-full px-5 py-4 neu-inset rounded-2xl bg-transparent focus:outline-none text-sm font-medium placeholder:text-muted-foreground/40"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Téléphone</label>
                  <input
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="+212 600 00 00 00"
                    className="w-full px-5 py-4 neu-inset rounded-2xl bg-transparent focus:outline-none text-sm font-medium placeholder:text-muted-foreground/40"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Source d'acquisition</label>
                  <select
                    value={form.source}
                    onChange={(e) => setForm({ ...form, source: e.target.value })}
                    className="w-full px-5 py-4 neu-inset rounded-2xl bg-transparent focus:outline-none text-sm font-medium appearance-none"
                  >
                    <option value="Saisie manuelle">Saisie manuelle</option>
                    <option value="Site Web">Site Web</option>
                    <option value="Recommandation">Recommandation</option>
                    <option value="Réseaux Sociaux">Réseaux Sociaux</option>
                    <option value="Autre">Autre</option>
                  </select>
                </div>
              </div>
            )}

            <div className="flex gap-4 pt-2">
              <button 
                onClick={existingClient ? resetForm : handleCreate}
                disabled={!existingClient && (!form.firstName || !form.lastName || !form.email || !form.phone)}
                className="w-full py-5 rounded-[1.5rem] bg-eerie text-ghost text-base font-black flex items-center justify-center gap-3 hover:opacity-95 active:scale-[0.98] transition-all disabled:opacity-40 disabled:pointer-events-none shadow-[0_10px_30px_rgba(0,0,0,0.2)]"
              >
                {existingClient ? (
                  <>Compris</>
                ) : createIdentityMutation.isPending ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-ghost"></div>
                ) : (
                  <>Enregistrer l'identité <Check size={20} /></>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
