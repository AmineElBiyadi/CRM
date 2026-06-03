import { AppShell } from "@/components/layout/app-shell";
import { LayoutDashboard, Users, FolderOpen, Search, CalendarDays } from "lucide-react";
import { ensureAuthenticated, getUser } from "@/lib/auth";
import { createFileRoute, redirect } from "@tanstack/react-router";

const nav = [
  { to: "/agent", label: "Dashboard", icon: LayoutDashboard },
  { to: "/agent/clients", label: "Clients", icon: Users },
  { to: "/agent/dossiers", label: "Mes Dossiers", icon: FolderOpen },
  { to: "/agent/recherche", label: "Recherche biens", icon: Search },
  { to: "/agent/agenda", label: "Rendez-vous", icon: CalendarDays },
];

export const Route = createFileRoute("/agent")({
  beforeLoad: async () => {
    const user = await ensureAuthenticated();

    if (!user) throw redirect({ to: "/login" });
    if (user.role !== "AGENT") throw redirect({ to: "/admin" });
  },
  component: AgentLayout,
});

function AgentLayout() {
  const user = getUser()!;

  return (
    <AppShell
      space="agent"
      spaceLabel="Espace Agent"
      user={{
        name: `${user.firstName} ${user.lastName}`,
        role: user.role,
      }}
      nav={nav}
      accent="bg-honeydew"
    />
  );
}
