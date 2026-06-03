import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { DossierDetailPage } from "@/components/dossier/DossierDetailPage";
import { AdminDossierExtras } from "@/components/dossier/AdminDossierExtras";
import { fetchDossierDetail } from "@/api/dossiersApi";

type DossierSearch = {
  id?: string;
};

export const Route = createFileRoute("/admin/dossier")({
  validateSearch: (search: Record<string, unknown>): DossierSearch => ({
    id: search.id as string | undefined,
  }),
  component: AdminDossierPage,
});

function AdminDossierPage() {
  const { id } = Route.useSearch();

  const { data: dossier } = useQuery({
    queryKey: ["dossier", id],
    queryFn: () => fetchDossierDetail(id!),
    enabled: !!id && id !== "null",
  });

  return (
    <DossierDetailPage
      dossierId={id}
      backTo="/admin/pipeline"
      isAdmin={true}
      extras={dossier ? <AdminDossierExtras dossier={dossier} /> : null}
    />
  );
}
