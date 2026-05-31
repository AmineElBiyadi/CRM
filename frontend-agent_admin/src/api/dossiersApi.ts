import axios from 'axios';
import { csrfHeadersForMethod } from '@/lib/csrf';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081',
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const method = (config.method ?? 'GET').toUpperCase();
  const devAgentId = localStorage.getItem('dev_agent_id') || '3c865aae-edcf-4d93-b434-92e69b2230aa';

  Object.assign(config.headers, csrfHeadersForMethod(method));
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
  status: 'SCHEDULED' | 'PENDING' | 'IN_PROGRESS' | 'RESCHEDULED' | 'POSTPONED' | 'CANCELED' | 'COMPLETED' | 'MISSED' | 'DRAFT';
  notes: string | null;
  propertyAddress: string | null;
}

export interface CreateMeetingDto {
  idDeal: string;
  type: MeetingType;
  scheduledAt: string; // ISO-8601
  notes?: string;
  propertyAddress?: string;
  status?: MeetingItem['status'];
}

export interface UpdateMeetingStatusDto {
  newStatus?: MeetingItem['status'];
  newScheduledAt?: string; // ISO-8601
}

export interface DossierSummary {
  idDeal: string | null;
  idProfile: string;
  idClient?: string;
  clientFullName: string;
  clientType: ClientType;
  stage: string;
  aiLeadScore: number | null;
  isUrgent: boolean;
  lastInteractionAt: string | null;
  aiRecommendedAction: string;
  newDossier: boolean;
  createdAt: string;
}

export interface CreateDossierRequest {
  idClient: string;
  type: ClientType;
  // ── BUYER ─────────────────────────────────────────────────────────────────
  budgetMin?: number;
  budgetMax?: number;
  propertySpecificType?: string;
  preferredArea?: string;
  preferredSizeM2?: number;
  preferredFloor?: number;
  // ── SELLER ────────────────────────────────────────────────────────────────
  propertyTitle?: string;
  address?: string;
  city?: string;
  askingPrice?: number;
  propertySurfaceM2?: number;
  numRooms?: number;
  propertyFloor?: number;
  propertyImageUrls?: string[];
}

export interface UpdateDossierRequest {
  type: ClientType;
  // BUYER
  budgetMin?: number;
  budgetMax?: number;
  propertySpecificType?: string;
  preferredArea?: string;
  preferredSizeM2?: number;
  preferredFloor?: number;
  // SELLER
  propertyTitle?: string;
  address?: string;
  city?: string;
  askingPrice?: number;
  propertySurfaceM2?: number;
  numRooms?: number;
  propertyFloor?: number;
  propertyImageUrls?: string[];
}

export interface PropertyType {
  idPropertyType: string;
  generalType: string;
  specificType: string;
}

export const fetchPropertyTypes = async (): Promise<PropertyType[]> => {
  const response = await api.get<PropertyType[]>('/api/property-types');
  return response.data;
};

export interface DossierDetail {
  idDeal: string | null;
  idProfile: string;
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
  // Seller Specifics
  propertyTitle?: string;
  address?: string;
  city?: string;
  askingPrice?: number;
  propertySurfaceM2?: number;
  numRooms?: number;
  propertyFloor?: number;
  propertyImageUrls?: string[];
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
  const response = await api.get<DossierSummary[]>('/api/agent/dossiers');
  return response.data;
};

export const fetchAgentDossiers = async (agentId: string): Promise<DossierSummary[]> => {
  const response = await api.get<DossierSummary[]>(`/api/agents/${agentId}/dossiers`);
  return response.data;
};

export const createDossier = async (request: CreateDossierRequest): Promise<void> => {
  await api.post('/api/agent/dossiers', request);
};

export const fetchDossierDetail = async (id: string): Promise<DossierDetail> => {
  const response = await api.get<DossierDetail>(`/api/agent/dossiers/${id}`);
  return response.data;
};

export const updateDossier = async (id: string, request: UpdateDossierRequest): Promise<DossierDetail> => {
  const response = await api.put<DossierDetail>(`/api/agent/dossiers/${id}`, request);
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

export const updateDealStage = async (idDeal: string, stage: DealStage): Promise<DossierDetail> => {
  const response = await api.patch<DossierDetail>(`/api/agent/dossiers/${idDeal}/stage?stage=${stage}`);
  return response.data;
};

export const confirmDossier = async (id: string, data: any): Promise<void> => {
  await api.patch(`/api/dossiers/${id}/confirm`, data);
};

export const updateMeetingStatus = async (meetingId: string, request: UpdateMeetingStatusDto): Promise<MeetingItem> => {
  const response = await api.patch<MeetingItem>(`/api/agent/meetings/${meetingId}/status`, request);
  return response.data;
};

export const deleteMeeting = async (meetingId: string): Promise<void> => {
  await api.delete(`/api/agent/meetings/${meetingId}`);
};
