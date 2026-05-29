import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { NeuCard } from "@/components/ui/neu-card";
import { SoftBadge } from "@/components/ui/design-bits";
import { FileText, Upload, Download, Check, X, Clock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useClientData } from "@/hooks/use-client-data";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export const Route = createFileRoute("/client/documents")({
  component: ClientDocuments,
});

function ClientDocuments() {
  const { data, isLoading } = useClientData();
  const [uploadingDocId, setUploadingDocId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center p-12">
        <Loader2 className="animate-spin text-vanilla" size={32} />
      </div>
    );
  }

  const missingDocs = data?.documents?.filter(d => !d.confirmedReceived) || [];
  const receivedDocs = data?.documents?.filter(d => d.confirmedReceived) || [];

  const triggerUpload = (docId: string) => {
    setUploadingDocId(docId);
    fileInputRef.current?.click();
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && uploadingDocId) {
      toast.success(`${file.name} uploadé · en cours de vérification par SmartEstate`);
    }
    setUploadingDocId(null);
    e.target.value = "";
  };

  return (
    <div className="space-y-6 md:space-y-8 max-w-[1000px]">
      <input ref={fileInputRef} type="file" className="hidden" onChange={handleFile} />

      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Mes documents</h1>
        <p className="text-sm text-muted-foreground mt-1">Gérez les documents de votre dossier</p>
      </div>

      <NeuCard>
        <h2 className="font-semibold mb-5">Documents à fournir</h2>
        <div className="space-y-3">
          {missingDocs.map((d) => (
            <div key={d.idDocument} className="flex flex-wrap items-center gap-3 md:gap-4 p-3 md:p-4 neu-sm rounded-xl">
              <FileText size={20} className="text-destructive shrink-0" />
              <div className="flex-1 font-medium text-sm min-w-[140px]">{d.documentType}</div>
              <SoftBadge tone="danger"><X size={12} /> Manquant</SoftBadge>
              <button
                onClick={() => triggerUpload(d.idDocument)}
                className="px-4 py-2 rounded-lg bg-eerie text-ghost text-xs font-medium hover:opacity-90 flex items-center gap-1.5"
              >
                <Upload size={12} /> Uploader
              </button>
            </div>
          ))}
          {missingDocs.length === 0 && (
            <div className="py-4 text-center text-sm text-muted-foreground italic">
              Super ! Il ne manque aucun document à votre dossier.
            </div>
          )}
        </div>
      </NeuCard>

      <NeuCard>
        <h2 className="font-semibold mb-5">Documents archivés</h2>
        <div className="space-y-3">
          {receivedDocs.map((d) => (
            <div key={d.idDocument} className="flex flex-wrap items-center gap-3 md:gap-4 p-3 md:p-4 neu-sm rounded-xl">
              <div className="w-10 h-10 rounded-lg bg-alice flex items-center justify-center shrink-0 text-eerie">
                <FileText size={18} />
              </div>
              <div className="flex-1 min-w-[140px]">
                <div className="font-medium text-sm truncate">{d.documentType}</div>
                <div className="text-xs text-muted-foreground">
                  Reçu le {format(new Date(d.createdAt), "d MMMM yyyy", { locale: fr })}
                </div>
              </div>
              <button
                onClick={() => toast.success(`Téléchargement de ${d.documentType} lancé`)}
                className="px-4 py-2 rounded-lg neu-sm hover:neu-pressable text-xs font-medium flex items-center gap-1.5"
              >
                <Download size={12} /> Télécharger
              </button>
            </div>
          ))}
          {receivedDocs.length === 0 && (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Aucun document archivé pour le moment.
            </div>
          )}
        </div>
      </NeuCard>
    </div>
  );
}
