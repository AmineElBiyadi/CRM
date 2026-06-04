import React, { useState, useRef, useEffect } from 'react';
import { Send, X, Square, Bot } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ragApi } from '@/api/ragApi';
import { cn } from '@/lib/utils';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  sources?: string[];
}

interface RagChatWidgetProps {
  dealId?: string;
}

const WAITING_QUOTES = [
  "Analyse de vos données...",
  "Recherche dans vos documents...",
  "Synthèse de votre dossier...",
  "Consultation des mises à jour...",
  "Préparation de la réponse...",
];

const QUICK_QUESTIONS = [
  "Combien j'ai de dossiers ?",
  "Mon prochain rendez-vous ?",
  "État de mes contrats ?",
];

export const RagChatWidget: React.FC<RagChatWidgetProps> = ({ dealId }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [currentQuote, setCurrentQuote] = useState(WAITING_QUOTES[0]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  useEffect(() => {
    let interval: any;
    if (isLoading) {
      interval = setInterval(() => {
        setCurrentQuote(WAITING_QUOTES[Math.floor(Math.random() * WAITING_QUOTES.length)]);
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSend = async (text?: string) => {
    const query = text || input;
    if (!query.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: query };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Create a new AbortController for this request
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      
      const response = dealId
        ? await ragApi.askQuestion(dealId, query) 
        : await ragApi.askGlobalQuestion(query, history);

      if (controller.signal.aborted) return;

      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: response.answer,
        sources: response.sources
      }]);
    } catch (error: any) {
      if (error.name === 'AbortError' || error.name === 'CanceledError') return;
      console.error('Erreur RAG:', error);
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: "Je ne parviens pas à traiter cette demande. Veuillez réessayer.",
      }]);
    } finally {
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
      setIsLoading(false);
    }
  };

  const stopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: "Génération interrompue."
      }]);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 group"
        aria-label="Ouvrir MURSHID"
      >
        <div className="relative w-14 h-14 bg-eerie rounded-2xl flex items-center justify-center shadow-[0_8px_32px_rgba(0,0,0,0.25)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.35)] transition-all duration-300 hover:-translate-y-0.5">
          <Bot size={24} className="text-vanilla" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-vanilla rounded-full" />
        </div>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[420px] h-[620px] flex flex-col bg-white rounded-3xl shadow-[0_24px_60px_rgba(0,0,0,0.18)] border border-border/40 overflow-hidden animate-in slide-in-from-bottom-6 duration-300">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-border/30 bg-eerie text-white">
        <div>
          <h2 className="text-sm font-black tracking-[0.2em] uppercase">Murshid</h2>
          <p className="text-[10px] text-white/40 mt-0.5 tracking-wider font-medium uppercase">Assistant Intelligent</p>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-white/10 transition-colors text-white/60 hover:text-white"
        >
          <X size={16} />
        </button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 bg-[#f9f9f8]">
        <div className="p-6 space-y-5">
          {messages.length === 0 && (
            <div className="py-8 text-center space-y-6">
              <div>
                <p className="text-base font-bold text-eerie">Comment puis-je vous aider ?</p>
                <p className="text-xs text-muted-foreground mt-1 font-medium">
                  Vos dossiers, contrats et documents à portée de main.
                </p>
              </div>
              <div className="space-y-2">
                {QUICK_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    onClick={() => handleSend(q)}
                    className="w-full text-left text-xs font-medium px-4 py-3 rounded-xl bg-white border border-border/50 hover:border-eerie/30 hover:bg-eerie/5 transition-all text-eerie/80"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, index) => (
            <div
              key={index}
              className={cn(
                "flex",
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              {msg.role === 'assistant' && (
                <div className="w-6 h-6 rounded-lg bg-eerie flex items-center justify-center flex-shrink-0 mt-1 mr-2.5">
                  <span className="text-vanilla text-[8px] font-black tracking-tight">M</span>
                </div>
              )}
              <div
                className={cn(
                  "max-w-[82%] text-sm rounded-2xl px-4 py-3",
                  msg.role === 'user'
                    ? 'bg-eerie text-vanilla rounded-tr-sm font-medium'
                    : 'bg-white border border-border/50 text-eerie rounded-tl-sm shadow-sm leading-relaxed'
                )}
              >
                <div className="whitespace-pre-wrap">{msg.content}</div>
                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-border/30 flex flex-wrap gap-1">
                    {msg.sources.map((source, i) => (
                      <span key={i} className="text-[9px] bg-ghost text-eerie/60 px-2 py-0.5 rounded-md font-bold border border-border/20">
                        {source}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-start gap-2.5">
              <div className="w-6 h-6 rounded-lg bg-eerie flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-vanilla text-[8px] font-black tracking-tight">M</span>
              </div>
              <div className="bg-white border border-border/50 rounded-2xl rounded-tl-sm shadow-sm px-4 py-3 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-eerie/30 rounded-full animate-bounce [animation-delay:0ms]" />
                    <span className="w-1.5 h-1.5 bg-eerie/30 rounded-full animate-bounce [animation-delay:150ms]" />
                    <span className="w-1.5 h-1.5 bg-eerie/30 rounded-full animate-bounce [animation-delay:300ms]" />
                  </div>
                  <span className="text-xs text-muted-foreground font-medium italic">{currentQuote}</span>
                </div>
              </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="border-t border-border/30 bg-white px-4 py-4">
        <div className="flex items-end gap-2 bg-[#f9f9f8] rounded-2xl border border-border/40 px-4 py-3 focus-within:border-eerie/30 transition-colors">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Posez votre question..."
            rows={1}
            disabled={isLoading}
            className="flex-1 bg-transparent text-sm font-medium text-eerie placeholder:text-muted-foreground/50 resize-none focus:outline-none leading-relaxed"
            style={{ maxHeight: '96px' }}
          />
          <button
            onClick={() => isLoading ? stopGeneration() : handleSend()}
            disabled={!isLoading && !input.trim()}
            className={cn(
              "w-8 h-8 rounded-xl flex items-center justify-center active:scale-90 transition-all shrink-0 mb-0.5",
              isLoading 
                ? "bg-red-50 text-red-500 hover:bg-red-100 border border-red-100" 
                : "bg-eerie text-vanilla hover:bg-eerie/90 disabled:opacity-30 disabled:cursor-not-allowed"
            )}
          >
            {isLoading ? <Square size={14} fill="currentColor" /> : <Send size={14} />}
          </button>
        </div>
        <p className="text-[9px] text-center text-muted-foreground/40 font-medium tracking-widest uppercase mt-2">
          Murshid — SmartEstateHub
        </p>
      </div>
    </div>
  );
};
