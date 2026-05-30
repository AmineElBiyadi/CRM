import { useQuery } from "@tanstack/react-query";
import { dossierApi } from "@/api/dossierApi";

export function useDossiers() {
  return useQuery({
    queryKey: ["dossiers"],
    queryFn: dossierApi.getDossiers,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useDossierActivity(idFolder: string) {
  return useQuery({
    queryKey: ["dossierActivity", idFolder],
    queryFn: () => dossierApi.getDossierActivity(idFolder),
    enabled: !!idFolder,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}
