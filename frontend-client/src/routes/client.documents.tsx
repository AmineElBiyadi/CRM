import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { NeuCard } from "@/components/ui/neu-card";
import { SoftBadge } from "@/components/ui/design-bits";
import { FileText, Upload, Download, Check, X, Clock, Loader2, Building2, FileSignature } from "lucide-react";
import { toast } from "sonner";
import { useClientData } from "@/hooks/use-client-data";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/client/documents")({
  component: ClientDocuments,
});

function ClientDocuments() {
  const { data, isLoading } = useClientData();
  const [uploadingDocId, setUploadingDocId] = useState<string | null>(null);
  const [dealFilter, setDealFilter] = useState("ALL");
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center p-12">
        <Loader2 className="animate-spin text-vanilla" size={32} />
      </div>
    );
  }

  // Grouper par dossier
  const deals = data?.dossiers || [];
  
  const getDocumentsForDeal = (dealId: string) => {
    return data?.documents?.filter(d => d.dealId === dealId) || [];
  };

  const getContractsForDeal = (dealId: string) => {
    return data?.contracts?.filter(c => c.dealId === dealId) || [];
  };

  const getDealTitle = (deal: any) => {
    if (deal.propertyTitle) return deal.propertyTitle;
    const type = deal.clientType === "BUYER" ? "Achat" : "Vente";
    return `${type} — ${deal.city || 'Dossier'}`;
  };

  const filteredDeals = dealFilter === "ALL" 
    ? deals 
    : deals.filter(d => d.idDeal === dealFilter);

  return (
    <div className="space-y-6 md:space-y-8 max-w-full pb-12">
      <input ref={fileInputRef} type="file" className="hidden" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Mes documents & contrats</h1>
          <p className="text-sm text-muted-foreground mt-1">Retrouvez vos pièces par dossier immobilier</p>
        </div>

        {/* Filtre par dossier */}
        <div className="flex items-center gap-2 px-4 py-2 bg-ghost rounded-xl border border-border/40 min-w-[240px]">
          <Building2 size={16} className="text-muted-foreground" />
          <select 
            className="bg-transparent text-xs font-bold focus:outline-none w-full"
            value={dealFilter}
            onChange={(e) => setDealFilter(e.target.value)}
          >
            <option value="ALL">Tous mes dossiers ({deals.length})</option>
            {deals.map(deal => (
              <option key={deal.idDeal} value={deal.idDeal}>{getDealTitle(deal)}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-12">
        {filteredDeals.map((deal) => {
          const dealDocs = getDocumentsForDeal(deal.idDeal);
          const dealContracts = getContractsForDeal(deal.idDeal);
          const dealTitle = getDealTitle(deal);
          
          if (dealDocs.length === 0 && dealContracts.length === 0 && dealFilter !== "ALL") {
            return (
              <div key={deal.idDeal} className="py-20 text-center neu-inset rounded-3xl">
                <FileText size={48} className="mx-auto text-muted-foreground mb-4 opacity-20" />
                <h3 className="text-lg font-bold text-eerie">Aucun document pour ce dossier</h3>
              </div>
            );
          }

          if (dealDocs.length === 0 && dealContracts.length === 0) return null;

          return (
            <div key={deal.idDeal} className="space-y-6">
              <div className="flex items-center gap-3 px-2">
                <div className="w-10 h-10 rounded-xl bg-vanilla/10 flex items-center justify-center text-vanilla">
                  <Building2 size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-black text-eerie uppercase tracking-tight">{dealTitle}</h2>
                  <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">
                    {deal.clientType === 'BUYER' ? 'Achat' : 'Vente'} · {deal.city || 'Lieu non spécifié'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* Contrats du dossier */}
                <NeuCard className="p-6 space-y-6">
                  <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground/50 flex items-center gap-2">
                    <FileSignature size={14} className="text-vanilla" /> Mes Contrats ({dealContracts.length})
                  </h3>
                  <div className="space-y-3">
                    {dealContracts.map((c) => (
                      <div key={c.idContract} className="p-4 rounded-2xl bg-alice/30 border border-border/20 flex items-center justify-between group hover:bg-white transition-all">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm text-eerie">
                            <FileSignature size={18} />
                          </div>
                          <div>
                            <p className="text-sm font-black text-eerie">Contrat de {deal.clientType === 'BUYER' ? 'Vente' : 'Mandat'}</p>
                            <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">
                              Émis le {c.createdAt ? format(new Date(c.createdAt), "d MMM yyyy", { locale: fr }) : "Date inconnue"}
                            </p>
                          </div>
                        </div>
                        <SoftBadge tone={c.status === 'RECEIVED_SIGNED' ? 'success' : 'info'} className="text-[8px] font-black tracking-widest">
                          {c.status === 'RECEIVED_SIGNED' ? 'SIGNÉ' : 'EN ATTENTE'}
                        </SoftBadge>
                      </div>
                    ))}
                    {dealContracts.length === 0 && (
                      <p className="text-xs text-muted-foreground italic text-center py-4">Aucun contrat pour le moment.</p>
                    )}
                  </div>
                </NeuCard>

                {/* Documents du dossier */}
                <NeuCard className="p-6 space-y-6">
                  <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground/50 flex items-center gap-2">
                    <FileText size={14} className="text-vanilla" /> Pièces Administratives ({dealDocs.length})
                  </h3>
                  <div className="space-y-3">
                    {dealDocs.map((doc) => (
                      <div key={doc.idDocument} className="p-4 rounded-2xl bg-alice/30 border border-border/20 flex items-center justify-between group hover:bg-white transition-all">
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center shadow-sm",
                            doc.filePath ? "bg-vanilla/10 text-vanilla" : "bg-ghost text-muted-foreground/30"
                          )}>
                            <FileText size={18} />
                          </div>
                          <div>
                            <p className="text-sm font-black text-eerie uppercase tracking-tight">{doc.documentType.replace(/_/g, ' ')}</p>
                            <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">
                              {doc.filePath ? `Ajouté le ${doc.createdAt ? format(new Date(doc.createdAt), "d MMM yyyy", { locale: fr }) : "Date inconnue"}` : "Action requise"}
                            </p>
                          </div>
                        </div>
                        <SoftBadge tone={doc.filePath ? "success" : "warn"} className="text-[8px] font-black tracking-widest">
                          {doc.filePath ? 'COMPLÉTÉ' : 'À FOURNIR'}
                        </SoftBadge>
                      </div>
                    ))}
                    {dealDocs.length === 0 && (
                      <p className="text-xs text-muted-foreground italic text-center py-4">Aucun document administratif.</p>
                    )}
                  </div>
                </NeuCard>
              </div>
            </div>
          );
        })}

        {deals.length === 0 && (
          <div className="py-24 text-center bg-alice/10 rounded-[40px] border border-dashed border-border/40">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm mb-6">
              <FileText className="text-muted-foreground/20" size={32} />
            </div>
            <h3 className="text-xl font-black text-eerie uppercase tracking-widest">Aucun document</h3>
            <p className="text-sm font-bold text-muted-foreground/60 mt-2">Dès qu'un dossier sera ouvert, vos documents apparaîtront ici.</p>
          </div>
        )}
      </div>
    </div>
  );
}
