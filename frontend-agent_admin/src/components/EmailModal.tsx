import React, { useState, useEffect } from 'react';
import { X, Send, Loader2, Mail, User, Type, Sparkles, RefreshCw } from 'lucide-react';
import { NeuCard } from './ui/neu-card';
import { toast } from 'sonner';
import apiClient from '@/lib/api-client';

interface EmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  dealId: string;
  clientEmail: string;
  clientName: string;
  agentEmail: string;
  initialSubject?: string;
  initialBody?: string;
  onSuccess?: () => void;
}

export function EmailModal({
  isOpen,
  onClose,
  dealId,
  clientEmail,
  clientName,
  agentEmail,
  initialSubject = '',
  initialBody = '',
  onSuccess
}: EmailModalProps) {
  const [subject, setSubject] = useState(initialSubject);
  const [body, setBody] = useState(initialBody);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // IA Generation states
  const [isGenerating, setIsReadOnly] = useState(false); // Using for UI state
  const [isTyping, setIsTyping] = useState(false);
  const [aiGenerated, setAiGenerated] = useState(false);

  if (!isOpen) return null;

  const handleGenerateAI = async () => {
    // Confirmation si du texte existe déjà
    if ((subject.trim() && subject !== initialSubject) || (body.trim() && body !== initialBody)) {
      if (!confirm("Voulez-vous écraser votre message actuel avec une suggestion de l'IA ?")) {
        return;
      }
    }

    setIsReadOnly(true);
    setError(null);

    try {
      // TODO: Remplacer par le vrai appel API : POST /api/ai/deals/{dealId}/draft-email
      // const response = await apiClient.post(`/api/ai/deals/${dealId}/draft-email`);
      // const { subject: aiSubject, body: aiBody } = response.data;

      // Mock temporaire (1s)
      await new Promise(resolve => setTimeout(resolve, 1000));
      const aiSubject = "Suivi de votre dossier immobilier";
      const aiBody = `Bonjour ${clientName.split(' ')[0]},\n\nJe me permets de vous contacter suite à notre dernière interaction concernant votre projet immobilier. \n\nL'analyse de votre dossier montre une belle progression et je souhaitais m'assurer que vous aviez toutes les informations nécessaires pour la suite.\n\nJe reste à votre entière disposition pour un échange téléphonique.\n\nCordialement,\n${agentEmail}`;

      // Effet Typewriter pour le corps du message
      setSubject(aiSubject);
      setBody("");
      setIsTyping(true);
      
      let currentText = "";
      const fullText = aiBody;
      const speed = 15; // ms par caractère
      
      const typeNextChar = (index: number) => {
        if (index < fullText.length) {
          currentText += fullText[index];
          setBody(currentText);
          setTimeout(() => typeNextChar(index + 1), speed);
        } else {
          setIsTyping(false);
          setIsReadOnly(false);
          setAiGenerated(true);
          toast.success("Suggestion IA générée");
        }
      };

      typeNextChar(0);

    } catch (err: any) {
      console.error("Erreur IA:", err);
      toast.error("Impossible de générer la suggestion IA.");
      setIsReadOnly(false);
    }
  };

  const handleSend = async () => {
    if (!subject.trim() || !body.trim()) {
      setError("L'objet et le message sont requis.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // TODO: Remplacer par le vrai appel API quand le backend sera prêt
      // await apiClient.post('/api/emails/send', {
      //   dealId,
      //   clientEmail,
      //   subject,
      //   body
      // });

      // Mock temporaire (1.5s)
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Journalisation automatique de l'interaction
      await apiClient.post('/api/agent/interactions', {
        idDeal: dealId,
        type: "EMAIL",
        description: `ce email appropos : ${subject}\n\n${body}`,
        occurredAt: new Date().toISOString(),
        durationMinutes: 0
      });

      toast.success("Email envoyé avec succès");
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Erreur lors de l'envoi de l'email:", err);
      setError(err.response?.data?.message || "Une erreur est survenue lors de l'envoi de l'email.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-eerie/40 backdrop-blur-md animate-in fade-in duration-300">
      <div 
        className="relative w-full max-w-2xl animate-in zoom-in-95 duration-300"
        onClick={e => e.stopPropagation()}
      >
        <NeuCard className="relative overflow-hidden border border-white/10 shadow-2xl bg-ghost/90 backdrop-blur-xl p-0">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border bg-alice/10">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-vanilla/20 text-eerie shadow-inner">
                <Mail size={20} />
              </div>
              <div>
                <h2 className="text-xl font-black tracking-tight text-eerie">Nouvel Email</h2>
                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Messagerie intégrée Rawabet</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="w-10 h-10 rounded-full neu-sm flex items-center justify-center hover:bg-alice transition-all active:scale-90"
            >
              <X size={18} />
            </button>
          </div>

          <div className="p-8 space-y-6">
            {error && (
              <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium animate-in slide-in-from-top-2">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Field: To */}
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-1 flex items-center gap-1.5">
                  <User size={12} /> À (Client)
                </label>
                <div className="w-full px-5 py-3 rounded-2xl neu-inset bg-alice/20 text-sm font-medium text-eerie/70 flex items-center gap-2 cursor-not-allowed">
                  <span className="truncate">{clientName} &lt;{clientEmail}&gt;</span>
                </div>
              </div>

              {/* Field: CC */}
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-1 flex items-center gap-1.5">
                  <User size={12} /> CC (Vous)
                </label>
                <div className="w-full px-5 py-3 rounded-2xl neu-inset bg-alice/20 text-sm font-medium text-eerie/70 flex items-center gap-2 cursor-not-allowed">
                  <span className="truncate">{agentEmail}</span>
                </div>
              </div>
            </div>

            {/* Field: Subject */}
            <div className="space-y-2">
              <label htmlFor="email-subject" className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-1 flex items-center gap-1.5">
                <Type size={12} /> Objet
              </label>
              <input 
                id="email-subject"
                type="text"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder="Objet de votre message..."
                className="w-full px-5 py-4 rounded-2xl neu-inset bg-transparent text-sm font-bold focus:outline-none focus:ring-2 focus:ring-vanilla/30 transition-all placeholder:text-muted-foreground/40"
              />
            </div>

            {/* Field: Message */}
            <div className="space-y-2">
              <div className="flex items-center justify-between ml-1">
                <label htmlFor="email-body" className="text-[10px] uppercase font-black tracking-widest text-muted-foreground flex items-center gap-1.5">
                  <Mail size={12} /> Message
                </label>
                
                <button 
                  type="button"
                  onClick={handleGenerateAI}
                  disabled={isGenerating || isTyping}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                    aiGenerated 
                      ? "bg-honeydew text-eerie hover:opacity-80" 
                      : "bg-vanilla/20 text-eerie/60 hover:bg-vanilla hover:text-eerie shadow-sm"
                  } disabled:opacity-50`}
                >
                  {isTyping ? (
                    <><Loader2 size={12} className="animate-spin" /> IA en train d'écrire...</>
                  ) : isGenerating ? (
                    <><RefreshCw size={12} className="animate-spin" /> Analyse IA...</>
                  ) : aiGenerated ? (
                    <><RefreshCw size={12} /> Regénérer</>
                  ) : (
                    <><Sparkles size={12} /> Générer avec l'IA</>
                  )}
                </button>
              </div>
              <textarea 
                id="email-body"
                value={body}
                onChange={e => setBody(e.target.value)}
                rows={8}
                readOnly={isTyping}
                placeholder="Rédigez votre message ici..."
                className={`w-full px-6 py-5 rounded-[2rem] neu-inset bg-transparent text-sm font-medium leading-relaxed focus:outline-none focus:ring-2 focus:ring-vanilla/30 transition-all placeholder:text-muted-foreground/40 soft-scroll ${isTyping ? "opacity-80" : ""}`}
              />
            </div>

            {/* Footer Actions */}
            <div className="flex gap-4 pt-4">
              <button 
                onClick={handleSend}
                disabled={loading}
                className="flex-[2] py-4 rounded-2xl bg-eerie text-ghost font-black uppercase tracking-widest text-xs shadow-lg hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {loading ? (
                  <><Loader2 size={18} className="animate-spin" /> Envoi en cours...</>
                ) : (
                  <><Send size={18} /> Envoyer l'email</>
                )}
              </button>
              <button 
                onClick={onClose}
                disabled={loading}
                className="flex-1 py-4 rounded-2xl neu-sm text-eerie/60 font-black uppercase tracking-widest text-xs hover:text-eerie hover:bg-alice/50 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                Annuler
              </button>
            </div>
          </div>
        </NeuCard>
      </div>
    </div>
  );
}
