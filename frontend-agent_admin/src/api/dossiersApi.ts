import apiClient from '@/lib/api-client';

export const api = apiClient;

export type ClientType = 'BUYER' | 'SELLER';
export type DealStage = 'COLD' | 'WARM' | 'HOT' | 'NEGOTIATION' | 'CLOSED' | 'LOST';
export type InteractionType = 'CALL' | 'VISIT' | 'EMAIL' | 'MEETING' | 'NOTE' | 'SYSTEM';

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
  assignedAgentId?: string;
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
  assignedAgentId?: string;
  reassignReason?: string;
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

export interface AssignmentHistory {
  idAssignment: string;
  agentId: string;
  agentName: string;
  assignedAt: string;
  unassignedAt: string | null;
  reason: string;
}

export interface AdminAgent {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

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
  aiStageSuggestion?: DealStage;
  aiStageSuggestionReason?: string;
  isUrgent: boolean;
  budgetMin: number;
  budgetMax: number;
  preferredArea: string;
  preferredSizeM2: number;
  preferredFloor: number;
  propertyType: string;
  assignedAgentId: string;
  assignedAgentName: string;
  lastInteractionAt: string;
  assignmentHistory: AssignmentHistory[];
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

export const updateDealStage = async (idDeal: string, stage: DealStage): Promise<DossierDetail> => {
  const response = await api.patch<DossierDetail>(`/api/agent/dossiers/${idDeal}/stage?stage=${stage}`);
  return response.data;
};

export const confirmDossier = async (id: string, data: any): Promise<void> => {
  await api.patch(`/api/dossiers/${id}/confirm`, data);
};

export const dismissStageSuggestion = async (idDeal: string): Promise<DossierDetail> => {
  const response = await api.patch<DossierDetail>(`/api/agent/dossiers/${idDeal}/dismiss-suggestion`);
  return response.data;
};

export const fetchAdminAgents = async (): Promise<AdminAgent[]> => {
  const response = await api.get<AdminAgent[]>('/api/admin/dashboard/agents');
  return response.data;
};
