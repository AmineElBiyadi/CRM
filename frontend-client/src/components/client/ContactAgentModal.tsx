import { useState } from "react";
import { useClientData } from "@/hooks/use-client-data";
import { cn } from "@/lib/utils";
import { X, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

const API_BASE_URL = "http://localhost:8081/api/public/client-portal";
const CLIENT_ID = "d755eba6-106f-4f81-af56-4e4d60f16840";

interface Props {
  agentName: string;
  onClose: () => void;
}

export function ContactAgentModal({ agentName, onClose }: Props) {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const MAX = 1000;
  const agentFirstName = agentName.split(" ")[0];

  const handleSend = async () => {
    if (!message.trim() || loading) return;
    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/${CLIENT_ID}/message`, { content: message });
      toast.success(`Message envoyé à ${agentFirstName}`);
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
      <div className="relative bg-ghost rounded-3xl shadow-2xl max-w-lg w-full p-8 animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-9 h-9 rounded-xl neu-sm flex items-center justify-center hover:neu-pressable"
        >
          <X size={16} />
        </button>

        <h2 className="text-xl font-bold mb-1">Écrire à {agentFirstName}</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Votre message sera transmis directement à votre agent.
        </p>

        <div className="relative">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value.slice(0, MAX))}
            placeholder="Écrivez votre message..."
            rows={5}
            className="w-full p-4 rounded-2xl neu-inset bg-transparent text-sm resize-none focus:outline-none"
          />
          <span className={cn(
            "absolute bottom-3 right-4 text-[10px] font-medium",
            message.length > MAX * 0.9 ? "text-destructive" : "text-muted-foreground"
          )}>
            {message.length}/{MAX}
          </span>
        </div>

        <button
          onClick={handleSend}
          disabled={!message.trim() || loading}
          className="mt-4 w-full py-3 rounded-2xl bg-eerie text-ghost font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-40 transition-all"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          Envoyer
        </button>
      </div>
    </div>
  );
}
