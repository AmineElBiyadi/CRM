import { Link, Outlet, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Avatar, SoftBadge } from "@/components/ui/design-bits";
import { LogOut, Bell, Search, Menu, X, type LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { NotificationCenter } from "./notification-center";

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

type Notif = { id: string; title: string; body: string; time: string; read: boolean };

const NOTIFS_BY_SPACE: Record<AppShellProps["space"], Notif[]> = {
  admin: [
    { id: "n1", title: "Nouveau lead chaud", body: "Karim Benchekroun a été qualifié chaud par Sara.", time: "il y a 5 min", read: false },
    { id: "n2", title: "Objectif mensuel à 80%", body: "Plus que 3 closings pour atteindre l'objectif équipe.", time: "il y a 1h", read: false },
    { id: "n3", title: "Anas Filali inactif", body: "Aucune activité depuis 14 jours.", time: "hier", read: false },
    { id: "n4", title: "Rapport hebdo prêt", body: "Le rapport de la semaine est disponible dans Analytique.", time: "il y a 2j", read: true },
  ],
  agent: [
    { id: "n1", title: "RDV demain 10h", body: "Visite Anfa avec Mme Idrissi — Résidence Al Manar.", time: "il y a 12 min", read: false },
    { id: "n2", title: "Document reçu", body: "Karim a déposé sa pièce d'identité.", time: "il y a 1h", read: false },
    { id: "n3", title: "Recommandation IA", body: "3 biens correspondent au profil de Leila Tazi.", time: "il y a 3h", read: false },
    { id: "n4", title: "Compromis signé", body: "Omar Slaoui a signé le compromis.", time: "hier", read: true },
  ],
  client: [
    { id: "n1", title: "Nouvelle proposition", body: "Sara vous a proposé un duplex à Gauthier.", time: "il y a 20 min", read: false },
    { id: "n2", title: "RDV confirmé", body: "Visite vendredi à 15h, Résidence Al Manar.", time: "il y a 2h", read: false },
    { id: "n3", title: "Document à signer", body: "Mandat de recherche en attente de signature.", time: "hier", read: true },
  ],
};

function initialNotifs(space: AppShellProps["space"]): Notif[] {
  return NOTIFS_BY_SPACE[space];
}

export function AppShell({ space, spaceLabel, user, nav, accent = "bg-vanilla" }: AppShellProps) {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifs, setNotifs] = useState(() => initialNotifs(space));
  const unread = notifs.filter((n) => !n.read).length;

  const handleLogout = () => {
    localStorage.removeItem("client_id"); // Supprimer l'ID client du localStorage
    window.location.href = "/"; // Rediriger vers la page d'accueil
  };

  useEffect(() => {
    setNotifOpen(false);
  }, [location.pathname]);

  const SidebarContent = (
    <>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 flex items-center justify-center">
          <img 
            src="https://res.cloudinary.com/dam3isgtd/image/upload/v1780656617/logo-rawabet-rmv_eun7jl.png" 
            alt="Rawabet Logo" 
            className="w-full h-full object-contain"
          />
        </div>
        <div>
          <div className="font-bold leading-tight">Rawabet</div>
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
        <Link 
          to="/client/profil"
          className={cn(
            "p-3 flex items-center gap-3 rounded-2xl transition-all group",
            location.pathname === "/client/profil" ? "neu-inset" : "neu-sm hover:neu-pressable"
          )}
        >
          <Avatar name={user.name} size={36} />
          <div className="min-w-0 flex-1">
            <div className="text-sm font-bold truncate group-hover:text-eerie transition-colors tracking-tight">{user.name}</div>
            <div className="text-[10px] text-muted-foreground/70 uppercase font-bold tracking-widest">{user.role}</div>
          </div>
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl neu-sm hover:neu-pressable transition-all text-xs font-bold text-destructive"
        >
          <LogOut size={16} /> Déconnexion
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex bg-ghost">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 shrink-0 p-6 flex-col gap-8 sticky top-0 h-screen">
        {SidebarContent}
      </aside>

      {/* Mobile drawer */}
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

      {/* Main */}
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
          <div className="relative">
          <NotificationCenter
            notifications={notifs.map(n => ({
              ...n,
              type: n.id === "n2" ? "MEETING" : (n.id === "n3" ? "DOCUMENT" : "GENERAL") as any
            }))}
            onMarkRead={(id) => setNotifs(p => p.map(n => n.id === id ? { ...n, read: true } : n))}
            onMarkAllRead={() => {
              setNotifs(p => p.map(n => ({ ...n, read: true })));
              toast.success("Tout marqué comme lu");
            }}
            onClear={() => {
              setNotifs([]);
              toast.info("Notifications effacées");
            }}
          />
          </div>
          <div className={cn("hidden sm:block px-3 py-1.5 rounded-full text-[10px] uppercase font-black tracking-widest", accent, "text-eerie")}>
            {user.role}
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8 soft-scroll">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
