import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/app-shell";
import { LayoutDashboard, Users, KanbanSquare, Workflow, BarChart3 } from "lucide-react";

const nav = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/agents", label: "Agents", icon: Users },
  { to: "/admin/pipeline", label: "Pipeline", icon: KanbanSquare },
  { to: "/admin/automations", label: "Automatisations", icon: Workflow },
  { to: "/admin/analytics", label: "Analytique", icon: BarChart3 },
];

export const Route = createFileRoute("/admin")({
  component: () => (
    <AppShell
      space="admin"
      spaceLabel="Espace Admin"
      user={{ name: "Rachid Alami", role: "Directeur" }}
      nav={nav}
      accent="bg-alice"
    />
  ),
});
