import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchMonthMeetings, fetchWeekMeetings, type MeetingType, type MeetingItem } from "@/api/dossiersApi";
import { NeuCard } from "@/components/ui/neu-card";
import { SoftBadge } from "@/components/ui/design-bits";
import { 
  ChevronLeft, ChevronRight, Plus, CalendarDays, Clock, MapPin, 
  Loader2, Eye, X, Calendar as CalendarIcon, ExternalLink
} from "lucide-react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/agent/agenda")({
  component: AgendaPage,
});

const TYPE_COLORS: Record<string, string> = {
  "Visite": "bg-[#CFDECA] text-eerie", // Honeydew
  "Appel": "bg-[#D8DFE9] text-eerie", // Alice Blue
  "RDV Agence": "bg-[#E6E6FA] text-eerie", // Lavender
  "Signature": "bg-[#EFF0A3] text-eerie", // Vanilla
  "default": "bg-slate-100 text-slate-600"
};

const TYPE_DOTS: Record<string, string> = {
  "Visite": "bg-[#CFDECA]",
  "Appel": "bg-[#D8DFE9]",
  "RDV Agence": "bg-[#E6E6FA]",
  "Signature": "bg-[#EFF0A3]",
  "default": "bg-slate-300"
};

const months = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];

function AgendaPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<number | null>(new Date().getDate());
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { data: monthMeetings, isLoading: loadingMonth } = useQuery({
    queryKey: ["meetings-month", currentDate.getFullYear(), currentDate.getMonth() + 1],
    queryFn: () => fetchMonthMeetings(currentDate.getFullYear(), currentDate.getMonth() + 1)
  });

  const { data: weekMeetings, isLoading: loadingWeek } = useQuery({
    queryKey: ["meetings-week"],
    queryFn: () => fetchWeekMeetings()
  });

  const calendarData = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const offset = firstDay === 0 ? 6 : firstDay - 1;
    return { year, month, daysInMonth, offset };
  }, [currentDate]);

  const days = Array.from({ length: 42 }, (_, i) => {
    const d = i - calendarData.offset + 1;
    return d > 0 && d <= calendarData.daysInMonth ? d : null;
  });

  const meetingsByDay = useMemo(() => {
    const map: Record<number, MeetingItem[]> = {};
    monthMeetings?.forEach(m => {
      const d = new Date(m.scheduledAt).getDate();
      if (!map[d]) map[d] = [];
      map[d].push(m);
    });
    return map;
  }, [monthMeetings]);

  const handleGoToday = () => {
    const now = new Date();
    setCurrentDate(now);
    setSelectedDay(now.getDate());
  };

  const selectedDayMeetings = selectedDay ? meetingsByDay[selectedDay] || [] : [];

  const [yearInput, setYearInput] = useState(calendarData.year.toString());

  useEffect(() => {
    setYearInput(calendarData.year.toString());
  }, [calendarData.year]);

  const handleYearChange = (valStr: string) => {
    setYearInput(valStr);
    const val = parseInt(valStr);
    if (!isNaN(val) && val >= 1000 && val < 3000) {
      setCurrentDate(new Date(val, calendarData.month, 1));
    }
  };

  return (
    <div className="relative flex flex-col lg:flex-row gap-6 max-w-[1400px] min-h-[80vh]">
      <div className={`flex-1 space-y-6 transition-all duration-300 ${sidebarOpen ? "lg:mr-[350px]" : ""}`}>
        {/* Header section */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Agenda</h1>
            <p className="text-sm text-muted-foreground mt-1">Suivi de vos activités et rendez-vous immobiliers</p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          {/* Main Calendar Card */}
          <NeuCard className="xl:col-span-8">
            <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <div className="flex gap-1 mr-2">
                  <button 
                    onClick={() => setCurrentDate(new Date(calendarData.year, calendarData.month - 1, 1))} 
                    className="w-9 h-9 rounded-lg neu-sm hover:neu-pressable flex items-center justify-center transition-all"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button 
                    onClick={() => setCurrentDate(new Date(calendarData.year, calendarData.month + 1, 1))} 
                    className="w-9 h-9 rounded-lg neu-sm hover:neu-pressable flex items-center justify-center transition-all"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
                
                <div className="flex items-center gap-3">
                  <Select 
                    value={calendarData.month.toString()}
                    onValueChange={(val) => setCurrentDate(new Date(calendarData.year, parseInt(val), 1))}
                  >
                    <SelectTrigger className="w-[130px] border-none bg-transparent hover:bg-alice/20 font-bold text-lg shadow-none h-auto px-2 focus:ring-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {months.map((m, idx) => (
                        <SelectItem key={m} value={idx.toString()}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <div className="flex items-center gap-1 group">
                    <input 
                      type="number"
                      value={yearInput}
                      onChange={(e) => handleYearChange(e.target.value)}
                      onBlur={() => setYearInput(calendarData.year.toString())}
                      className="w-20 bg-transparent font-bold text-lg outline-none border-b-2 border-transparent focus:border-alice transition-all text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                </div>

                <button 
                  onClick={handleGoToday}
                  className="ml-2 px-3 py-1.5 text-xs font-semibold rounded-lg neu-sm hover:neu-pressable transition-all"
                >
                  Aujourd'hui
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {Object.entries(TYPE_COLORS).filter(([k]) => k !== 'default').map(([type, color]) => (
                  <div key={type} className="flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground">
                    <span className={`w-2 h-2 rounded-full ${color}`} /> {type}
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-7 gap-2 text-center text-[11px] uppercase font-black text-muted-foreground/40 mb-4 tracking-widest px-2">
              {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((d) => <div key={d}>{d}</div>)}
            </div>

            <div className="grid grid-cols-7 gap-2 md:gap-3">
              {days.map((d, i) => {
                const isToday = d === new Date().getDate() && calendarData.month === new Date().getMonth() && calendarData.year === new Date().getFullYear();
                const mList = d ? meetingsByDay[d] || [] : [];
                const isSel = selectedDay === d;
                
                const isPast = d ? new Date(calendarData.year, calendarData.month, d) < new Date(new Date().setHours(0,0,0,0)) : false;

                return (
                  <button
                    key={i}
                    disabled={!d}
                    onClick={() => {
                      if (d) {
                        setSelectedDay(d);
                        setSidebarOpen(true);
                      }
                    }}
                    className={`aspect-square rounded-2xl flex flex-col items-center justify-center relative transition-all duration-200 border-2 ${
                      d ? "neu-sm hover:scale-105 cursor-pointer border-transparent" : "opacity-0 pointer-events-none"
                    } ${isToday ? "border-eerie/20 shadow-inner" : ""} ${isSel ? "neu-inset border-eerie font-bold scale-105" : ""}`}
                  >
                    {d && (
                      <span className={`text-base ${isToday ? "text-eerie font-black" : isSel ? "text-eerie" : "text-muted-foreground/80"}`}>
                        {d}
                      </span>
                    )}
                    
                    {d && mList.length > 0 && (
                      <div className="absolute bottom-2.5 flex gap-1 justify-center w-full px-1">
                        {mList.slice(0, 3).map((m, idx) => (
                           <span 
                            key={m.idMeeting} 
                            className={`w-1.5 h-1.5 rounded-full ${isPast ? "bg-slate-300" : TYPE_DOTS[m.type] || TYPE_DOTS.default}`} 
                            title={m.type}
                           />
                        ))}
                        {mList.length > 3 && <span className="text-[8px] leading-none text-muted-foreground font-bold">+{mList.length - 3}</span>}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </NeuCard>

          {/* This Week / Up next on large screens if sidebar closed */}
          <div className="xl:col-span-4 space-y-6">
            <NeuCard className="h-full flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-bold text-lg flex items-center gap-2">
                   <CalendarIcon size={18} className="text-muted-foreground" />
                   Cette semaine
                </h2>
                {loadingWeek && <Loader2 size={16} className="animate-spin text-muted-foreground" />}
              </div>
              <div className="space-y-4 flex-1 overflow-y-auto max-h-[600px] pr-2 custom-scrollbar">
                {loadingWeek ? (
                  <div className="py-20 text-center"><Loader2 className="animate-spin mx-auto opacity-20" size={40} /></div>
                ) : !weekMeetings || weekMeetings.length === 0 ? (
                  <div className="py-20 text-center text-sm text-muted-foreground italic flex flex-col items-center gap-3">
                    <Clock size={32} className="opacity-10" />
                    Aucun rendez-vous planifié
                  </div>
                ) : (
                  weekMeetings.map((e) => (
                    <div
                      key={e.idMeeting}
                      className="group w-full text-left p-4 neu-sm rounded-2xl hover:neu-pressable transition-all border-l-4 border-transparent"
                      style={{ borderLeftColor: isPast(e.scheduledAt) ? '#cbd5e1' : getHexColor(e.type) }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-black uppercase tracking-tighter text-muted-foreground">
                          {new Date(e.scheduledAt).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}
                        </span>
                        <SoftBadge tone={getTypeTone(e.type)} className="text-[9px] px-1.5">{e.type}</SoftBadge>
                      </div>
                      <div className="text-sm font-bold text-eerie group-hover:translate-x-1 transition-transform">{e.clientFullName}</div>
                      <div className="flex items-center justify-between mt-3 text-[11px] text-muted-foreground font-medium">
                        <span className="flex items-center gap-1.5"><Clock size={12} /> {new Date(e.scheduledAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                        {e.propertyAddress && <span className="flex items-center gap-1.5 max-w-[140px] truncate"><MapPin size={12} /> {e.propertyAddress}</span>}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </NeuCard>
          </div>
        </div>
      </div>

      {/* RIGHT SIDEBAR (Drawer) */}
      <div 
        className={`fixed inset-y-0 right-0 w-full sm:w-[380px] bg-ghost border-l border-border/50 shadow-2xl z-50 transform transition-transform duration-500 ease-out p-6 flex flex-col ${sidebarOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-xl font-bold">Rendez-vous du jour</h3>
            <p className="text-sm text-muted-foreground">
              {selectedDay && `${selectedDay} ${months[calendarData.month]} ${calendarData.year}`}
            </p>
          </div>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="p-2 rounded-xl neu-sm hover:neu-pressable"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 pr-1 custom-scrollbar">
          {selectedDayMeetings.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-10 opacity-40">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                <CalendarIcon size={32} />
              </div>
              <p className="text-sm font-medium italic">Journée libre</p>
              <p className="text-xs">Aucun événement prévu.</p>
            </div>
          ) : (
            selectedDayMeetings.map((m) => (
              <NeuCard key={m.idMeeting} size="sm" className="space-y-4 border-l-4" style={{ borderLeftColor: getHexColor(m.type) }}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${TYPE_COLORS[m.type] || TYPE_COLORS.default}`}>
                      <Clock size={16} />
                    </div>
                    <div>
                      <div className="text-sm font-bold">
                        {new Date(m.scheduledAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div className="text-[10px] font-bold text-muted-foreground uppercase">{m.type}</div>
                    </div>
                  </div>
                  <SoftBadge tone={m.status === 'COMPLETED' ? 'success' : 'info'} className="text-[9px]">
                    {m.status === 'COMPLETED' ? 'Terminé' : 'Prévu'}
                  </SoftBadge>
                </div>

                <div className="flex items-center gap-3 bg-alice/30 p-2.5 rounded-xl">
                  <div className="w-8 h-8 rounded-full bg-eerie/5 flex items-center justify-center font-bold text-xs">
                    {m.clientFullName.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold truncate">{m.clientFullName}</div>
                    <div className="text-[10px] text-muted-foreground truncate">{m.propertyAddress || "Lieu non spécifié"}</div>
                  </div>
                  <Link 
                    to="/agent/dossier"
                    search={{ id: m.idDeal }}
                    className="p-2 rounded-lg bg-ghost hover:bg-white transition-colors"
                    title="Voir le dossier"
                  >
                    <ExternalLink size={14} className="text-eerie" />
                  </Link>
                </div>
              </NeuCard>
            ))
          )}
        </div>

        <div className="mt-8 pt-6 border-t text-center">
          <p className="text-xs text-muted-foreground italic">
            La planification se fait dans les dossiers clients.
          </p>
        </div>
      </div>

      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/5 backdrop-blur-[2px] z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}

// Helpers
function getTypeTone(type: string): "success" | "info" | "warn" | "danger" {
  if (type === "Visite") return "success";
  if (type === "Appel") return "info";
  if (type === "RDV Agence") return "danger";
  if (type === "Signature") return "warn";
  return "info";
}

function getHexColor(type: string): string {
  if (type === "Visite") return "#CFDECA"; // Honeydew
  if (type === "Appel") return "#D8DFE9"; // Alice Blue
  if (type === "RDV Agence") return "#E6E6FA"; // Lavender
  if (type === "Signature") return "#EFF0A3"; // Vanilla
  return "#e2e8f0"; // Slate-200
}

function isPast(dateStr: string): boolean {
  return new Date(dateStr) < new Date(new Date().setHours(0,0,0,0));
}
