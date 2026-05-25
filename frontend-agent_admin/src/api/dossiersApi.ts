import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  const devAgentId = localStorage.getItem('dev_agent_id') || '8366d183-2fb7-44a1-8f16-2ec3ca78a320';
  config.headers['X-Agent-Id'] = devAgentId;
  return config;
});

export type ClientType = 'BUYER' | 'SELLER';
export type DealStage = 'COLD' | 'WARM' | 'HOT' | 'NEGOTIATION' | 'CLOSED' | 'LOST';
export type InteractionType = 'CALL' | 'VISIT' | 'EMAIL' | 'MEETING' | 'NOTE' | 'SYSTEM';
export type MeetingType = 'PROPERTY_VISIT' | 'PHONE_CALL' | 'OFFICE_APPOINTMENT' | 'CONTRACT_SIGNING';

export interface MeetingItem {
  idMeeting: string;
  idDeal: string;
  scheduledAt: string; // ISO-8601
  clientFullName: string;
  type: string; // French label
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  notes: string | null;
  propertyAddress: string | null;
}

export interface CreateMeetingDto {
  idDeal: string;
  type: MeetingType;
  scheduledAt: string; // ISO-8601
  notes?: string;
  propertyAddress?: string;
}

export interface DossierSummary {
  idDeal: string;
  clientFullName: string;
  clientType: ClientType;
  stage: string;
  aiLeadScore: number;
  isUrgent: boolean;
  lastInteractionAt: string | null;
  aiRecommendedAction: string;
}

export interface CreateDossierRequest {
  idClient: string;
  type: ClientType;
  budgetMin?: number;
  budgetMax?: number;
  propertySpecificType?: string;
  preferredArea?: string;
  surfaceM2?: number;
  floor?: number;
}

export interface DossierDetail {
  idDeal: string;
  idClient: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientSource: string;
  clientType: ClientType;
  stage: DealStage;
  aiLeadScore: number;
  aiScoreExplanation: string;
  aiRecommendedAction: string;
  aiSummary: string;
  isUrgent: boolean;
  budgetMin: number;
  budgetMax: number;
  preferredArea: string;
  preferredSizeM2: number;
  preferredFloor: number;
  propertyType: string;
  assignedAgentName: string;
  lastInteractionAt: string;
}

export interface InteractionItem {
  idInteraction: string;
  type: InteractionType;
  description: string;
  occurredAt: string;
  durationMinutes: number;
  agentName: string;
}

export interface CreateInteractionRequest {
  idDeal: string;
  type: InteractionType;
  description: string;
  occurredAt: string;
  durationMinutes?: number;
}

export const fetchDossiers = async (): Promise<DossierSummary[]> => {
  const response = await api.get('/api/agent/dossiers');
  return response.data;
};

export const createDossier = async (request: CreateDossierRequest): Promise<void> => {
  await api.post('/api/agent/dossiers', request);
};

export const fetchDossierDetail = async (id: string): Promise<DossierDetail> => {
  const response = await api.get<DossierDetail>(`/api/agent/dossiers/${id}`);
  return response.data;
};

export const fetchInteractions = async (idDeal: string): Promise<InteractionItem[]> => {
  const response = await api.get<InteractionItem[]>(`/api/agent/interactions/deal/${idDeal}`);
  return response.data;
};

export const logInteraction = async (request: CreateInteractionRequest): Promise<InteractionItem> => {
  const response = await api.post<InteractionItem>('/api/agent/interactions', request);
  return response.data;
};

export const fetchDealMeetings = async (idDeal: string): Promise<MeetingItem[]> => {
  const response = await api.get<MeetingItem[]>(`/api/agent/meetings/deal/${idDeal}`);
  return response.data;
};

export const fetchWeekMeetings = async (): Promise<MeetingItem[]> => {
  const response = await api.get<MeetingItem[]>('/api/agent/meetings/week');
  return response.data;
};

export const fetchMonthMeetings = async (year: number, month: number): Promise<MeetingItem[]> => {
  const response = await api.get<MeetingItem[]>(`/api/agent/meetings/month?year=${year}&month=${month}`);
  return response.data;
};


export const createMeeting = async (request: CreateMeetingDto): Promise<MeetingItem> => {
  const response = await api.post<MeetingItem>('/api/agent/meetings', request);
  return response.data;
};
