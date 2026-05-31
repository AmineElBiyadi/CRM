import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { NeuCard } from "@/components/ui/neu-card";
import { SoftBadge } from "@/components/ui/design-bits";
import { 
  Calendar, Clock, MapPin, Phone, Building, PenLine, Video, 
  Loader2, Filter, ArrowUpDown, ChevronRight, AlertCircle,
  CheckCircle2, XCircle, Clock4, History
} from "lucide-react";
import { useClientData, useMeetingActions } from "@/hooks/use-client-data";
import { format, isAfter, isBefore, startOfToday } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { Meeting } from "@/hooks/use-client-data";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/client/rendez-vous")({
  component: ClientMeetings,
});

const MEETING_TYPE_MAP: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  PROPERTY_VISIT:      { label: "Visite de propriété",       icon: <MapPin size={16} />,     color: "text-blue-600 bg-blue-50" },
  PHONE_CALL:          { label: "Appel téléphonique",         icon: <Phone size={16} />,      color: "text-purple-600 bg-purple-50" },
  OFFICE_APPOINTMENT:  { label: "Rendez-vous en agence",      icon: <Building size={16} />,   color: "text-amber-600 bg-amber-50" },
  CONTRACT_SIGNING:    { label: "Signature de contrat",       icon: <PenLine size={16} />,    color: "text-emerald-600 bg-emerald-50" },
};

const STATUS_CONFIG: Record<string, { label: string; tone: "success" | "info" | "warn" | "danger" | "neutral"; icon: any }> = {
  SCHEDULED:   { label: "Confirmé",    tone: "success", icon: CheckCircle2 },
  PENDING:     { label: "En attente",  tone: "info",    icon: Clock4 },
  RESCHEDULED: { label: "Reprogrammé", tone: "warn",    icon: Clock },
  POSTPONED:   { label: "Reporté",     tone: "warn",    icon: AlertCircle },
  CANCELED:    { label: "Annulé",      tone: "danger",  icon: XCircle },
  COMPLETED:   { label: "Terminé",     tone: "success", icon: CheckCircle2 },
};

function typeLabel(type: string) {
  return MEETING_TYPE_MAP[type]?.label ?? type.replace(/_/g, " ");
}
function typeIcon(type: string) {
  return MEETING_TYPE_MAP[type]?.icon ?? <Video size={16} />;
}
function typeColor(type: string) {
  return MEETING_TYPE_MAP[type]?.color ?? "text-muted-foreground bg-ghost";
}

function ClientMeetings() {
  const { data, isLoading } = useClientData();
  const { accept, reschedule, cancel } = useMeetingActions();
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [actionType, setActionType] = useState<"reschedule" | "cancel" | null>(null);
  const [reason, setReason] = useState("");
  const [newDate, setNewDate] = useState("");
  
  // Filtres
  const [dealFilter, setDealFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [periodFilter, setPeriodFilter] = useState("ALL"); // ALL, UPCOMING, PAST, REMINDERS
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");

  const meetings = data?.meetings || [];
  const deals = data?.dossiers || [];

  const reminderMeetings = useMemo(() => {
    // ... (keep existing reminderMeetings logic)
    const now = new Date();
    return meetings.filter(m => {
      const scheduledDate = new Date(m.scheduledAt);
      const diffMs = scheduledDate.getTime() - now.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);

      // Un rappel est considéré "à venir" si :
      // 1. Le RDV est CONFIRMÉ (SCHEDULED)
      // 2. Le rappel 24h n'est pas envoyé ET on est à moins de 24h du RDV
      // OU
      // 3. Le rappel 1h n'est pas envoyé ET on est à moins de 1h du RDV
      const isReminder24hDue = m.status === "SCHEDULED" && !m.reminder24hSent && diffHours <= 24 && diffHours > 0;
      const isReminder1hDue = m.status === "SCHEDULED" && !m.reminder1hSent && diffHours <= 1 && diffHours > 0;

      return isReminder24hDue || isReminder1hDue;
    });
  }, [meetings]);

  const filteredMeetings = useMemo(() => {
    // Exclure les statuts MISSED et DRAFT par défaut
    let result = meetings.filter(m => m.status !== "MISSED" && m.status !== "DRAFT");
    const today = startOfToday();

    // Filtre par dossier
    if (dealFilter !== "ALL") {
      result = result.filter(m => m.idDeal === dealFilter);
    }

    // Filtre par type
    if (typeFilter !== "ALL") {
      result = result.filter(m => m.type === typeFilter);
    }

    // Filtre par période
    if (periodFilter === "UPCOMING") {
      result = result.filter(m => isAfter(new Date(m.scheduledAt), today));
    } else if (periodFilter === "PAST") {
      result = result.filter(m => isBefore(new Date(m.scheduledAt), today));
    } else if (periodFilter === "REMINDERS") {
      result = result.filter(m => 
        isAfter(new Date(m.scheduledAt), new Date()) && 
        (!m.reminder1hSent || !m.reminder24hSent)
      );
    }

    // Tri
    result.sort((a, b) => {
      const dateA = new Date(a.scheduledAt).getTime();
      const dateB = new Date(b.scheduledAt).getTime();
      return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [meetings, typeFilter, periodFilter, sortOrder]);

  const handleAccept = async () => {
    if (!selectedMeeting) return;
    try {
      await accept.mutateAsync(selectedMeeting.idMeeting);
      toast.success("Rendez-vous accepté");
      setShowConfirmModal(false);
      setSelectedMeeting(null);
    } catch (e) {
      toast.error("Erreur lors de l'acceptation");
    }
  };

  const handleReschedule = async () => {
    if (!reason || !newDate) return;
    try {
      await reschedule.mutateAsync({ meetingId: selectedMeeting!.idMeeting, newDate, reason });
      toast.success("Demande de report envoyée");
      setActionType(null);
      setSelectedMeeting(null);
      setReason("");
      setNewDate("");
    } catch (e) {
      toast.error("Erreur lors du report");
    }
  };

  const handleCancel = async () => {
    if (!reason) return;
    try {
      await cancel.mutateAsync({ meetingId: selectedMeeting!.idMeeting, reason });
      toast.success("Rendez-vous annulé");
      setActionType(null);
      setSelectedMeeting(null);
      setReason("");
    } catch (e) {
      toast.error("Erreur lors de l'annulation");
    }
  };

  const getDealTitle = (deal: any) => {
    if (deal.propertyTitle) return deal.propertyTitle;
    const type = deal.clientType === "BUYER" ? "Achat" : "Vente";
    return `${type} — ${deal.city || 'Dossier'}`;
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center p-12">
        <Loader2 className="animate-spin text-vanilla" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-full pb-12">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">Mes rendez-vous</h1>
        <p className="text-muted-foreground font-medium">Suivez et gérez vos visites et points de situation.</p>
      </div>

      {/* Section Rappels à venir */}
      {reminderMeetings.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Clock4 className="text-vanilla" size={18} />
            <h2 className="text-sm font-black uppercase tracking-widest text-eerie">Rappels à venir</h2>
            <SoftBadge tone="warn" className="ml-2 font-bold">{reminderMeetings.length}</SoftBadge>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {reminderMeetings.map((m) => (
              <NeuCard 
                key={`reminder-${m.idMeeting}`}
                onClick={() => setSelectedMeeting(m)}
                className="p-4 cursor-pointer hover:neu-pressable bg-alice/20 border-l-4 border-l-vanilla"
              >
                <div className="flex justify-between items-start gap-3">
                  <div className="space-y-1">
                    <p className={cn("text-[10px] font-black uppercase tracking-widest", typeColor(m.type).split(' ')[0])}>
                      {typeLabel(m.type)}
                    </p>
                    <p className="text-sm font-bold text-eerie">
                      {format(new Date(m.scheduledAt), "d MMMM · HH:mm", { locale: fr })}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1 items-end">
                    {(() => {
                      const diffHours = (new Date(m.scheduledAt).getTime() - new Date().getTime()) / (1000 * 60 * 60);
                      if (!m.reminder1hSent && diffHours <= 1 && diffHours > 0) {
                        return <SoftBadge tone="danger" className="text-[9px] px-2 py-1 font-black animate-pulse">MOINS D'UNE HEURE</SoftBadge>;
                      }
                      if (!m.reminder24hSent && diffHours <= 24 && diffHours > 0) {
                        return <SoftBadge tone="warn" className="text-[9px] px-2 py-1 font-black">MOINS DE 24 HEURES</SoftBadge>;
                      }
                      return null;
                    })()}
                  </div>
                </div>
              </NeuCard>
            ))}
          </div>
        </div>
      )}

      {/* Barre de Filtres */}
      <div className="flex flex-wrap items-center gap-4 p-4 neu-inset rounded-2xl">
        <div className="flex items-center gap-2 px-3 py-2 bg-ghost rounded-xl border border-border/40 min-w-[200px]">
          <Building size={14} className="text-muted-foreground" />
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

        <div className="flex items-center gap-2 px-3 py-2 bg-ghost rounded-xl border border-border/40">
          <Filter size={14} className="text-muted-foreground" />
          <select 
            className="bg-transparent text-xs font-bold focus:outline-none"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="ALL">Tous les types</option>
            {Object.entries(MEETING_TYPE_MAP).map(([val, { label }]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 px-3 py-2 bg-ghost rounded-xl border border-border/40">
          <Calendar size={14} className="text-muted-foreground" />
          <select 
            className="bg-transparent text-xs font-bold focus:outline-none"
            value={periodFilter}
            onChange={(e) => setPeriodFilter(e.target.value)}
          >
            <option value="ALL">Toute période</option>
            <option value="UPCOMING">À venir</option>
            <option value="PAST">Passés</option>
            <option value="REMINDERS">Rappels à venir</option>
          </select>
        </div>

        <button 
          onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
          className="flex items-center gap-2 px-4 py-2 bg-ghost rounded-xl border border-border/40 text-xs font-bold hover:bg-alice/40 transition-colors"
        >
          <ArrowUpDown size={14} className="text-muted-foreground" />
          {sortOrder === "desc" ? "Plus récent → Plus loin" : "Plus loin → Plus récent"}
        </button>
      </div>

      {/* Liste des Rendez-vous */}
      <div className="grid gap-4">
        {filteredMeetings.map((m) => {
          const status = STATUS_CONFIG[m.status] || { label: m.status, tone: "info", icon: Clock4 };
          const StatusIcon = status.icon;
          
          return (
            <NeuCard 
              key={m.idMeeting} 
              onClick={() => setSelectedMeeting(m)}
              className="group cursor-pointer hover:neu-pressable transition-all flex flex-col md:flex-row gap-6 p-6"
            >
              <div className="md:w-40 shrink-0 flex flex-col items-center justify-center p-4 bg-alice/30 rounded-2xl text-center group-hover:bg-vanilla/10 transition-colors">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                  {format(new Date(m.scheduledAt), "EEEE", { locale: fr })}
                </span>
                <span className="text-3xl font-black text-eerie my-1">
                  {format(new Date(m.scheduledAt), "d", { locale: fr })}
                </span>
                <span className="text-xs font-bold text-muted-foreground">
                  {format(new Date(m.scheduledAt), "MMMM yyyy", { locale: fr })}
                </span>
              </div>

              <div className="flex-1 flex flex-col justify-between py-1">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className={cn("p-1.5 rounded-lg shadow-inner", typeColor(m.type))}>
                        {typeIcon(m.type)}
                      </div>
                      <span className={cn("text-[10px] font-black uppercase tracking-widest", typeColor(m.type).split(' ')[0])}>
                        {typeLabel(m.type)}
                      </span>
                      {dealFilter === "ALL" && (
                        <>
                          <div className="h-3 w-[1px] bg-border mx-1" />
                          <span className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest bg-alice px-1.5 py-0.5 rounded">
                            {(() => {
                              const deal = deals.find(d => d.idDeal === m.idDeal);
                              return deal ? getDealTitle(deal) : "Dossier";
                            })()}
                          </span>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-xl font-black text-eerie">
                        {format(new Date(m.scheduledAt), "HH:mm", { locale: fr })}
                      </h3>
                      <div className="h-4 w-[1px] bg-border" />
                      <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
                        <MapPin size={12} /> {m.propertyAddress || "Lieu à confirmer"}
                      </div>
                    </div>
                  </div>
                  <SoftBadge tone={status.tone as any} className="px-4 py-1.5 flex items-center gap-2 font-bold uppercase tracking-wider text-[10px]">
                    <StatusIcon size={12} /> {status.label}
                  </SoftBadge>
                </div>

                {m.notesLogged && (
                  <p className="mt-4 text-xs text-muted-foreground/80 font-medium italic line-clamp-1 bg-ghost/40 p-2 rounded-lg">
                    "{m.notesLogged}"
                  </p>
                )}
              </div>
              
              <div className="flex items-center justify-center px-2">
                <ChevronRight size={20} className="text-muted-foreground/30 group-hover:text-vanilla transition-colors" />
              </div>
            </NeuCard>
          );
        })}

        {filteredMeetings.length === 0 && (
          <div className="py-20 text-center neu-inset rounded-3xl">
            <Calendar size={48} className="mx-auto text-muted-foreground mb-4 opacity-20" />
            <h3 className="text-lg font-bold text-eerie">Aucun rendez-vous trouvé</h3>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto mt-2">
              Modifiez vos filtres ou contactez votre agent pour planifier une rencontre.
            </p>
          </div>
        )}
      </div>

      {/* Modal Détail */}
      <Dialog open={!!selectedMeeting} onOpenChange={(open) => !open && setSelectedMeeting(null)}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-3xl border-none shadow-2xl">
          <DialogHeader className="sr-only">
            <DialogTitle>Détails du rendez-vous</DialogTitle>
            <DialogDescription>Informations complètes sur votre rendez-vous et actions possibles.</DialogDescription>
          </DialogHeader>
          {selectedMeeting && (
            <div className="flex flex-col">
              <div className="bg-eerie p-8 text-white relative">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                  <Calendar size={120} />
                </div>
                <div className="flex items-center gap-3 mb-4">
                  <SoftBadge tone="info" className="bg-white/10 text-white border-white/20 px-3 font-black tracking-widest text-[10px]">
                    {selectedMeeting.status}
                  </SoftBadge>
                </div>
                <h2 className="text-3xl font-black mb-2">{typeLabel(selectedMeeting.type)}</h2>
                <div className="flex flex-wrap items-center gap-6 mt-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="text-vanilla" size={18} />
                    <span className="font-bold">{format(new Date(selectedMeeting.scheduledAt), "d MMMM yyyy", { locale: fr })}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="text-vanilla" size={18} />
                    <span className="font-bold">{format(new Date(selectedMeeting.scheduledAt), "HH:mm", { locale: fr })}</span>
                  </div>
                </div>
              </div>

              <div className="p-8 space-y-8 bg-ghost">
                <div className="grid sm:grid-cols-2 gap-8">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Adresse du bien</span>
                    <div className="flex items-start gap-3 mt-2">
                      <div className="p-2 rounded-xl neu-inset shrink-0">
                        <MapPin size={18} className="text-eerie" />
                      </div>
                      <p className="text-sm font-bold text-eerie mt-1">
                        {selectedMeeting.propertyAddress || "Non spécifiée"}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">État des rappels</span>
                    <div className="flex flex-col gap-3 mt-2">
                      <div className="flex items-center gap-3">
                        <div className={cn("w-2 h-2 rounded-full", selectedMeeting.reminder24hSent ? "bg-success" : "bg-muted")} />
                        <span className="text-xs font-bold text-eerie">Rappel 24h {selectedMeeting.reminder24hSent ? "envoyé" : "en attente"}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className={cn("w-2 h-2 rounded-full", selectedMeeting.reminder1hSent ? "bg-success" : "bg-muted")} />
                        <span className="text-xs font-bold text-eerie">Rappel 1h {selectedMeeting.reminder1hSent ? "envoyé" : "en attente"}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {selectedMeeting.notesLogged && (
                  <div className="space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Notes de l'agent</span>
                    <div className="p-4 neu-inset rounded-2xl bg-white/40">
                      <p className="text-xs text-muted-foreground leading-relaxed italic font-medium">
                        "{selectedMeeting.notesLogged}"
                      </p>
                    </div>
                  </div>
                )}

                {/* Actions */}
                {!actionType ? (
                  <div className="pt-4 flex flex-col gap-6 border-t border-border/40">
                    <div className="flex flex-wrap gap-4">
                      {(selectedMeeting.status === "PENDING" || selectedMeeting.status === "RESCHEDULED") && (
                        <button 
                          onClick={() => setShowConfirmModal(true)}
                          className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-eerie text-white rounded-2xl font-black text-xs tracking-widest shadow-xl hover:bg-eerie/90 transition-all active:scale-95 border-2 border-vanilla/20"
                        >
                          <CheckCircle2 size={16} className="text-vanilla" /> ACCEPTER LE RENDEZ-VOUS
                        </button>
                      )}
                    </div>

                    {selectedMeeting.status !== "CANCELED" && selectedMeeting.status !== "COMPLETED" && (
                      <div className="p-5 rounded-2xl bg-white border-2 border-vanilla/30 flex items-start gap-4 shadow-sm">
                        <div className="p-2 bg-vanilla/10 rounded-xl">
                          <AlertCircle className="text-vanilla shrink-0" size={20} />
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-black text-eerie uppercase tracking-tight">
                            Besoin de modifier ce rendez-vous ?
                          </p>
                          <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                            Pour toute reprogrammation ou annulation, contactez directement votre agent 
                            <span className="text-eerie font-bold mx-1 bg-vanilla/10 px-1.5 py-0.5 rounded">
                              {data?.profile.assignedAgentName}
                            </span> 
                            {data?.profile.assignedAgentPhone && (
                              <span className="text-eerie font-bold">
                                ({data.profile.assignedAgentPhone})
                              </span>
                            )}.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-6 pt-6 border-t border-border/40 animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-black text-eerie uppercase tracking-widest">
                        {actionType === "reschedule" ? "Reprogrammer le rendez-vous" : "Annuler le rendez-vous"}
                      </h3>
                      <button onClick={() => setActionType(null)} className="text-[10px] font-black text-muted-foreground hover:text-eerie underline">
                        RETOUR
                      </button>
                    </div>

                    <div className="space-y-4">
                      {actionType === "reschedule" && (
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Nouvelle date et heure</label>
                          <input 
                            type="datetime-local" 
                            className="w-full p-4 rounded-xl neu-inset bg-transparent text-sm font-bold focus:outline-none"
                            value={newDate}
                            onChange={(e) => setNewDate(e.target.value)}
                          />
                        </div>
                      )}
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Motif (obligatoire)</label>
                        <textarea 
                          className="w-full p-4 rounded-xl neu-inset bg-transparent text-sm font-bold focus:outline-none min-h-[100px]"
                          placeholder="Veuillez saisir la raison..."
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                        />
                      </div>
                      <button 
                        onClick={actionType === "reschedule" ? handleReschedule : handleCancel}
                        disabled={!reason || (actionType === "reschedule" && !newDate)}
                        className={cn(
                          "w-full py-4 rounded-2xl font-black text-xs tracking-widest shadow-lg transition-all active:scale-95 disabled:opacity-50",
                          actionType === "reschedule" ? "bg-eerie text-white" : "bg-destructive text-white"
                        )}
                      >
                        CONFIRMER {actionType === "reschedule" ? "LE REPORT" : "L'ANNULATION"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmation d'Acceptation */}
      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent className="max-w-md p-8 rounded-3xl border-none shadow-2xl text-center">
          <DialogHeader className="sr-only">
            <DialogTitle>Confirmer le rendez-vous</DialogTitle>
            <DialogDescription>Êtes-vous sûr de vouloir accepter ce rendez-vous ?</DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col items-center gap-6 py-4">
            <div className="w-20 h-20 bg-vanilla/10 rounded-full flex items-center justify-center">
              <Calendar size={40} className="text-vanilla" />
            </div>
            
            <div className="space-y-3">
              <h2 className="text-2xl font-black text-eerie">Confirmer la date ?</h2>
              <p className="text-muted-foreground font-medium leading-relaxed">
                Êtes-vous sûr de vouloir accepter ce rendez-vous pour le :
              </p>
              {selectedMeeting && (
                <div className="p-4 bg-alice/30 rounded-2xl border border-border/40">
                  <p className="text-sm font-black text-eerie uppercase tracking-tight">
                    {typeLabel(selectedMeeting.type)}
                  </p>
                  <p className="text-lg font-black text-eerie mt-1">
                    {format(new Date(selectedMeeting.scheduledAt), "EEEE d MMMM · HH:mm", { locale: fr })}
                  </p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 w-full pt-2">
              <button 
                onClick={() => setShowConfirmModal(false)}
                className="py-4 bg-white border border-border/40 text-muted-foreground rounded-2xl font-black text-xs tracking-widest hover:bg-alice/20 transition-all active:scale-95"
              >
                ANNULER
              </button>
              <button 
                onClick={handleAccept}
                disabled={accept.isPending}
                className="py-4 bg-eerie text-white rounded-2xl font-black text-xs tracking-widest shadow-lg hover:bg-eerie/90 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                {accept.isPending ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} className="text-vanilla" />}
                CONFIRMER
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
