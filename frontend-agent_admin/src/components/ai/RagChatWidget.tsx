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
  const [isCollapsed, setIsCollapsed] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

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
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="w-full bg-eerie text-ghost rounded-2xl p-4 flex items-center justify-between hover:bg-black transition-all shadow-lg group"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-vanilla flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
            <Bot className="w-6 h-6 text-eerie" />
          </div>
          <div className="text-left">
            <h3 className="text-xs font-black tracking-tight uppercase tracking-widest">MURSHID DOCS</h3>
            <p className="text-[9px] opacity-50 font-bold uppercase">Analyse intelligente</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 bg-ghost/10 px-2 py-1 rounded-full border border-ghost/20">
            <div className="w-1.5 h-1.5 rounded-full bg-honeydew animate-pulse shadow-[0_0_8px_rgba(183,235,143,0.8)]" />
            <span className="text-[8px] font-black uppercase tracking-tighter">AI READY</span>
          </div>
          <div className={`w-8 h-8 rounded-full bg-ghost/10 flex items-center justify-center transition-transform duration-500 ${isCollapsed ? '' : 'rotate-180'}`}>
            <ChevronDown size={16} className="opacity-60" />
          </div>
        </div>
      </button>
      
      {!isCollapsed && (
        <Card className="w-full h-[450px] border border-border/40 shadow-xl bg-white rounded-2xl overflow-hidden flex flex-col animate-in zoom-in-95 slide-in-from-top-2 duration-300">
          <CardContent className="flex-1 overflow-hidden p-0">
            <ScrollArea className="h-full p-4">
              <div className="space-y-4 pb-2">
                {messages.length === 0 && (
                  <div className="py-6 space-y-6 text-center">
                    <div className="space-y-2">
                      <h3 className="text-sm font-black text-eerie uppercase tracking-tight">Besoin d'une analyse ?</h3>
                      <p className="text-[11px] text-muted-foreground max-w-[200px] mx-auto font-medium leading-tight">
                        Choisissez une action ou posez votre question sur les documents.
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      {quickActions.map((action, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSend(action.query)}
                          className="p-3 rounded-xl border border-ghost hover:border-vanilla/40 hover:bg-vanilla/5 transition-all flex flex-col items-center text-center gap-2 group/btn shadow-sm"
                        >
                          <div className="p-2 rounded-lg bg-ghost group-hover/btn:bg-vanilla/20 group-hover/btn:scale-105 transition-all text-eerie">
                            {action.icon}
                          </div>
                          <span className="text-[9px] font-black uppercase tracking-tight leading-tight text-eerie/80">{action.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                {messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
                  >
                    {msg.role === 'assistant' && (
                      <div className="w-9 h-9 rounded-xl bg-vanilla text-eerie flex items-center justify-center shrink-0 shadow-sm mt-1">
                        <Bot size={18} />
                      </div>
                    )}
                    
                    <div className={`max-w-[80%] space-y-2`}>
                       <div className={`rounded-2xl p-4 text-sm shadow-sm leading-relaxed font-medium markdown-content ${
                          msg.role === 'user'
                            ? 'bg-eerie text-ghost rounded-tr-none'
                            : 'bg-ghost border border-border/40 text-eerie rounded-tl-none'
                        }`}>
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                       </div>
                       
                       {msg.sources && msg.sources.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 px-1">
                          {msg.sources.map((source, i) => (
                            <span key={i} className="text-[9px] bg-white border border-border/60 px-2.5 py-1 rounded-lg font-black uppercase tracking-widest text-eerie/60 flex items-center gap-1.5 shadow-xs">
                               <FileText size={10} className="text-vanilla" /> {source}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex gap-4 items-start">
                    <div className="w-9 h-9 rounded-xl bg-vanilla text-eerie flex items-center justify-center shrink-0 shadow-sm mt-1 animate-pulse">
                      <Bot size={18} />
                    </div>
                    <div className="bg-ghost border border-border/30 rounded-2xl rounded-tl-none p-5 flex flex-col gap-3 min-w-[200px] shadow-sm">
                      <div className="flex items-center gap-3">
                        <Loader2 className="w-4 h-4 animate-spin text-vanilla" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground italic">Analyse en cours</span>
                      </div>
                      <div className="space-y-2">
                        <div className="h-2 w-full bg-border/40 rounded-full overflow-hidden">
                          <div className="h-full w-1/3 bg-vanilla animate-[shiver_2s_infinite]" />
                        </div>
                        <div className="h-2 w-2/3 bg-border/40 rounded-full" />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={scrollRef} className="h-2" />
              </div>
            </ScrollArea>
          </CardContent>

          <CardFooter className="p-4 border-t border-ghost bg-white shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="relative w-full"
            >
              <div className="relative flex items-end gap-2 bg-ghost rounded-xl border border-transparent focus-within:border-vanilla/30 focus-within:bg-white transition-all p-1.5 shadow-inner">
                <textarea
                  placeholder="Question sur les docs..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="flex-1 bg-transparent px-3 py-2 focus:outline-none text-xs font-bold resize-none min-h-[36px] max-h-[80px] soft-scroll"
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
                  className={`w-9 h-9 rounded-lg transition-all shadow-md shrink-0 ${
                      isLoading || !input.trim() ? 'bg-muted opacity-50' : 'bg-eerie text-ghost hover:bg-black'
                  }`}
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </div>
            </form>
          </CardFooter>
        </Card>
      )}
    </div>
  );
};
