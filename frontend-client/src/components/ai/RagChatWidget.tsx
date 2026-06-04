import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, MessageSquare, X, Sparkles } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ragApi } from '@/api/ragApi';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  sources?: string[];
}

interface RagChatWidgetProps {
  dealId?: string;
}

export const RagChatWidget: React.FC<RagChatWidgetProps> = ({ dealId }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = dealId 
        ? await ragApi.askQuestion(dealId, input)
        : await ragApi.askGlobalQuestion(input);
        
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
        content: "Désolé, je ne parviens pas à analyser vos documents pour le moment. Veuillez réessayer plus tard." 
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-2xl bg-vanilla text-eerie hover:scale-110 transition-all z-50 p-0"
      >
        <Bot size={28} />
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-6 right-6 w-[380px] h-[550px] flex flex-col shadow-2xl border-2 z-50 animate-in slide-in-from-bottom-10">
      <CardHeader className="bg-eerie text-white py-4 border-b flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-black flex items-center gap-2 tracking-widest">
          <Sparkles className="w-4 h-4 text-vanilla" />
          ASSISTANT INTELLIGENT
        </CardTitle>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setIsOpen(false)}
          className="text-white hover:bg-white/10"
        >
          <X size={20} />
        </Button>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-hidden p-0 bg-ghost/20">
        <ScrollArea className="h-full p-4">
          <div className="space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground py-10 space-y-4">
                <div className="w-16 h-16 bg-vanilla/10 rounded-full flex items-center justify-center mx-auto">
                  <Bot className="w-8 h-8 text-vanilla" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-eerie">Comment puis-je vous aider ?</p>
                  <p className="text-xs px-6">Posez-moi une question sur vos dossiers, rendez-vous, contrats ou documents.</p>
                </div>
                <div className="flex flex-wrap justify-center gap-2 px-4">
                  {["Combien j'ai de dossiers ?", "Mon prochain RDV ?", "État de mes contrats ?"].map((q) => (
                    <button
                      key={q}
                      onClick={() => setInput(q)}
                      className="text-[10px] bg-white border border-border px-3 py-1.5 rounded-full hover:bg-vanilla/10 transition-colors"
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
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl p-4 text-sm shadow-sm ${
                    msg.role === 'user'
                      ? 'bg-vanilla text-eerie ml-4 font-medium'
                      : 'bg-white border border-border mr-4'
                  }`}
                >
                  <div className="whitespace-pre-wrap leading-relaxed">
                    {msg.content}
                  </div>
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-vanilla/20 flex flex-wrap gap-1">
                      <span className="text-[9px] font-black uppercase text-eerie/40 w-full mb-1 tracking-widest">Documents consultés :</span>
                      {msg.sources.map((source, i) => (
                        <span key={i} className="text-[9px] bg-vanilla/20 text-eerie px-2 py-0.5 rounded-full font-bold">
                          {source}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-border rounded-2xl p-4 flex items-center gap-3">
                  <Loader2 className="w-4 h-4 animate-spin text-vanilla" />
                  <span className="text-xs text-muted-foreground italic font-medium">Analyse de vos données...</span>
                </div>
              </div>
            )}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>
      </CardContent>

      <CardFooter className="p-4 border-t bg-white">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex w-full gap-2"
        >
          <Input
            placeholder="Écrivez votre question ici..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 rounded-xl border-ghost focus-visible:ring-vanilla"
            disabled={isLoading}
          />
          <Button 
            type="submit" 
            size="icon" 
            disabled={isLoading || !input.trim()}
            className="bg-eerie text-white hover:bg-eerie/90 rounded-xl w-10 h-10 shrink-0"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
};
