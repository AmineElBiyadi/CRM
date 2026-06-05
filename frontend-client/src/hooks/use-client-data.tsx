import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

const API_BASE_URL = "/api/client/portal";

// Configure axios for use-client-data
const clientPortalAxios = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

clientPortalAxios.interceptors.request.use((config) => {
  // Support for CSRF token from cookies
  const csrfToken = document.cookie
    .split('; ')
    .find(row => row.startsWith('csrf_token='))
    ?.split('=')[1];
    
  if (csrfToken && config.method !== 'get') {
    config.headers['X-CSRF-Token'] = csrfToken;
  }

  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
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
  googleLinked: boolean;
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
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery<ClientPortalData>({
    queryKey: ["clientPortalData"],
    queryFn: async () => {
      const { data } = await clientPortalAxios.get("/full-data");
      return data;
    },
    retry: 1,
  });

  const updateProfile = useMutation({
    mutationFn: async (dto: { firstName?: string; lastName?: string; email?: string; phone?: string }) => {
      await clientPortalAxios.put("/profile", dto);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["clientPortalData"] }),
  });

  const sendMessage = useMutation({
    mutationFn: async (content: string) => {
      await clientPortalAxios.post("/message", { content });
    },
  });

  const acceptMeeting = useMutation({
    mutationFn: async (meetingId: string) => {
      await clientPortalAxios.put(`/meetings/${meetingId}/accept`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["clientPortalData"] }),
  });

  const rescheduleMeeting = useMutation({
    mutationFn: async ({ meetingId, newDate, reason }: { meetingId: string; newDate: string; reason: string }) => {
      await clientPortalAxios.put(`/meetings/${meetingId}/reschedule`, { newDate, reason });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["clientPortalData"] }),
  });

  const cancelMeeting = useMutation({
    mutationFn: async ({ meetingId, reason }: { meetingId: string; reason: string }) => {
      await clientPortalAxios.put(`/meetings/${meetingId}/cancel`, { reason });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["clientPortalData"] }),
  });

  const acceptOffer = useMutation({
    mutationFn: async (offerId: string) => {
      await clientPortalAxios.put(`/offers/${offerId}/accept`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["clientPortalData"] }),
  });

  const rejectOffer = useMutation({
    mutationFn: async (offerId: string) => {
      await clientPortalAxios.put(`/offers/${offerId}/reject`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["clientPortalData"] }),
  });

  const withdrawOffer = useMutation({
    mutationFn: async (offerId: string) => {
      await clientPortalAxios.put(`/offers/${offerId}/withdraw`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["clientPortalData"] }),
  });

  const updatePassword = useMutation({
    mutationFn: async (dto: any) => {
      await clientPortalAxios.put("/password", dto);
    },
  });

  const linkGoogle = useMutation({
    mutationFn: async (idToken: string) => {
      const token = localStorage.getItem('token');
      await axios.post("/api/auth/link-google", { idToken }, { 
        headers: { 
          Authorization: `Bearer ${token}` 
        },
        withCredentials: true 
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["clientPortalData"] }),
  });

  return {
    data,
    isLoading,
    error,
    updateProfile,
    sendMessage,
    acceptMeeting,
    rescheduleMeeting,
    cancelMeeting,
    acceptOffer,
    rejectOffer,
    withdrawOffer,
    updatePassword,
    linkGoogle,
  };
}

export function useLinkGoogle() {
  const { linkGoogle } = useClientData();
  return linkGoogle;
}

export function useMeetingActions() {
  const { acceptMeeting, rescheduleMeeting, cancelMeeting } = useClientData();
  return {
    accept: acceptMeeting,
    reschedule: rescheduleMeeting,
    cancel: cancelMeeting
  };
}

export function useUpdateProfile() {
  const { updateProfile } = useClientData();
  return updateProfile;
}

export function useUpdatePassword() {
  const { updatePassword } = useClientData();
  return updatePassword;
}

export function useOfferActions() {
  const { acceptOffer, rejectOffer, withdrawOffer } = useClientData();
  return {
    accept: acceptOffer,
    reject: rejectOffer,
    withdraw: withdrawOffer,
  };
}

export function useSendMessage() {
  const { sendMessage } = useClientData();
  return sendMessage;
}
