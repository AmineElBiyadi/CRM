import { useState } from "react";
import { X, CalendarPlus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import { format } from "date-fns";

const API_BASE_URL = "http://localhost:8081/api/public/client-portal";
const CLIENT_ID = "d755eba6-106f-4f81-af56-4e4d60f16840";

const MEETING_TYPES = [
  { value: "PROPERTY_VISIT", label: "Visite de propriété" },
  { value: "PHONE_CALL", label: "Appel téléphonique" },
  { value: "OFFICE_APPOINTMENT", label: "Rendez-vous en agence" },
];

interface Props {
  onClose: () => void;
}

export function MeetingRequestModal({ onClose }: Props) {
  const today = format(new Date(), "yyyy-MM-dd");
  const [type, setType] = useState("PROPERTY_VISIT");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !time) return;
    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/${CLIENT_ID}/meetings/request`, {
        type,
        preferredDate: date,
        preferredTime: time,
        message,
      });
      toast.success("Demande envoyée à votre agent.");
      onClose();
    } catch {
      toast.error("Une erreur est survenue. Réessayez.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-eerie/50 backdrop-blur-sm" onClick={onClose} />
      <form
        onSubmit={handleSubmit}
        className="relative bg-ghost rounded-3xl shadow-2xl max-w-lg w-full p-8 animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 w-9 h-9 rounded-xl neu-sm flex items-center justify-center hover:neu-pressable"
        >
          <X size={16} />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-2xl bg-vanilla flex items-center justify-center neu-sm">
            <CalendarPlus size={20} />
          </div>
          <div>
            <h2 className="text-xl font-bold">Demander un rendez-vous</h2>
            <p className="text-xs text-muted-foreground">Votre agent confirmera dans les 24h.</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-eerie/70">Type de rendez-vous</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full p-3 rounded-xl neu-inset bg-transparent text-sm focus:outline-none"
            >
              {MEETING_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-eerie/70">Date souhaitée</label>
              <input
                type="date"
                min={today}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full p-3 rounded-xl neu-inset bg-transparent text-sm focus:outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-eerie/70">Heure souhaitée</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
                className="w-full p-3 rounded-xl neu-inset bg-transparent text-sm focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-eerie/70">Message (optionnel)</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Précisez vos disponibilités ou besoins..."
              rows={3}
              className="w-full p-3 rounded-xl neu-inset bg-transparent text-sm resize-none focus:outline-none"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={!date || !time || loading}
          className="mt-6 w-full py-3 rounded-2xl bg-eerie text-ghost font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-40 transition-all"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : <CalendarPlus size={18} />}
          Envoyer la demande
        </button>
      </form>
    </div>
  );
}
