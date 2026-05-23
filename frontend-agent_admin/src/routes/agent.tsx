import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/app-shell";
import { LayoutDashboard, Users, FolderOpen, Search, CalendarDays } from "lucide-react";

const nav = [
  { to: "/agent", label: "Dashboard", icon: LayoutDashboard },
  { to: "/agent/clients", label: "Clients", icon: Users },
  { to: "/agent/dossier", label: "Dossier client", icon: FolderOpen },
  { to: "/agent/recherche", label: "Recherche biens", icon: Search },
  { to: "/agent/agenda", label: "Rendez-vous", icon: CalendarDays },
];

export const Route = createFileRoute("/agent")({
  component: () => (
    <AppShell
      space="agent"
      spaceLabel="Espace Agent"
      user={{ name: "Sara El Idrissi", role: "Commercial" }}
      nav={nav}
      accent="bg-honeydew"
    />
  ),
});
