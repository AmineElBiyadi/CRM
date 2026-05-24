import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/app-shell";
import { useAgentDashboard } from "@/hooks/useDashboard";
import { LayoutDashboard, Users, FolderOpen, Search, CalendarDays } from "lucide-react";

const nav = [
  { to: "/agent", label: "Dashboard", icon: LayoutDashboard },
  { to: "/agent/clients", label: "Clients", icon: Users },
  { to: "/agent/dossiers", label: "Mes Dossiers", icon: FolderOpen },
  { to: "/agent/recherche", label: "Recherche biens", icon: Search },
  { to: "/agent/agenda", label: "Rendez-vous", icon: CalendarDays },
];

export const Route = createFileRoute("/agent")({
  component: AgentLayout,
});

function AgentLayout() {
  const { data } = useAgentDashboard();
  
  return (
    <AppShell
      space="agent"
      spaceLabel="Espace Agent"
      user={{ 
        name: data?.agentFullName || "Sara El Idrissi", 
        role: data?.agentRole || "Commercial" 
      }}
      nav={nav}
      accent="bg-honeydew"
    />
  );
}
