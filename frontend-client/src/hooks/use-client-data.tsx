import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

const API_BASE_URL = "http://localhost:8081/api/public/client-portal";

const getClientId = () => localStorage.getItem("client_id") || "d755eba6-106f-4f81-af56-4e4d60f16840";

export interface ClientProfile {
  idClient: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  status: string;
  source: string;
  assignedAgentName: string;
  createdAt: string;
  updatedAt: string;
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
  visitStatus?: "VISITED" | "VISIT_PLANNED" | "PROPOSED";
  clientFriendlyAction?: string;
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
  const clientId = getClientId();
  return useQuery<ClientPortalData>({
    queryKey: ["clientPortalData", clientId],
    queryFn: async () => {
      const { data } = await axios.get(`${API_BASE_URL}/${clientId}/full-data`);
      return data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const clientId = getClientId();
  return useMutation({
    mutationFn: async (dto: { firstName?: string; lastName?: string; email?: string; phone?: string }) => {
      const response = await axios.put(`${API_BASE_URL}/${clientId}/profile`, dto);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientPortalData", clientId] });
    },
  });
}

export function useUpdatePassword() {
  const clientId = getClientId();
  return useMutation({
    mutationFn: async (dto: { oldPassword?: string; newPassword: string }) => {
      const response = await axios.put(`${API_BASE_URL}/${clientId}/password`, dto);
      return response.data;
    },
  });
}
