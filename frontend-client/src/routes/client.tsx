import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/app-shell";
import { Home, Building2, FileText, History, Bot } from "lucide-react";

const nav = [
  { to: "/client", label: "Accueil", icon: Home },
  { to: "/client/proprietes", label: "Mes propriétés", icon: Building2 },
  { to: "/client/documents", label: "Mes documents", icon: FileText },
  { to: "/client/chronologie", label: "Chronologie", icon: History },
  { to: "/client/assistant", label: "Assistant IA", icon: Bot },
];

export const Route = createFileRoute("/client")({
  component: () => (
    <AppShell
      space="client"
      spaceLabel="Espace Client"
      user={{ name: "Karim Benchekroun", role: "Client" }}
      nav={nav}
      accent="bg-vanilla"
    />
  ),
});
