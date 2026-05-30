import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/app-shell";
import { Home, Building2, FileText, History, Bot, Calendar, FileSignature, Folder } from "lucide-react";
import { useClientData } from "@/hooks/use-client-data";

const nav = [
  { to: "/client", label: "Accueil", icon: Home },
  { to: "/client/dossiers", label: "Mes dossiers", icon: Folder },
  { to: "/client/proprietes", label: "Mes propriétés", icon: Building2 },
  { to: "/client/documents", label: "Mes documents", icon: FileText },
  { to: "/client/rendez-vous", label: "Rendez-vous", icon: Calendar },
  { to: "/client/contrats", label: "Mes contrats", icon: FileSignature },
  { to: "/client/chronologie", label: "Chronologie", icon: History },
  { to: "/client/assistant", label: "Assistant IA", icon: Bot },
];

export const Route = createFileRoute("/client")({
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
