import { useQuery } from "@tanstack/react-query";
import { dossierApi } from "@/api/dossierApi";

export function useDossiers() {
  return useQuery({
    queryKey: ["dossiers"],
    queryFn: dossierApi.getDossiers,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useDossier(id: string) {
  const { data: dossiers, ...rest } = useDossiers();
  
  const dossier = dossiers?.find((d: any) => d.idProfile === id);
  
  return {
    data: dossier,
    ...rest
  };
}

export function useDossierActivity(id: string) {
  return useQuery({
    queryKey: ["dossierActivity", id],
    queryFn: () => dossierApi.getDossierActivity(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}
