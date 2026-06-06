import { createFileRoute, redirect } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/app-shell";
import { LayoutDashboard, Users, KanbanSquare, BarChart3 } from "lucide-react";
import { ensureAuthenticated, getUser } from "@/lib/auth";

const nav = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/agents", label: "Agents", icon: Users },
  { to: "/admin/pipeline", label: "Pipeline", icon: KanbanSquare },
  { to: "/admin/analytics", label: "Analytique", icon: BarChart3 },
];

export const Route = createFileRoute("/admin")({
  beforeLoad: async () => {
    const user = await ensureAuthenticated();

    if (!user) throw redirect({ to: "/login" });
    if (user.role !== "ADMIN") throw redirect({ to: "/agent" });
  },
  component: AdminLayout,
});

function AdminLayout() {
  const user = getUser()!;

  return (
    <AppShell
      space="admin"
      spaceLabel="Espace Admin"
      user={{
        name: `${user.firstName} ${user.lastName}`,
        role: user.role,
      }}
      nav={nav}
      accent="bg-honeydew"
    />
  );
}
