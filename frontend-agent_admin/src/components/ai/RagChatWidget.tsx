import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, MessageSquare, X } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { askRagQuestion } from '@/api/ragApi';

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
      const response = await askRagQuestion({ dealId, query: input });
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
    <Card className="w-full h-[500px] flex flex-col shadow-lg border-2">
      <CardHeader className="bg-primary/5 py-3 border-b">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Bot className="w-4 h-4 text-primary" />
          Assistant Documentaire RAG
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full p-4">
          <div className="space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-20" />
                <p className="text-sm">Posez une question sur les documents de ce dossier.</p>
                <p className="text-xs italic">(Ex: "Quelles sont les clauses suspensives ?")</p>
              </div>
            )}
            
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 text-sm ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground ml-4'
                      : 'bg-muted mr-4'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {msg.role === 'user' ? (
                      <User className="w-3 h-3 opacity-70" />
                    ) : (
                      <Bot className="w-3 h-3 text-primary" />
                    )}
                    <span className="text-[10px] uppercase font-bold opacity-70">
                      {msg.role === 'user' ? 'Vous' : 'Assistant IA'}
                    </span>
                  </div>
                  <div className="whitespace-pre-wrap leading-relaxed">
                    {msg.content}
                  </div>
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-primary/10 flex flex-wrap gap-1">
                      <span className="text-[9px] font-bold uppercase opacity-50 w-full mb-1">Sources :</span>
                      {msg.sources.map((source, i) => (
                        <span key={i} className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-medium">
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
                <div className="bg-muted rounded-lg p-3 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  <span className="text-xs text-muted-foreground italic">L'IA analyse vos documents...</span>
                </div>
              </div>
            )}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>
      </CardContent>

      <CardFooter className="p-3 border-t bg-background">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex w-full gap-2"
        >
          <Input
            placeholder="Posez votre question..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1"
            disabled={isLoading}
          />
          <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
};
