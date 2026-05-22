import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { NeuCard } from "@/components/ui/neu-card";
import { SoftBadge } from "@/components/ui/design-bits";
import { FileText, Upload, Download, Check, X, Clock } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/client/documents")({
  component: ClientDocuments,
});

const initialRequired = [
  { name: "CNI recto/verso", status: "ok" as const },
  { name: "Justificatif de domicile", status: "ok" as const },
  { name: "Justificatif de revenus 2024", status: "missing" as const },
  { name: "Pré-accord bancaire", status: "missing" as const },
  { name: "Relevés bancaires 3 derniers mois", status: "pending" as const },
];

const received = [
  { name: "Mandat de recherche signé.pdf", date: "12 nov. 2025" },
  { name: "Brochure agence.pdf", date: "08 nov. 2025" },
  { name: "Compte-rendu visite Anfa.pdf", date: "16 nov. 2025" },
];

function ClientDocuments() {
  const [required, setRequired] = useState(initialRequired);
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const triggerUpload = (idx: number) => {
    setUploadingIdx(idx);
    fileInputRef.current?.click();
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && uploadingIdx !== null) {
      setRequired((prev) => prev.map((d, i) => i === uploadingIdx ? { ...d, status: "pending" } : d));
      toast.success(`${file.name} uploadé · en cours de vérification`);
    }
    setUploadingIdx(null);
    e.target.value = "";
  };

  return (
    <div className="space-y-6 md:space-y-8 max-w-[1000px]">
      <input ref={fileInputRef} type="file" className="hidden" onChange={handleFile} />

      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Mes documents</h1>
        <p className="text-sm text-muted-foreground mt-1">Gardez votre dossier à jour</p>
      </div>

      <NeuCard>
        <h2 className="font-semibold mb-5">Documents à fournir</h2>
        <div className="space-y-3">
          {required.map((d, i) => (
            <div key={d.name} className="flex flex-wrap items-center gap-3 md:gap-4 p-3 md:p-4 neu-sm rounded-xl">
              <FileText size={20} className="text-muted-foreground shrink-0" />
              <div className="flex-1 font-medium text-sm min-w-[140px]">{d.name}</div>
              {d.status === "ok" && <SoftBadge tone="success"><Check size={12} /> Fourni</SoftBadge>}
              {d.status === "pending" && <SoftBadge><Clock size={12} /> En attente</SoftBadge>}
              {d.status === "missing" && (
                <>
                  <SoftBadge tone="danger"><X size={12} /> Manquant</SoftBadge>
                  <button
                    onClick={() => triggerUpload(i)}
                    className="px-4 py-2 rounded-lg bg-eerie text-ghost text-xs font-medium hover:opacity-90 flex items-center gap-1.5"
                  >
                    <Upload size={12} /> Uploader
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      </NeuCard>

      <NeuCard>
        <h2 className="font-semibold mb-5">Documents reçus de l'agence</h2>
        <div className="space-y-3">
          {received.map((d) => (
            <div key={d.name} className="flex flex-wrap items-center gap-3 md:gap-4 p-3 md:p-4 neu-sm rounded-xl">
              <div className="w-10 h-10 rounded-lg bg-alice flex items-center justify-center shrink-0">
                <FileText size={18} />
              </div>
              <div className="flex-1 min-w-[140px]">
                <div className="font-medium text-sm truncate">{d.name}</div>
                <div className="text-xs text-muted-foreground">Reçu le {d.date}</div>
              </div>
              <button
                onClick={() => toast.success(`${d.name} téléchargé`)}
                className="px-4 py-2 rounded-lg neu-sm hover:neu-pressable text-xs font-medium flex items-center gap-1.5"
              >
                <Download size={12} /> Télécharger
              </button>
            </div>
          ))}
        </div>
      </NeuCard>
    </div>
  );
}
