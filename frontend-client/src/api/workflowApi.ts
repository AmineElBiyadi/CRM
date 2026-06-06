import axios from 'axios';

const api = axios.create({
  baseURL: '', // Utilise le proxy Vite
  withCredentials: true,
});

export interface ClientStep1Request {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  source: string;
}

export interface DossierStep3Request {
  clientId: string;
  clientType: 'BUYER' | 'SELLER';
  // Seller fields
  propertyTitle?: string;
  propertyTypeId?: string;
  address?: string;
  city?: string;
  price?: number;
  surfaceM2?: number;
  numRooms?: number;
  floor?: number;
  // Buyer fields
  budgetMin?: number;
  budgetMax?: number;
  preferredArea?: string;
  preferredSizeM2?: number;
  preferredFloor?: number;
}

export interface PropertyType {
  idPropertyType: string;
  generalType: string;
  specificType: string;
  description: string;
}

export const workflowApi = {
  createClient: async (request: ClientStep1Request): Promise<string> => {
    const { data } = await api.post<string>('/api/public/onboarding/client', request);
    return data;
  },
  createDossier: async (request: DossierStep3Request): Promise<string> => {
    const { data } = await api.post<string>('/api/public/onboarding/dossier', request);
    return data;
  },
  getPropertyTypes: async (): Promise<PropertyType[]> => {
    const { data } = await api.get<PropertyType[]>('/api/property-types');
    return data;
  },
  checkEmail: async (email: string): Promise<void> => {
    await api.get('/api/public/onboarding/check-email', { params: { email } });
  }
};
