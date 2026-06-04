import { createFileRoute, redirect } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/app-shell";
import { Home, FileText, Calendar, Folder } from "lucide-react";
import { useClientData } from "@/hooks/use-client-data";

const nav = [
  { to: "/client", label: "Accueil", icon: Home },
  { to: "/client/dossiers", label: "Mes dossiers", icon: Folder },
  { to: "/client/documents", label: "Mes documents", icon: FileText },
  { to: "/client/rendez-vous", label: "Rendez-vous", icon: Calendar },
];

export const Route = createFileRoute("/client")({
  beforeLoad: () => {
    const token = localStorage.getItem('token');
    if (!token) {
      throw redirect({
        to: '/login',
      });
    }
  },
  component: ClientLayout,
});

function ClientLayout() {
  const { data, isLoading } = useClientData();

  const user = {
    name: data?.profile ? `${data.profile.firstName} ${data.profile.lastName}` : "Chargement...",
    role: "Client",
  };

  return (
    <AppShell
      space="client"
      spaceLabel="Espace Client"
      user={user}
      nav={nav}
      accent="bg-vanilla"
    />
  );
}
