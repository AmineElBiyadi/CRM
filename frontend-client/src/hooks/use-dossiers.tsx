import { useQuery } from "@tanstack/react-query";
import { dossierApi } from "@/api/dossierApi";

export interface Dossier {
  idDeal?: string;
  idProfile: string;
  idClient: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientType: "BUYER" | "SELLER";
  stage: string;
  aiLeadScore: number;
  aiScoreExplanation?: string;
  aiRecommendedAction?: string;
  aiSummary?: string;
  isUrgent: boolean;
  
  // Buyer specifics
  budgetMin?: number;
  budgetMax?: number;
  preferredArea?: string;
  preferredSizeM2?: number;
  preferredFloor?: number;
  propertyType?: string;

  // Seller specifics
  propertyTitle?: string;
  address?: string;
  city?: string;
  askingPrice?: number;
  propertySurfaceM2?: number;
  numRooms?: number;
  propertyFloor?: number;
  propertyImageUrls?: string[];

  assignedAgentName: string;
  assignedAgentPhone?: string;
  lastInteractionAt?: string;
  createdAt?: string;

  propertyCount: number;
  documentCount: number;
  meetingCount: number;

  properties?: any[];
  offers?: any[];
  meetings?: any[];
  contracts?: any[];
  documents?: any[];
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
