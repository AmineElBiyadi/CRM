import { Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Avatar, SoftBadge } from "@/components/ui/design-bits";
import { Bell, Search, Menu, X, LogOut, type LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { apiLogout, clearUser } from "@/lib/auth";
import {
  fetchNotifications,
  mapNotificationDto,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/api/notificationsApi";

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

interface AppShellProps {
  space: "admin" | "agent" | "client";
  spaceLabel: string;
  user: { name: string; role: string };
  nav: NavItem[];
  accent?: string;
}

type Notif = {
  id: string;
  title: string;
  body: string;
  time: string;
  read: boolean;
  senderName?: string;
};

const NOTIF_POLL_MS = 30_000;

export function AppShell({ space, spaceLabel, user, nav, accent = "bg-vanilla" }: AppShellProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [notifsLoading, setNotifsLoading] = useState(false);
  const usesLiveNotifications = space === "admin" || space === "agent";
  const unread = notifs.filter((n) => !n.read).length;

  const loadNotifications = useCallback(async () => {
    if (!usesLiveNotifications) {
      setNotifs([]);
      return;
    }
    setNotifsLoading(true);
    try {
      const list = await fetchNotifications();
      setNotifs(list.map(mapNotificationDto));
    } catch {
      setNotifs([]);
    } finally {
      setNotifsLoading(false);
    }
  }, [usesLiveNotifications]);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await apiLogout();
      toast.success("Vous êtes déconnecté.");
    } catch {
      clearUser();
      toast.error("Session locale effacée.");
    } finally {
      localStorage.removeItem("token");
      setLoggingOut(false);
      setOpen(false);
      navigate({ to: "/login" });
    }
  };

  useEffect(() => {
    setNotifOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!usesLiveNotifications) {
      setNotifs([]);
      return;
    }
    loadNotifications();
    const interval = setInterval(loadNotifications, NOTIF_POLL_MS);
    return () => clearInterval(interval);
  }, [usesLiveNotifications, loadNotifications]);

  async function handleMarkAllRead() {
    try {
      await markAllNotificationsRead();
      setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
      toast.success("Tout marqué comme lu");
    } catch {
      toast.error("Impossible de marquer les notifications comme lues.");
    }
  }

  async function handleMarkOneRead(n: Notif) {
    if (n.read) return;
    try {
      await markNotificationRead(n.id);
      setNotifs((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
    } catch {
      toast.error("Impossible de mettre à jour la notification.");
    }
  }

  const SidebarContent = (
    <>
      <div className="flex items-center gap-3">
        <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center neu-sm", accent)}>
          <span className="font-bold text-eerie">S</span>
        </div>
        <div>
          <div className="font-bold leading-tight">SmartEstate</div>
          <div className="text-xs text-muted-foreground">{spaceLabel}</div>
        </div>
      </div>

      <nav className="flex flex-col gap-2">
        {nav.map((item) => {
          const active =
            location.pathname === item.to ||
            (item.to !== `/${space}` && location.pathname.startsWith(item.to));
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                active ? "neu-inset text-eerie" : "text-muted-foreground hover:text-eerie hover:bg-alice/40"
              )}
            >
              <Icon size={18} strokeWidth={1.8} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-3">
        <div className="neu-sm p-3 flex items-center gap-3">
          <Avatar name={user.name} size={36} />
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold truncate">{user.name}</div>
            <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">{user.role}</div>
          </div>
        </div>
        <div className="flex gap-2 text-xs">
          <Link to="/design-system" className="flex-1 text-center py-2 rounded-lg neu-sm hover:neu-pressable transition-all">
            Design
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg neu-sm hover:neu-pressable transition-all text-muted-foreground hover:text-eerie disabled:opacity-60"
          >
            <LogOut size={14} />
            {loggingOut ? "…" : "Déconnexion"}
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex bg-ghost">
      <aside className="hidden lg:flex w-64 shrink-0 p-6 flex-col gap-8 sticky top-0 h-screen">
        {SidebarContent}
      </aside>

      {open && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-eerie/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <aside className="relative w-72 bg-ghost h-full p-6 flex flex-col gap-8 animate-in slide-in-from-left">
            <button
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 w-9 h-9 rounded-lg neu-sm flex items-center justify-center"
              aria-label="Fermer le menu"
            >
              <X size={16} />
            </button>
            {SidebarContent}
          </aside>
        </div>
      )}

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-16 md:h-20 px-4 md:px-8 flex items-center gap-3 md:gap-4 sticky top-0 z-20 glass rounded-none border-x-0 border-t-0">
          <button
            onClick={() => setOpen(true)}
            className="lg:hidden w-10 h-10 rounded-full neu-sm flex items-center justify-center shrink-0"
            aria-label="Ouvrir le menu"
          >
            <Menu size={18} />
          </button>
          <div className="flex-1 max-w-xl">
            <div className="relative">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                placeholder="Rechercher…"
                className="w-full pl-11 pr-4 py-2.5 rounded-full neu-inset bg-transparent text-sm focus:outline-none"
              />
            </div>
          </div>
          <div className="relative ml-auto">
            <button
              onClick={() => {
                const next = !notifOpen;
                setNotifOpen(next);
                if (next && usesLiveNotifications) loadNotifications();
              }}
              className="relative w-10 h-10 rounded-full neu-sm flex items-center justify-center hover:neu-pressable shrink-0"
              aria-label="Notifications"
            >
              <Bell size={18} />
              {unread > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-eerie text-ghost text-[10px] font-bold flex items-center justify-center ring-2 ring-ghost">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </button>
            {notifOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setNotifOpen(false)} />
                <div className="absolute right-0 mt-2 w-[340px] sm:w-[380px] z-40 bg-ghost rounded-2xl shadow-2xl border border-border overflow-hidden">
                  <div className="px-4 py-3 flex items-center justify-between border-b border-border">
                    <div>
                      <div className="font-semibold text-sm">Notifications</div>
                      <div className="text-[11px] text-muted-foreground">
                        {notifsLoading ? "Chargement…" : `${unread} non lue(s)`}
                      </div>
                    </div>
                    {usesLiveNotifications && unread > 0 && (
                      <button
                        type="button"
                        onClick={handleMarkAllRead}
                        className="text-xs text-eerie hover:underline font-medium"
                      >
                        Tout lire
                      </button>
                    )}
                  </div>
                  <div className="max-h-[60vh] overflow-y-auto soft-scroll divide-y divide-border">
                    {notifs.map((n) => (
                      <button
                        key={n.id}
                        type="button"
                        onClick={() => handleMarkOneRead(n)}
                        className={cn(
                          "w-full text-left px-4 py-3 hover:bg-alice/30 transition-colors flex gap-3",
                          !n.read && "bg-alice/20"
                        )}
                      >
                        <div className={cn("w-2 h-2 rounded-full mt-1.5 shrink-0", n.read ? "bg-muted" : "bg-vanilla")} />
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium truncate">{n.title}</div>
                          <div className="text-xs text-muted-foreground line-clamp-2">{n.body}</div>
                          <div className="text-[10px] text-muted-foreground mt-1 flex flex-wrap gap-x-2">
                            {n.senderName ? <span>De : {n.senderName}</span> : null}
                            <span>{n.time}</span>
                          </div>
                        </div>
                      </button>
                    ))}
                    {!notifsLoading && notifs.length === 0 && (
                      <div className="text-center text-xs text-muted-foreground py-8 px-4">
                        {usesLiveNotifications
                          ? "Aucune notification pour le moment."
                          : "Notifications non disponibles dans cet espace."}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8 soft-scroll">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
