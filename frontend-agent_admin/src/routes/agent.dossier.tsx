import { createFileRoute } from "@tanstack/react-router";
import { DossierDetailPage } from "@/components/dossier/DossierDetailPage";

type DossierSearch = {
  id?: string;
};

export const Route = createFileRoute("/agent/dossier")({
  validateSearch: (search: Record<string, unknown>): DossierSearch => ({
    id: search.id as string | undefined,
  }),
  component: AgentDossierPage,
});

function AgentDossierPage() {
  const { id } = Route.useSearch();
  return <DossierDetailPage dossierId={id} backTo="/agent/dossiers" />;
}
