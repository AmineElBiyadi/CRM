import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, MessageSquare, ShieldCheck, FileText, TrendingUp, AlertTriangle, ChevronDown } from 'lucide-react';
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

export const RagChatWidget: React.FC<RagChatWidgetProps> = ({ dealId }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

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
    if (isModalOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isModalOpen]);

  const handleSend = async (queryOverride?: string) => {
    const textToSend = queryOverride || input;
    if (!textToSend.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: textToSend };
    setMessages((prev) => [...prev, userMessage]);
    if (!queryOverride) setInput('');
    setIsLoading(true);

    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      const response = await askRagQuestion({ dealId, query: textToSend, history });
      const assistantMessage: Message = { 
        role: 'assistant', 
        content: response.answer,
        sources: response.sources 
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Erreur RAG:', error);
      const errorMessage: Message = { 
        role: 'assistant', 
        content: "Désolé, je rencontre une difficulté technique pour analyser vos documents actuellement." 
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full flex flex-col gap-2">
      {/* Trigger Button - Design improved to match the app */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="w-full bg-eerie text-ghost rounded-2xl p-5 flex items-center justify-between hover:bg-black transition-all shadow-xl shadow-black/5 group border border-white/10"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-vanilla flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-500 ring-4 ring-vanilla/10">
            <Bot className="w-7 h-7 text-eerie" />
          </div>
          <div className="text-left space-y-0.5">
            <h3 className="text-[11px] font-black tracking-[0.2em] uppercase text-vanilla">Murshid Docs</h3>
            <p className="text-[9px] opacity-40 font-black uppercase tracking-widest">Analyse Intelligente</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full border border-white/10 backdrop-blur-md">
            <div className="w-1.5 h-1.5 rounded-full bg-honeydew animate-pulse shadow-[0_0_8px_rgba(183,235,143,0.8)]" />
            <span className="text-[8px] font-black uppercase tracking-widest opacity-80">AI READY</span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-vanilla/10 transition-colors">
            <ChevronDown size={18} className="opacity-40 -rotate-90" />
          </div>
        </div>
      </button>
      
      {/* Chat Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-eerie/80 backdrop-blur-md animate-in fade-in duration-300" 
            onClick={() => setIsModalOpen(false)} 
          />
          <Card className="relative w-full max-w-2xl h-[85vh] border-none shadow-2xl bg-ghost rounded-[2.5rem] overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
            <CardHeader className="bg-eerie text-ghost p-6 shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-vanilla flex items-center justify-center shadow-lg">
                    <Bot size={28} className="text-eerie" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-black tracking-[0.2em] uppercase text-vanilla">Murshid</CardTitle>
                    <p className="text-[10px] opacity-40 font-bold uppercase tracking-widest mt-0.5">Assistant Documentaire</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="w-10 h-10 rounded-2xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all active:scale-90"
                >
                  <X size={20} className="opacity-60" />
                </button>
              </div>
            </CardHeader>

            <CardContent className="flex-1 overflow-hidden p-0 bg-white/50 backdrop-blur-sm">
              <ScrollArea className="h-full p-8">
                <div className="space-y-6 pb-4">
                  {messages.length === 0 && (
                    <div className="py-12 space-y-10 text-center">
                      <div className="space-y-3">
                        <div className="w-20 h-20 bg-vanilla/10 rounded-[2.5rem] flex items-center justify-center mx-auto ring-8 ring-vanilla/5">
                          <Bot size={40} className="text-vanilla" />
                        </div>
                        <h3 className="text-lg font-black text-eerie uppercase tracking-tight">Besoin d'une analyse ?</h3>
                        <p className="text-xs text-muted-foreground max-w-[280px] mx-auto font-medium leading-relaxed uppercase tracking-widest opacity-60">
                          Posez une question sur les documents ou utilisez une action rapide ci-dessous.
                        </p>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto">
                        {quickActions.map((action, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleSend(action.query)}
                            className="p-5 rounded-3xl bg-white border border-border/40 hover:border-vanilla/60 hover:shadow-xl hover:shadow-vanilla/10 transition-all flex items-center gap-4 text-left group/btn shadow-sm"
                          >
                            <div className="p-3 rounded-2xl bg-ghost group-hover/btn:bg-vanilla/20 transition-all text-eerie shrink-0">
                              {action.icon}
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest leading-tight text-eerie/80">{action.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {messages.map((msg, index) => (
                    <div
                      key={index}
                      className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-4 duration-500`}
                    >
                      {msg.role === 'assistant' && (
                        <div className="w-10 h-10 rounded-2xl bg-vanilla text-eerie flex items-center justify-center shrink-0 shadow-lg shadow-vanilla/20 mt-1">
                          <Bot size={20} />
                        </div>
                      )}
                      
                      <div className={`max-w-[85%] space-y-3`}>
                         <div className={`rounded-3xl p-5 text-sm shadow-sm leading-relaxed font-medium markdown-content ${
                            msg.role === 'user'
                              ? 'bg-eerie text-ghost rounded-tr-none font-bold'
                              : 'bg-white border border-border/30 text-eerie rounded-tl-none'
                          }`}>
                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                         </div>
                         
                         {msg.sources && msg.sources.length > 0 && (
                          <div className="flex flex-wrap gap-2 px-1">
                            {msg.sources.map((source, i) => (
                              <span key={i} className="text-[9px] bg-white/80 backdrop-blur-md border border-border/40 px-3 py-1.5 rounded-xl font-black uppercase tracking-widest text-eerie/60 flex items-center gap-2 shadow-sm hover:border-vanilla/40 transition-colors">
                                 <FileText size={12} className="text-vanilla" /> {source}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {isLoading && (
                    <div className="flex gap-4 items-start animate-in fade-in duration-300">
                      <div className="w-10 h-10 rounded-2xl bg-vanilla text-eerie flex items-center justify-center shrink-0 shadow-lg shadow-vanilla/20 mt-1 animate-pulse">
                        <Bot size={20} />
                      </div>
                      <div className="bg-white border border-border/30 rounded-3xl rounded-tl-none p-6 flex flex-col gap-4 min-w-[280px] shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="flex gap-1">
                            <span className="w-1.5 h-1.5 bg-vanilla rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-1.5 h-1.5 bg-vanilla rounded-full animate-bounce" style={{ animationDelay: '200ms' }} />
                            <span className="w-1.5 h-1.5 bg-vanilla rounded-full animate-bounce" style={{ animationDelay: '400ms' }} />
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 italic">Analyse en cours</span>
                        </div>
                        <div className="space-y-2">
                          <div className="h-1.5 w-full bg-ghost rounded-full overflow-hidden">
                            <div className="h-full w-1/3 bg-vanilla/40 animate-[shiver_2s_infinite]" />
                          </div>
                          <div className="h-1.5 w-2/3 bg-ghost rounded-full" />
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={scrollRef} className="h-4" />
                </div>
              </ScrollArea>
            </CardContent>

            <CardFooter className="p-6 border-t border-border/20 bg-ghost shrink-0">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="relative w-full"
              >
                <div className="relative flex items-end gap-3 bg-white rounded-[1.5rem] border border-border/40 focus-within:border-vanilla/50 focus-within:shadow-xl focus-within:shadow-vanilla/5 transition-all p-2 shadow-sm">
                  <textarea
                    ref={inputRef}
                    placeholder="Posez votre question sur les documents..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="flex-1 bg-transparent px-4 py-3 focus:outline-none text-xs font-bold resize-none min-h-[44px] max-h-[120px] soft-scroll placeholder:text-muted-foreground/40"
                    disabled={isLoading}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                  />
                  <Button 
                    type="submit" 
                    size="icon" 
                    disabled={isLoading || !input.trim()}
                    className={`w-11 h-11 rounded-2xl transition-all shadow-lg shrink-0 ${
                        isLoading || !input.trim() ? 'bg-muted opacity-50' : 'bg-eerie text-vanilla hover:bg-black hover:scale-105 active:scale-95'
                    }`}
                  >
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                  </Button>
                </div>
                <p className="text-[8px] text-center text-muted-foreground/30 font-black tracking-[0.3em] uppercase mt-3">
                  Murshid Docs — Intelligence Immobilière
                </p>
              </form>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
};
