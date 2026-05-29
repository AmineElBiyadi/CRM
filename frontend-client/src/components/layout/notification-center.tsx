import { useState } from "react";
import { cn } from "@/lib/utils";
import { Bell, Check, X, Info, Calendar, FileText, Trash2, Loader2, Sparkles } from "lucide-react";
import { Avatar, SoftBadge } from "@/components/ui/design-bits";
import { toast } from "sonner";

export type NotificationType = "GENERAL" | "DOCUMENT" | "MEETING" | "ACTION";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  time: string;
  read: boolean;
  priority?: "low" | "medium" | "high";
}

interface NotificationCenterProps {
  notifications: Notification[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onClear: () => void;
}

const typeIcons: Record<NotificationType, any> = {
  GENERAL: Info,
  DOCUMENT: FileText,
  MEETING: Calendar,
  ACTION: Sparkles,
};

const categories = [
  { id: "ALL", label: "Tout" },
  { id: "ACTION", label: "Actions" },
  { id: "MEETING", label: "RDV" },
  { id: "DOCUMENT", label: "Docs" },
];

export function NotificationCenter({ notifications, onMarkRead, onMarkAllRead, onClear }: NotificationCenterProps) {
  const [activeTab, setActiveTab] = useState("ALL");
  const [isOpen, setIsOpen] = useState(false);

  const filtered = notifications.filter(n => activeTab === "ALL" || n.type === activeTab);
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "relative w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-300",
          isOpen ? "neu-inset text-eerie" : "neu-sm hover:neu-pressable text-muted-foreground hover:text-eerie"
        )}
        aria-label="Notifications"
      >
        <Bell size={20} strokeWidth={1.5} className={cn(unreadCount > 0 && "animate-pulse")} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[20px] h-[20px] px-1.5 rounded-full bg-eerie text-ghost text-[10px] font-bold flex items-center justify-center ring-4 ring-ghost overflow-hidden">
            <span className="relative z-10">{unreadCount}</span>
            <span className="absolute inset-0 bg-vanilla/20 animate-ping" />
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-4 w-[360px] sm:w-[420px] z-50 animate-in fade-in zoom-in-95 duration-200">
            <div className="rounded-[2rem] shadow-2xl border border-border/80 overflow-hidden bg-ghost ring-1 ring-black/5">
              {/* Header */}
              <div className="px-6 py-5 border-b border-border/50 bg-alice/20">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-eerie flex items-center gap-2">
                      Notifications
                      {unreadCount > 0 && <SoftBadge tone="info" className="text-[10px] py-0">{unreadCount}</SoftBadge>}
                    </h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Vos mises à jour en direct</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={onMarkAllRead}
                      className="p-2 rounded-xl neu-sm hover:neu-pressable text-muted-foreground hover:text-eerie transition-colors"
                      title="Tout marquer comme lu"
                    >
                      <Check size={16} />
                    </button>
                    <button 
                      onClick={onClear}
                      className="p-2 rounded-xl neu-sm hover:neu-pressable text-muted-foreground hover:text-destructive transition-colors"
                      title="Tout effacer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Categories */}
                <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setActiveTab(cat.id)}
                      className={cn(
                        "px-4 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap",
                        activeTab === cat.id 
                          ? "bg-eerie text-ghost" 
                          : "neu-sm hover:bg-alice/40 text-muted-foreground"
                      )}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* List */}
              <div className="max-h-[70vh] overflow-y-auto soft-scroll p-2 divide-y divide-border/30">
                {filtered.map((n) => {
                  const Icon = typeIcons[n.type];
                  return (
                    <div
                      key={n.id}
                      onClick={() => {
                        onMarkRead(n.id);
                        toast(n.title);
                      }}
                      className={cn(
                        "group relative w-full text-left p-4 rounded-2xl transition-all duration-300 hover:bg-alice/20 flex gap-4 cursor-pointer",
                        !n.read && "bg-vanilla/5"
                      )}
                    >
                      <div className={cn(
                        "w-12 h-12 rounded-xl shrink-0 flex items-center justify-center transition-transform group-hover:scale-110",
                        n.read ? "bg-ghost/50 text-muted-foreground" : "bg-vanilla/15 text-eerie"
                      )}>
                        <Icon size={20} strokeWidth={1.5} />
                      </div>
                      
                      <div className="flex-1 min-w-0 pr-2">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className={cn("text-sm font-bold truncate transition-colors", !n.read ? "text-eerie" : "text-muted-foreground/80")}>
                            {n.title}
                          </h4>
                          {!n.read && <div className="w-2 h-2 rounded-full bg-vanilla shrink-0 mt-1.5 shadow-[0_0_8px_rgba(0,0,0,0.1)]" />}
                        </div>
                        <p className={cn("text-xs line-clamp-2 mt-1 leading-relaxed", !n.read ? "text-eerie/80" : "text-muted-foreground")}>
                          {n.body}
                        </p>
                        <div className="flex items-center justify-between mt-3">
                          <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{n.time}</span>
                          <button 
                            className="text-[10px] font-bold text-eerie opacity-0 group-hover:opacity-100 transition-opacity hover:underline"
                            onClick={(e) => { e.stopPropagation(); onMarkRead(n.id); }}
                          >
                            Détails
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                {filtered.length === 0 && (
                  <div className="py-20 flex flex-col items-center justify-center text-center px-8">
                    <div className="w-16 h-16 rounded-full bg-ghost/30 flex items-center justify-center mb-4 border border-dashed border-border/50">
                      <Bell size={24} className="text-muted-foreground/30" />
                    </div>
                    <p className="text-sm font-medium text-eerie">Aucune notification</p>
                    <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">Vous êtes à jour pour cette catégorie.</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-border/50 bg-ghost/30 flex justify-center">
                <button className="text-xs font-bold text-eerie hover:opacity-80 flex items-center gap-2">
                  Voir tout l'historique <Loader2 size={12} className="animate-spin opacity-0 group-hover:opacity-100" />
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
