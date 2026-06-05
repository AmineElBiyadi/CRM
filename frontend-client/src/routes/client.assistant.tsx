import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { Sparkles, ArrowUp, FileText, Loader2, Square } from "lucide-react";
import { useClientData } from "@/hooks/use-client-data";
import { ragApi } from "@/api/ragApi";
import ReactMarkdown from 'react-markdown';

export const Route = createFileRoute("/client/assistant")({
  component: ClientAssistant,
});

interface Msg { 
  role: "user" | "ai"; 
  text: string; 
  sources?: string[];
}

const suggestions = [
  "Quels documents manquent ?",
  "Que se passe-t-il après la signature ?",
  "Mon dossier avance-t-il bien ?",
  "Quand est mon prochain RDV ?",
];

function ClientAssistant() {
  const { data } = useClientData();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (data?.profile && messages.length === 0) {
      setMessages([
        { role: "ai", text: `Bonjour M. ${data.profile.lastName} ! Je suis MURSHID, votre assistant SmartEstate expert. Posez-moi toutes vos questions sur vos dossiers, vos rendez-vous ou vos documents.` },
      ]);
    }
  }, [data, messages.length]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
      setMessages((m) => [...m, { role: "ai", text: "Génération interrompue." }]);
    }
  };

  const send = async (text: string) => {
    if (!text.trim() || isLoading) return;
    
    const userMsg: Msg = { role: "user", text };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setIsLoading(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const history = messages.map(m => ({ 
        role: m.role === "ai" ? "assistant" : "user", 
        content: m.text 
      }));
      
      const response = await ragApi.askGlobalQuestion(text, history);
      if (controller.signal.aborted) return;

      const aiMsg: Msg = { 
        role: "ai", 
        text: response.answer,
        sources: response.sources 
      };
      setMessages((m) => [...m, aiMsg]);
    } catch (error: any) {
      if (error.name === 'AbortError') return;
      console.error("AI Assistant Error:", error);
      setMessages((m) => [...m, { 
        role: "ai", 
        text: "Désolé, je rencontre une difficulté technique pour accéder à vos informations. Veuillez réessayer plus tard." 
      }]);
    } finally {
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-12rem)] flex flex-col">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 rounded-2xl bg-vanilla flex items-center justify-center shadow-lg shadow-vanilla/20">
          <Sparkles size={24} className="text-eerie" />
        </div>
        <div>
          <h1 className="text-3xl font-black tracking-tight text-eerie uppercase tracking-[0.2em]">MURSHID</h1>
          <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest opacity-60">Votre expert IA personnel</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto soft-scroll space-y-6 pb-6 pr-2">
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-4 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            {m.role === "ai" && (
              <div className="w-10 h-10 rounded-2xl bg-white border border-border flex items-center justify-center shrink-0 shadow-sm">
                <Sparkles size={16} className="text-vanilla" />
              </div>
            )}
            <div className={`max-w-[85%] lg:max-w-[70%] p-5 shadow-sm ${
              m.role === "user" 
                ? "bg-vanilla text-eerie rounded-3xl rounded-tr-sm font-medium" 
                : "bg-white border border-border/60 text-eerie rounded-3xl rounded-tl-sm"
            }`}>
              <div className="text-sm leading-relaxed markdown-content">
                <ReactMarkdown>{m.text}</ReactMarkdown>
              </div>
              
              {m.sources && m.sources.length > 0 && (
                <div className="mt-4 pt-4 border-t border-ghost flex flex-wrap gap-2">
                  <span className="text-[9px] font-black uppercase text-muted-foreground/40 w-full mb-1 tracking-widest">Contexte analysé :</span>
                  {m.sources.map((s, idx) => (
                    <span key={idx} className="text-[9px] bg-ghost text-eerie/60 px-2.5 py-1 rounded-full font-black border border-border/40">
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex gap-4 justify-start">
            <div className="w-10 h-10 rounded-2xl bg-white border border-border flex items-center justify-center shrink-0 shadow-sm">
              <Sparkles size={16} className="text-vanilla animate-pulse" />
            </div>
            <div className="bg-white border border-border/60 rounded-3xl rounded-tl-sm p-5 flex items-center gap-3 shadow-sm">
              <Loader2 className="w-4 h-4 animate-spin text-vanilla" />
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest italic">Analyse en cours...</span>
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      <div className="shrink-0 space-y-4 pt-4">
        <div className="flex gap-2 flex-wrap justify-center lg:justify-start">
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              disabled={isLoading}
              className="text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl bg-white border border-border/60 hover:bg-vanilla/10 hover:border-vanilla/30 transition-all active:scale-95 disabled:opacity-50"
            >
              {s}
            </button>
          ))}
        </div>
        <div className="bg-white border-2 border-border/40 rounded-3xl p-3 flex items-end gap-3 shadow-xl focus-within:border-vanilla/50 transition-all">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Posez votre question sur vos dossiers, documents ou RDV..."
            rows={1}
            className="flex-1 bg-transparent px-4 py-3 focus:outline-none text-sm font-medium resize-none soft-scroll"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            disabled={isLoading}
          />
          <button
            onClick={() => isLoading ? handleStop() : send(input)}
            disabled={!isLoading && !input.trim()}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-lg active:scale-90 shrink-0 ${
              isLoading 
                ? "bg-red-50 text-red-500 hover:bg-red-100 border border-red-100" 
                : "bg-eerie text-white hover:bg-black disabled:opacity-50"
            }`}
          >
            {isLoading ? <Square size={18} fill="currentColor" /> : <ArrowUp size={20} />}
          </button>
        </div>
        <p className="text-[10px] text-center text-muted-foreground font-bold uppercase tracking-[0.2em] opacity-40">
          SmartEstateHub IA — Analyse temps réel de vos données
        </p>
      </div>
    </div>
  );
}
