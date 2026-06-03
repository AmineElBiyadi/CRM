import apiClient from '@/lib/api-client';

const api = apiClient;

// Identity and Form 1
export interface ClientIdentityDto {
  idClient: string;
  firstName: string;
  lastName: string;
  initials: string;
  phone: string;
  email: string;
  source: string;
  dossierCount: number;
  createdAt: string;
  newClient: boolean;
}

export interface CreateClientForm1Request {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  source?: string;
}

export const fetchIdentities = async (): Promise<ClientIdentityDto[]> => {
  const response = await api.get<ClientIdentityDto[]>('/api/agent/clients/identities');
  return response.data;
};

export const checkClientExistence = async (params: { email: string; phone: string }): Promise<any> => {
  try {
    const response = await api.get('/api/agent/clients/check', { params });
    return response.data;
  } catch (error: any) {
    if (error.response && error.response.status === 409) {
      return error.response.data;
    }
    throw error;
  }
};

export const createClientIdentity = async (request: CreateClientForm1Request): Promise<void> => {
  await api.post('/api/agent/clients/identity', request);
};

// Dossiers for a specific client
export interface DossierListItem {
  idDeal: string;
  type: 'BUYER' | 'SELLER';
  stage: string;
  aiLeadScore: number;
  lastInteractionAt: string | null;
  isUrgent: boolean;
  newDossier: boolean;
  createdAt: string;
}

export const fetchClientDossiers = async (idClient: string): Promise<DossierListItem[]> => {
  const response = await api.get<DossierListItem[]>(`/api/agent/clients/${idClient}/dossiers`);
  return response.data;
};

export const confirmClient = async (id: string, data: any): Promise<void> => {
  await api.patch(`/api/clients/${id}/confirm`, data);
};
