import { createFileRoute } from "@tanstack/react-router";
import { DossierDetailPage } from "@/components/dossier/DossierDetailPage";

type DossierSearch = {
  id?: string;
  from?: string;
};

export const Route = createFileRoute("/agent/dossier")({
  validateSearch: (search: Record<string, unknown>): DossierSearch => ({
    id: search.id as string | undefined,
    from: search.from as string | undefined,
  }),
  component: AgentDossierPage,
});

function AgentDossierPage() {
  const { id, from } = Route.useSearch();

  return (
    <DossierDetailPage
      dossierId={id}
      backTo={from || "/agent/dossiers"}
      isAdmin={false}
    />
  );
}
