import { useQuery } from "@tanstack/react-query";
import axios from "axios";

const API_BASE_URL = "http://localhost:8081/api/public/client-portal";
export const HARDCODED_CLIENT_ID = "d755eba6-106f-4f81-af56-4e4d60f16840";

export interface ClientProfile {
  idClient: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  status: string;
  source: string;
  assignedAgentName: string;
}

export interface DossierDetail {
  idDeal: string;
  idProfile: string;
  clientName: string;
  clientType: "BUYER" | "SELLER";
  stage: string;
  aiLeadScore: number;
  aiScoreExplanation: string;
  aiRecommendedAction: string;
  aiSummary: string;
  isUrgent: boolean;
  budgetMin?: number;
  budgetMax?: number;
  preferredArea?: string;
  propertyTitle?: string;
  address?: string;
  city?: string;
  askingPrice?: number;
  propertySurfaceM2?: number;
  assignedAgentName: string;
  propertyImageUrls?: string[];
  lastInteractionAt: string;
}

export interface Interaction {
  idInteraction: string;
  type: string;
  description: string;
  occurredAt: string;
  durationMinutes: number;
  agentName: string;
}

export interface Meeting {
  idMeeting: string;
  scheduledAt: string;
  notesLogged: string;
  status: string;
  type: string;
}

export interface Document {
  idDocument: string;
  documentType: string;
  filePath: string;
  confirmedReceived: boolean;
  createdAt: string;
  dealId: string;
}

export interface Contract {
  idContract: string;
  agreedPrice: number;
  depositAmount: number;
  status: string;
  aiRiskSummary: string;
  createdAt: string;
}

export interface TimelineEvent {
  type: "INTERACTION" | "MEETING" | "DOCUMENT" | "CONTRACT" | "STAGE_UPDATE";
  title: string;
  description: string;
  date: string;
  agentName?: string;
  status?: string;
}

export interface ClientPortalData {
  profile: ClientProfile;
  dossiers: DossierDetail[];
  interactions: Interaction[];
  meetings: Meeting[];
  documents: Document[];
  contracts: Contract[];
  timeline: TimelineEvent[];
}

export function useClientData() {
  return useQuery<ClientPortalData>({
    queryKey: ["clientPortalData", HARDCODED_CLIENT_ID],
    queryFn: async () => {
      const { data } = await axios.get(`${API_BASE_URL}/${HARDCODED_CLIENT_ID}/full-data`);
      return data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
