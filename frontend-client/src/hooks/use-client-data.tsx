import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

const API_BASE_URL = "http://localhost:8081/api/public/client-portal";

const getClientId = () => localStorage.getItem("client_id") || "d755eba6-106f-4f81-af56-4e4d60f16840";

// Configure axios for use-client-data
const clientPortalAxios = axios.create({
  withCredentials: true,
});

clientPortalAxios.interceptors.request.use((config) => {
  const clientId = getClientId();
  if (clientId) {
    config.headers["X-Client-Id"] = clientId;
  }
  return config;
});

export interface ClientProfile {
  idClient: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  status: string;
  source: string;
  assignedAgentName: string;
  assignedAgentPhone?: string;
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
  documents?: Document[];
  contracts?: Contract[];
  offers?: any[];
  meetings?: any[];
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
  status: string;
  agreedPrice: number;
  depositAmount: number;
  aiRiskSummary?: string;
  createdAt: string;
  pdfUrl?: string;
  dealId: string;
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
  propertyAddress: string;
  reminder1hSent: boolean;
  reminder24hSent: boolean;
  status: string;
  type: string;
}

export function useMeetingActions() {
  const queryClient = useQueryClient();
  const clientId = getClientId();

  const accept = useMutation({
    mutationFn: async (meetingId: string) => {
      await clientPortalAxios.put(`${API_BASE_URL}/${clientId}/meetings/${meetingId}/accept`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientPortalData", clientId] });
    },
  });

  const reschedule = useMutation({
    mutationFn: async ({ meetingId, newDate, reason }: { meetingId: string; newDate: string; reason: string }) => {
      await clientPortalAxios.put(`${API_BASE_URL}/${clientId}/meetings/${meetingId}/reschedule`, { newDate, reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientPortalData", clientId] });
    },
  });

  const cancel = useMutation({
    mutationFn: async ({ meetingId, reason }: { meetingId: string; reason: string }) => {
      await clientPortalAxios.put(`${API_BASE_URL}/${clientId}/meetings/${meetingId}/cancel`, { reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientPortalData", clientId] });
    },
  });

  return { accept, reschedule, cancel };
}

export function useOfferActions() {
  const queryClient = useQueryClient();
  const clientId = getClientId();

  const accept = useMutation({
    mutationFn: async (offerId: string) => {
      await clientPortalAxios.put(`${API_BASE_URL}/${clientId}/offers/${offerId}/accept`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientPortalData", clientId] });
    },
  });

  const reject = useMutation({
    mutationFn: async (offerId: string) => {
      await clientPortalAxios.put(`${API_BASE_URL}/${clientId}/offers/${offerId}/reject`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientPortalData", clientId] });
    },
  });

  const withdraw = useMutation({
    mutationFn: async (offerId: string) => {
      await clientPortalAxios.put(`${API_BASE_URL}/${clientId}/offers/${offerId}/withdraw`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientPortalData", clientId] });
    },
  });

  return { accept, reject, withdraw };
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
      const { data } = await clientPortalAxios.get(`${API_BASE_URL}/${clientId}/full-data`);
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
      const response = await clientPortalAxios.put(`${API_BASE_URL}/${clientId}/profile`, dto);
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
      const response = await clientPortalAxios.put(`${API_BASE_URL}/${clientId}/password`, dto);
      return response.data;
    },
  });
}
