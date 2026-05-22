import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Sparkles, ArrowUp, FileText } from "lucide-react";

export const Route = createFileRoute("/client/assistant")({
  component: ClientAssistant,
});

interface Msg { role: "user" | "ai"; text: string; cards?: { name: string; status: string }[] }

const initial: Msg[] = [
  { role: "ai", text: "Bonjour M. Benchekroun ! Je suis votre assistant SmartEstate. Posez-moi toutes vos questions sur votre dossier." },
  { role: "user", text: "Quels documents me manquent ?" },
  {
    role: "ai",
    text: "Il vous reste 2 documents à fournir pour compléter votre dossier :",
    cards: [
      { name: "Justificatif de revenus 2024", status: "Manquant" },
      { name: "Pré-accord bancaire", status: "Manquant" },
    ],
  },
];

const suggestions = [
  "Quels documents manquent ?",
  "Que se passe-t-il après la signature ?",
  "Mon dossier avance-t-il bien ?",
  "Quand est mon prochain RDV ?",
];

function ClientAssistant() {
  const [messages, setMessages] = useState<Msg[]>(initial);
  const [input, setInput] = useState("");

  const send = (text: string) => {
    if (!text.trim()) return;
    setMessages((m) => [...m, { role: "user", text }, { role: "ai", text: "Je traite votre demande… (démo statique)" }]);
    setInput("");
  };

  return (
    <div className="max-w-3xl mx-auto h-[calc(100vh-12rem)] flex flex-col">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-vanilla flex items-center justify-center neu-sm">
          <Sparkles size={20} />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Assistant IA</h1>
          <p className="text-sm text-muted-foreground">Votre dossier, à portée de question</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto soft-scroll space-y-4 pb-6">
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-3 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            {m.role === "ai" && (
              <div className="w-9 h-9 rounded-full bg-vanilla flex items-center justify-center shrink-0">
                <Sparkles size={14} />
              </div>
            )}
            <div className={`max-w-[75%] ${m.role === "user" ? "bg-eerie text-ghost rounded-2xl rounded-br-md" : "bg-alice/60 text-eerie rounded-2xl rounded-bl-md"} p-4`}>
              <p className="text-sm leading-relaxed">{m.text}</p>
              {m.cards && (
                <div className="mt-3 space-y-2">
                  {m.cards.map((c) => (
                    <div key={c.name} className="bg-ghost rounded-lg p-3 flex items-center gap-2">
                      <FileText size={14} />
                      <span className="text-xs font-medium flex-1 text-eerie">{c.name}</span>
                      <span className="text-[10px] text-destructive">{c.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="shrink-0 space-y-3">
        <div className="flex gap-2 flex-wrap">
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              className="text-xs px-3 py-2 rounded-full neu-sm hover:neu-pressable"
            >
              {s}
            </button>
          ))}
        </div>
        <div className="neu rounded-2xl p-2 flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Posez votre question…"
            rows={1}
            className="flex-1 bg-transparent px-3 py-2.5 focus:outline-none text-sm resize-none"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
          />
          <button
            onClick={() => send(input)}
            className="w-10 h-10 rounded-xl bg-honeydew flex items-center justify-center hover:opacity-80"
          >
            <ArrowUp size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
