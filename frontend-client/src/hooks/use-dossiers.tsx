import { useQuery } from "@tanstack/react-query";
// @ts-ignore
import { dossierApi } from "@/api/dossierApi";

export interface Dossier {
  idProfile: string;
  stage: string;
  propertyType: string;
  clientType: "BUYER" | "SELLER";
  isUrgent: boolean;
  assignedAgentName?: string;
  propertyCount: number;
  documentCount: number;
  meetingCount: number;
  aiLeadScore: number;
  [key: string]: any;
}

export function useDossiers() {
  return useQuery<Dossier[]>({
    queryKey: ["dossiers"],
    queryFn: dossierApi.getDossiers,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useDossier(id: string) {
  const { data: dossiers, ...rest } = useDossiers();
  
  const dossier = dossiers?.find((d) => d.idProfile === id);
  
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
