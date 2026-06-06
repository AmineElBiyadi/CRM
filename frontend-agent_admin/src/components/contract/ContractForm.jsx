import { useState } from "react";
import {
  X, ChevronRight, ChevronLeft, FileSignature, Building2,
  DollarSign, CalendarDays, Plus, Trash2, Check, Loader2, AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { createContract } from "@/api/contractApi";

/* ─── constantes ─── */
const STATUS_STEPS = ["DRAFT", "SENT", "RECEIVED_SIGNED", "ARCHIVED"];
const STATUS_LABELS = {
  DRAFT: "Brouillon", SENT: "Envoyé", RECEIVED_SIGNED: "Reçu signé", ARCHIVED: "Archivé",
};

const FORM_STEPS = [
  { id: 1, label: "Bien & Prix", icon: Building2 },
  { id: 2, label: "Dépôt & Dates", icon: DollarSign },
  { id: 3, label: "Calendrier", icon: CalendarDays },
  { id: 4, label: "Récapitulatif", icon: Check },
];

/* ─── helpers ─── */
function fmtUSD(n) {
  if (!n) return "—";
  return Number(n).toLocaleString("en-US") + " $";
}

/* ─────────────────────────────────────────────
   ContractForm
   Props:
     dealId       : UUID du deal associé
     propertyRef  : { title, address, city } optionnel (pré-rempli)
     onClose      : fn() appelée quand on ferme
     onCreated    : fn(contract) quand le contrat est créé
   ───────────────────────────────────────────── */
export function ContractForm({ dealId, propertyRef, onClose, onCreated }) {
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  /* champs du formulaire */
  const [form, setForm] = useState({
    propertyTitle: propertyRef?.title || "",
    propertyAddress: propertyRef?.address || "",
    agreedPrice: propertyRef?.price || "",
    depositAmount: "",
    depositDate: "",
    keyDate: "",
    notes: "",
  });

  /* calendrier de paiement : liste de { amount, dueDate, label } */
  const [payments, setPayments] = useState([
    { id: Date.now(), amount: "", dueDate: "", label: "Versement 1" },
  ]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  /* ── paiements ── */
  const addPayment = () =>
    setPayments((p) => [
      ...p,
      { id: Date.now(), amount: "", dueDate: "", label: `Versement ${p.length + 1}` },
    ]);

  const removePayment = (id) =>
    setPayments((p) => p.filter((x) => x.id !== id));

  const setPayment = (id, k, v) =>
    setPayments((p) => p.map((x) => (x.id === id ? { ...x, [k]: v } : x)));

  /* ── total des paiements ── */
  const paymentsTotal = payments.reduce(
    (s, p) => s + (parseFloat(p.amount) || 0), 0
  );
  const remainingAfterPayments =
    (parseFloat(form.agreedPrice) || 0) -
    (parseFloat(form.depositAmount) || 0) -
    paymentsTotal;

  const validateStep = (s) => {
    if (s === 1) {
      if (!form.agreedPrice || parseFloat(form.agreedPrice) <= 0) {
        toast.error("Veuillez saisir un prix valide");
        return false;
      }
    }
    if (s === 2) {
      const price = parseFloat(form.agreedPrice) || 0;
      const deposit = parseFloat(form.depositAmount) || 0;
      if (deposit > price) {
        toast.error("Le dépôt ne peut pas dépasser le prix total");
        return false;
      }
      if (!form.depositDate) {
        toast.error("Veuillez saisir une date de dépôt");
        return false;
      }
      const today = new Date().toISOString().split('T')[0];
      if (form.depositDate < today) {
        toast.error("La date de dépôt ne peut pas être antérieure à aujourd'hui");
        return false;
      }
    }
    if (s === 3) {
      if (remainingAfterPayments !== 0) {
        toast.error(`Le calendrier de paiement n'est pas équilibré. Reste : ${fmtUSD(remainingAfterPayments)}`);
        return false;
      }
      
      // Validation des dates de versement (chronologie)
      const sortedPayments = [...payments].sort((a, b) => a.id - b.id);
      const today = new Date().toISOString().split('T')[0];
      
      for (let i = 0; i < sortedPayments.length; i++) {
        const p = sortedPayments[i];
        if (!p.dueDate) {
          toast.error(`Veuillez saisir une date pour le versement ${i + 1}`);
          return false;
        }
        if (p.dueDate < today) {
          toast.error(`La date du versement ${i + 1} ne peut pas être dans le passé`);
          return false;
        }
        if (i > 0 && p.dueDate < sortedPayments[i-1].dueDate) {
          toast.error(`La date du versement ${i + 1} doit être égale ou postérieure au versement ${i}`);
          return false;
        }
      }
      
      // Validation de la date de remise des clés par rapport aux versements
      if (form.keyDate) {
        const lastPaymentDate = payments.reduce((max, p) => {
          return (!max || p.dueDate > max) ? p.dueDate : max;
        }, "");
        
        if (lastPaymentDate && form.keyDate < lastPaymentDate) {
          toast.error("La remise des clés doit avoir lieu après le dernier versement.");
          return false;
        }
      }
    }
    return true;
  };

  /* ── soumission ── */
  const handleSubmit = async () => {
    if (!validateStep(3)) return;
    setSaving(true);
    try {
      const body = {
        agreedPrice: parseFloat(form.agreedPrice),
        depositAmount: parseFloat(form.depositAmount),
        depositDate: form.depositDate ? `${form.depositDate}T12:00:00` : null,
        keyHandoverDate: form.keyDate ? `${form.keyDate}T12:00:00` : null,
        internalNotes: form.notes,
        payments: payments.map((p, i) => ({
          amount: parseFloat(p.amount),
          dueDate: p.dueDate,
          paymentOrder: i + 1,
        })),
      };
      const contract = await createContract(dealId, body);
      toast.success("Contrat créé !");
      onCreated?.(contract);
      onClose?.();
    } catch (e) {
      toast.error("Erreur : " + e.message);
    } finally {
      setSaving(false);
    }
  };

  /* ─── render ─── */
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-eerie flex items-center justify-center">
            <FileSignature size={18} className="text-ghost" />
          </div>
          <div>
            <h2 className="font-bold text-lg">Nouveau contrat</h2>
            <p className="text-xs text-muted-foreground">Formulaire guidé — étape {step}/4</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-full neu-sm flex items-center justify-center hover:neu-pressable"
          aria-label="Fermer"
        >
          <X size={16} />
        </button>
      </div>

      {/* Steps indicator */}
      <div className="flex items-center gap-0">
        {FORM_STEPS.map((s, i) => {
          const Icon = s.icon;
          const done = step > s.id;
          const active = step === s.id;
          return (
            <div key={s.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center gap-1 flex-1">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                    done
                      ? "bg-honeydew text-eerie"
                      : active
                      ? "bg-eerie text-ghost"
                      : "neu-inset text-muted-foreground"
                  }`}
                >
                  {done ? <Check size={14} /> : <Icon size={14} />}
                </div>
                <span
                  className={`text-[10px] text-center whitespace-nowrap ${
                    active ? "font-semibold" : "text-muted-foreground"
                  }`}
                >
                  {s.label}
                </span>
              </div>
              {i < FORM_STEPS.length - 1 && (
                <div
                  className={`h-px flex-1 mx-1 mb-4 transition-all ${
                    step > s.id ? "bg-honeydew" : "bg-border"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* ── Step 1 : Bien & Prix ── */}
      {step === 1 && (
        <div className="space-y-4">
          <Field label="Titre du bien">
            <input
              className="input-neu"
              placeholder="Ex : Appartement Anfa, 3 pièces"
              value={form.propertyTitle}
              onChange={(e) => set("propertyTitle", e.target.value)}
            />
          </Field>
          <Field label="Adresse">
            <input
              className="input-neu"
              placeholder="Adresse complète"
              value={form.propertyAddress}
              onChange={(e) => set("propertyAddress", e.target.value)}
            />
          </Field>
          <Field label="Prix convenu ($)">
            <input
              type="number"
              className="input-neu"
              placeholder="240,000"
              value={form.agreedPrice}
              onChange={(e) => set("agreedPrice", e.target.value)}
            />
          </Field>
        </div>
      )}

      {/* ── Step 2 : Dépôt & Dates ── */}
      {step === 2 && (
        <div className="space-y-4">
          <Field label="Dépôt de garantie ($)">
            <input
              type="number"
              className="input-neu"
              placeholder="10,000"
              value={form.depositAmount}
              onChange={(e) => set("depositAmount", e.target.value)}
            />
            {form.agreedPrice && form.depositAmount && (
              <p className="text-xs text-muted-foreground mt-1">
                Soit{" "}
                {((parseFloat(form.depositAmount) / parseFloat(form.agreedPrice)) * 100).toFixed(1)}
                % du prix
              </p>
            )}
          </Field>
          <Field label="Date du dépôt">
            <input
              type="date"
              className="input-neu"
              value={form.depositDate}
              onChange={(e) => set("depositDate", e.target.value)}
            />
          </Field>
          <Field label="Date clé de remise">
            <input
              type="date"
              className="input-neu"
              value={form.keyDate}
              onChange={(e) => set("keyDate", e.target.value)}
            />
          </Field>
          <Field label="Notes internes">
            <textarea
              rows={3}
              className="input-neu resize-none"
              placeholder="Conditions particulières, remarques…"
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
            />
          </Field>
        </div>
      )}

      {/* ── Step 3 : Calendrier de paiement ── */}
      {step === 3 && (
        <div className="space-y-4">
          <div className={`p-4 rounded-xl text-sm space-y-1 transition-colors ${remainingAfterPayments !== 0 ? "bg-warn/10 border border-warn/30" : "bg-alice/40"}`}>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Prix total</span>
              <span className="font-semibold">{fmtUSD(form.agreedPrice)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Dépôt</span>
              <span>− {fmtUSD(form.depositAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total versements</span>
              <span>− {fmtUSD(paymentsTotal)}</span>
            </div>
            <div
              className={`flex justify-between border-t border-border pt-2 font-bold ${
                remainingAfterPayments !== 0 ? "text-warn" : "text-eerie"
              }`}
            >
              <span>Restant</span>
              <span>{fmtUSD(remainingAfterPayments)}</span>
            </div>
            {remainingAfterPayments !== 0 && (
              <p className="text-[10px] text-warn font-bold mt-2 flex items-center gap-1">
                <AlertCircle size={10} /> Le total doit être égal au prix total
              </p>
            )}
          </div>

          <div className="space-y-3">
            {payments.map((p, i) => (
              <div key={p.id} className="flex gap-2 items-start">
                <div className="flex-1 p-3 rounded-xl neu-sm space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-muted-foreground w-24 shrink-0">
                      Versement {i + 1}
                    </span>
                    <input
                      className="input-neu text-sm"
                      placeholder="Libellé"
                      value={p.label}
                      onChange={(e) => setPayment(p.id, "label", e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-muted-foreground">Montant ($)</label>
                      <input
                        type="number"
                        className="input-neu mt-1"
                        placeholder="50,000"
                        value={p.amount}
                        onChange={(e) => setPayment(p.id, "amount", e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground">Date d'échéance</label>
                      <input
                        type="date"
                        className="input-neu mt-1"
                        value={p.dueDate}
                        onChange={(e) => setPayment(p.id, "dueDate", e.target.value)}
                      />
                    </div>
                  </div>
                </div>
                {payments.length > 1 && (
                  <button
                    onClick={() => removePayment(p.id)}
                    className="mt-3 w-8 h-8 rounded-lg neu-sm flex items-center justify-center text-destructive hover:neu-pressable"
                    aria-label="Supprimer versement"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>

          <button
            onClick={addPayment}
            className="w-full py-2.5 rounded-xl border-2 border-dashed border-border text-sm text-muted-foreground hover:border-eerie hover:text-eerie transition-colors flex items-center justify-center gap-2"
          >
            <Plus size={14} /> Ajouter un versement
          </button>
        </div>
      )}

      {/* ── Step 4 : Récapitulatif ── */}
      {step === 4 && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-honeydew/40 text-sm space-y-2">
            <RecapRow label="Bien" value={form.propertyTitle || "—"} />
            <RecapRow label="Adresse" value={form.propertyAddress || "—"} />
            <RecapRow label="Prix convenu" value={fmtUSD(form.agreedPrice)} />
            <RecapRow label="Dépôt" value={fmtUSD(form.depositAmount)} />
            <RecapRow label="Date dépôt" value={form.depositDate || "—"} />
            <RecapRow label="Remise des clés" value={form.keyDate || "—"} />
          </div>

          {payments.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">
                Calendrier de paiement
              </p>
              <div className="space-y-2">
                {payments.map((p, i) => (
                  <div key={p.id} className="flex justify-between items-center p-2.5 rounded-lg neu-sm text-sm">
                    <span>{p.label || `Versement ${i + 1}`}</span>
                    <div className="text-right">
                      <div className="font-semibold">{fmtUSD(p.amount)}</div>
                      <div className="text-[10px] text-muted-foreground">{p.dueDate || "date ?"}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {form.notes && (
            <div className="p-3 rounded-xl bg-vanilla/40 text-sm">
              <p className="text-xs text-muted-foreground mb-1">Notes</p>
              <p>{form.notes}</p>
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-3 pt-2 border-t border-border">
        {step > 1 && (
          <button
            onClick={() => setStep((s) => s - 1)}
            className="flex-1 py-3 rounded-xl neu-sm hover:neu-pressable text-sm font-medium flex items-center justify-center gap-2"
          >
            <ChevronLeft size={16} /> Précédent
          </button>
        )}
        {step < 4 ? (
          <button
            onClick={() => {
              if (validateStep(step)) setStep((s) => s + 1);
            }}
            className="flex-1 py-3 rounded-xl bg-eerie text-ghost text-sm font-medium hover:opacity-90 flex items-center justify-center gap-2"
          >
            Suivant <ChevronRight size={16} />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 py-3 rounded-xl bg-eerie text-ghost text-sm font-medium hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {saving ? (
              <><Loader2 size={16} className="animate-spin" /> Création…</>
            ) : (
              <><Check size={16} /> Créer le contrat</>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

/* ─── sous-composants internes ─── */
function Field({ label, children }) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{label}</label>
      {children}
    </div>
  );
}

function RecapRow({ label, value }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right max-w-[60%] truncate">{value}</span>
    </div>
  );
}

/* ─────────────────────────────────────────────
   ContractStatusTracker
   Affiche la barre de progression d'un contrat + bouton changement de statut
   Props: contract { idContract, status }, onStatusChange fn(newStatus)
   ───────────────────────────────────────────── */
export function ContractStatusTracker({ contract, onStatusChange }) {
  const currentIdx = STATUS_STEPS.indexOf(contract.status);

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div className="flex items-center">
        {STATUS_STEPS.map((s, i) => {
          const done = currentIdx > i;
          const active = currentIdx === i;
          return (
            <div key={s} className="flex items-center flex-1">
              <div className="flex flex-col items-center gap-1.5 flex-1">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                    done ? "bg-honeydew" : active ? "bg-eerie text-ghost" : "neu-inset"
                  }`}
                >
                  {done ? <Check size={14} /> : <span className="text-xs font-bold">{i + 1}</span>}
                </div>
                <span className={`text-[10px] text-center ${active ? "font-semibold" : "text-muted-foreground"}`}>
                  {STATUS_LABELS[s]}
                </span>
              </div>
              {i < STATUS_STEPS.length - 1 && (
                <div
                  className={`h-px flex-1 mx-1 mb-5 ${
                    currentIdx > i ? "bg-honeydew" : "bg-border"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Action button — only if not archived */}
      {contract.status !== "ARCHIVED" && (
        <button
          onClick={() => onStatusChange?.(STATUS_STEPS[currentIdx + 1])}
          className="w-full py-2.5 rounded-xl bg-eerie text-ghost text-sm font-medium hover:opacity-90 flex items-center justify-center gap-2"
        >
          <ChevronRight size={16} />
          Passer à : {STATUS_LABELS[STATUS_STEPS[currentIdx + 1]]}
        </button>
      )}
    </div>
  );
}

export default ContractForm;
