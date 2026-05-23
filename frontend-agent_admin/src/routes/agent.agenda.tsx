import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { NeuCard } from "@/components/ui/neu-card";
import { SoftBadge } from "@/components/ui/design-bits";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/agent/agenda")({
  component: AgendaPage,
});

const months = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];

function AgendaPage() {
  const [monthIdx, setMonthIdx] = useState(10); // Nov
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const days = Array.from({ length: 35 }, (_, i) => i - 4);
  const eventsByDay: Record<number, "honeydew" | "vanilla"> = {
    3: "vanilla", 5: "honeydew", 9: "vanilla", 12: "honeydew", 14: "honeydew",
    18: "vanilla", 21: "honeydew", 24: "vanilla", 27: "honeydew",
  };
  const today = 18;

  const weekEvents = [
    { day: "Mar 18", time: "09:30", type: "Visite", client: "Karim Benchekroun" },
    { day: "Mar 18", time: "14:30", type: "Signature", client: "Leila Tazi" },
    { day: "Mer 19", time: "11:00", type: "Appel", client: "Youssef Amrani" },
    { day: "Jeu 20", time: "10:00", type: "Visite", client: "Imane Bennani" },
    { day: "Ven 21", time: "16:00", type: "RDV", client: "Nadia Cherkaoui" },
  ];

  return (
    <div className="space-y-6 max-w-[1400px]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Rendez-vous</h1>
          <p className="text-sm text-muted-foreground mt-1">Synchronisé avec Google Calendar</p>
        </div>
        <button
          onClick={() => { document.getElementById("new-rdv")?.scrollIntoView({ behavior: "smooth" }); }}
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-eerie text-ghost text-sm font-medium hover:opacity-90"
        >
          <Plus size={16} /> Nouveau RDV
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <NeuCard className="lg:col-span-2">
          <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <button onClick={() => setMonthIdx((m) => (m + 11) % 12)} className="w-9 h-9 rounded-lg neu-sm hover:neu-pressable flex items-center justify-center" aria-label="Mois précédent"><ChevronLeft size={16} /></button>
              <h2 className="font-semibold text-lg">{months[monthIdx]} 2025</h2>
              <button onClick={() => setMonthIdx((m) => (m + 1) % 12)} className="w-9 h-9 rounded-lg neu-sm hover:neu-pressable flex items-center justify-center" aria-label="Mois suivant"><ChevronRight size={16} /></button>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-honeydew" /> Visite</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-vanilla" /> Signature/RDV</span>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1.5 md:gap-2 text-center text-xs text-muted-foreground mb-2">
            {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((d) => <div key={d}>{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1.5 md:gap-2">
            {days.map((d, i) => {
              const valid = d > 0 && d <= 30;
              const isToday = d === today;
              const ev = eventsByDay[d];
              const isSel = selectedDay === d;
              return (
                <button
                  key={i}
                  disabled={!valid}
                  onClick={() => { if (valid) { setSelectedDay(d); toast(`${d} ${months[monthIdx]} sélectionné`); } }}
                  className={`aspect-square rounded-xl flex flex-col items-center justify-center text-sm relative transition-all ${
                    valid ? "neu-sm hover:neu-pressable cursor-pointer" : "opacity-30"
                  } ${isToday ? "ring-2 ring-eerie" : ""} ${isSel ? "neu-inset" : ""}`}
                >
                  {valid && <span className={isToday ? "font-bold" : ""}>{d}</span>}
                  {ev && <span className={`absolute bottom-2 w-1.5 h-1.5 rounded-full ${ev === "honeydew" ? "bg-honeydew" : "bg-vanilla"}`} />}
                </button>
              );
            })}
          </div>
        </NeuCard>

        <NeuCard>
          <h2 className="font-semibold mb-4">Cette semaine</h2>
          <div className="space-y-3">
            {weekEvents.map((e, i) => (
              <button
                key={i}
                onClick={() => toast(`${e.type} avec ${e.client} — ${e.day} ${e.time}`)}
                className="w-full text-left p-3 neu-sm hover:neu-pressable rounded-lg"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold">{e.day}</span>
                  <SoftBadge tone={e.type === "Visite" ? "success" : "warn"}>{e.type}</SoftBadge>
                </div>
                <div className="text-sm font-medium">{e.client}</div>
                <div className="text-xs text-muted-foreground">{e.time}</div>
              </button>
            ))}
          </div>
        </NeuCard>
      </div>

      <NeuCard id="new-rdv">
        <h2 className="font-semibold mb-5">Nouveau rendez-vous</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="text-xs text-muted-foreground">Date & heure</label>
            <input type="datetime-local" className="mt-2 w-full px-4 py-3 neu-inset rounded-lg bg-transparent focus:outline-none" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Type</label>
            <select className="mt-2 w-full px-4 py-3 neu-inset rounded-lg bg-transparent focus:outline-none">
              <option>Visite</option><option>Appel</option><option>Signature</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Client</label>
            <input placeholder="Rechercher..." className="mt-2 w-full px-4 py-3 neu-inset rounded-lg bg-transparent focus:outline-none" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Bien lié</label>
            <input placeholder="Optionnel" className="mt-2 w-full px-4 py-3 neu-inset rounded-lg bg-transparent focus:outline-none" />
          </div>
        </div>
        <textarea rows={2} placeholder="Notes…" className="mt-4 w-full px-4 py-3 neu-inset rounded-lg bg-transparent focus:outline-none text-sm" />
        <div className="mt-4 flex gap-2 flex-wrap">
          <button
            onClick={() => toast.success("RDV créé et synchronisé Google Calendar")}
            className="px-5 py-2.5 rounded-xl bg-eerie text-ghost text-sm font-medium hover:opacity-90"
          >
            Créer le RDV
          </button>
          <button className="px-5 py-2.5 rounded-xl neu-sm text-sm font-medium">Annuler</button>
        </div>
      </NeuCard>
    </div>
  );
}
