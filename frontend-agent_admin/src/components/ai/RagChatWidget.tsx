import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, MessageSquare, ShieldCheck, FileText, TrendingUp, AlertTriangle, ChevronDown, X, Square } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { askRagQuestion } from '@/api/ragApi';
import ReactMarkdown from 'react-markdown';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  sources?: string[];
}

interface RagChatWidgetProps {
  dealId: string;
}

const WAITING_QUOTES = [
  "Analyse des documents en cours...",
  "Extraction des données clés...",
  "Murshid consulte votre dossier...",
  "Vérification de la conformité...",
  "Synthèse des informations...",
];

export const RagChatWidget: React.FC<RagChatWidgetProps> = ({ dealId }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentQuote, setCurrentQuote] = useState(WAITING_QUOTES[0]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const quickActions = [
    { label: 'Résumé documents', icon: <FileText size={12} />, query: 'Fais-moi un résumé synthétique des documents déposés.' },
    { label: 'Éligibilité financière', icon: <TrendingUp size={12} />, query: 'Ce client est-il éligible financièrement selon ses documents ?' },
    { label: 'Analyse des risques', icon: <AlertTriangle size={12} />, query: 'Identifie les risques ou clauses critiques dans les documents du dossier.' },
    { label: 'Dossier complet ?', icon: <ShieldCheck size={12} />, query: 'Est-ce que le dossier est complet pour cette étape ?' },
  ];

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
    if (isModalOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isModalOpen]);

  const stopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: "Analyse interrompue par l'utilisateur."
      }]);
    }
  };

  const handleSend = async (queryOverride?: string) => {
    const textToSend = queryOverride || input;
    if (!textToSend.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: textToSend };
    setMessages((prev) => [...prev, userMessage]);
    if (!queryOverride) setInput('');
    setIsLoading(true);

    // Create a new AbortController for this request
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      const response = await askRagQuestion({ dealId, query: textToSend, history });
      
      if (controller.signal.aborted) return;

      const assistantMessage: Message = { 
        role: 'assistant', 
        content: response.answer,
        sources: response.sources 
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      if (error.name === 'AbortError') return;
      console.error('Erreur RAG:', error);
      const errorMessage: Message = { 
        role: 'assistant', 
        content: "Désolé, je rencontre une difficulté technique pour analyser vos documents actuellement." 
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full flex flex-col gap-2">
      {/* Trigger Button - Simple and App matching */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="w-full bg-eerie text-ghost rounded-2xl p-4 flex items-center justify-between hover:bg-black transition-all shadow-md group border border-white/5"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-vanilla flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform duration-300">
            <Bot className="w-5 h-5 text-eerie" />
          </div>
          <div className="text-left">
            <h3 className="text-[10px] font-black tracking-widest uppercase text-vanilla">Murshid Docs</h3>
            <p className="text-[8px] opacity-40 font-bold uppercase tracking-tighter">Assistant IA</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 bg-white/5 px-2 py-1 rounded-full border border-white/10">
            <div className="w-1 h-1 rounded-full bg-honeydew animate-pulse shadow-[0_0_5px_rgba(183,235,143,0.8)]" />
            <span className="text-[7px] font-black uppercase tracking-widest opacity-60">READY</span>
          </div>
          <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-vanilla/10 transition-colors">
            <ChevronDown size={14} className="opacity-40 -rotate-90" />
          </div>
        </div>
      </button>
      
      {/* Chat Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-eerie/70 backdrop-blur-sm animate-in fade-in duration-200" 
            onClick={() => setIsModalOpen(false)} 
          />
          <Card className="relative w-full max-w-lg h-[600px] border-none shadow-2xl bg-ghost rounded-[2rem] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            <CardHeader className="bg-white border-b border-border/40 p-4 shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-vanilla flex items-center justify-center shadow-sm">
                    <Bot size={20} className="text-eerie" />
                  </div>
                  <div>
                    <CardTitle className="text-[11px] font-black tracking-widest uppercase text-eerie">Murshid</CardTitle>
                    <p className="text-[8px] opacity-50 font-bold uppercase tracking-widest mt-0.5">Assistant Intelligence</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="w-8 h-8 rounded-lg bg-ghost hover:bg-danger/5 hover:text-danger flex items-center justify-center transition-all active:scale-90 border border-border/10"
                >
                  <X size={16} />
                </button>
              </div>
            </CardHeader>

            <CardContent className="flex-1 overflow-hidden p-0 bg-ghost/10">
              <ScrollArea className="h-full p-5">
                <div className="space-y-4 pb-4">
                  {messages.length === 0 && (
                    <div className="py-6 space-y-6 text-center">
                      <div className="space-y-2">
                        <div className="w-14 h-14 bg-vanilla/10 rounded-2xl flex items-center justify-center mx-auto">
                          <Bot size={28} className="text-vanilla" />
                        </div>
                        <h3 className="text-sm font-black text-eerie uppercase tracking-tight">Analyse de documents</h3>
                        <p className="text-[9px] text-muted-foreground max-w-[200px] mx-auto font-bold leading-relaxed uppercase tracking-widest opacity-60">
                          Choisissez une action ou posez votre question.
                        </p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2.5 max-w-sm mx-auto px-4">
                        {quickActions.map((action, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleSend(action.query)}
                            className="p-3 rounded-xl bg-white border border-border/40 hover:border-vanilla/40 hover:shadow-md transition-all flex flex-col items-center gap-2 text-center group/btn shadow-sm"
                          >
                            <div className="p-2 rounded-lg bg-ghost group-hover/btn:bg-vanilla/10 transition-all text-eerie shrink-0">
                              {action.icon}
                            </div>
                            <span className="text-[8px] font-black uppercase tracking-widest leading-tight text-eerie/80">{action.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {messages.map((msg, index) => (
                    <div
                      key={index}
                      className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-200`}
                    >
                      {msg.role === 'assistant' && (
                        <div className="w-7 h-7 rounded-lg bg-vanilla text-eerie flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                          <Bot size={14} />
                        </div>
                      )}
                      
                      <div className={`max-w-[85%] space-y-1.5`}>
                         <div className={`rounded-2xl p-3.5 text-xs shadow-sm leading-relaxed font-medium markdown-content ${
                            msg.role === 'user'
                              ? 'bg-eerie text-ghost rounded-tr-none font-bold'
                              : 'bg-white border border-border/30 text-eerie rounded-tl-none'
                          }`}>
                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                         </div>
                         
                         {msg.sources && msg.sources.length > 0 && (
                          <div className="flex flex-wrap gap-1 px-1">
                            {msg.sources.map((source, i) => (
                              <span key={i} className="text-[7px] bg-white/80 border border-border/30 px-2 py-0.5 rounded-md font-black uppercase tracking-widest text-eerie/50 flex items-center gap-1 shadow-sm">
                                 <FileText size={8} className="text-vanilla" /> {source}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {isLoading && (
                    <div className="flex gap-2.5 items-start animate-in fade-in duration-200">
                      <div className="w-7 h-7 rounded-lg bg-vanilla text-eerie flex items-center justify-center shrink-0 shadow-sm mt-0.5 animate-pulse">
                        <Bot size={14} />
                      </div>
                      <div className="bg-white border border-border/20 rounded-2xl rounded-tl-none p-4 flex flex-col gap-2.5 min-w-[200px] shadow-sm">
                        <div className="flex items-center gap-2">
                          <div className="flex gap-0.5">
                            <span className="w-1 h-1 bg-vanilla rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-1 h-1 bg-vanilla rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-1 h-1 bg-vanilla rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                          </div>
                          <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground italic">{currentQuote}</span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={scrollRef} className="h-2" />
                </div>
              </ScrollArea>
            </CardContent>

            <CardFooter className="p-4 border-t border-border/20 bg-white shrink-0">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="relative w-full"
              >
                <div className="relative flex items-center gap-2 bg-ghost/50 rounded-xl border border-border/40 focus-within:border-vanilla/40 focus-within:bg-white transition-all p-1 shadow-inner">
                  <textarea
                    ref={inputRef}
                    placeholder="Posez votre question..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="flex-1 bg-transparent px-3 py-2.5 focus:outline-none text-[10px] font-bold resize-none min-h-[36px] max-h-[80px] soft-scroll placeholder:text-muted-foreground/30"
                    disabled={isLoading}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                  />
                  <button 
                    type={isLoading ? "button" : "submit"}
                    onClick={isLoading ? stopGeneration : undefined}
                    className={`w-9 h-9 rounded-lg transition-all shadow-md shrink-0 flex items-center justify-center ${
                        isLoading 
                          ? 'bg-danger/10 text-danger hover:bg-danger/20' 
                          : !input.trim() 
                            ? 'bg-ghost text-muted-foreground/30 cursor-not-allowed' 
                            : 'bg-eerie text-vanilla hover:bg-black scale-100 active:scale-95'
                    }`}
                  >
                    {isLoading ? <Square size={14} fill="currentColor" /> : <Send className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[7px] text-center text-muted-foreground/20 font-black tracking-[0.2em] uppercase mt-2">
                  Murshid — IA Immobilière
                </p>
              </form>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
};
