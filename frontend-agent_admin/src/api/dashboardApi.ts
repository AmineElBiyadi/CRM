import axios from 'axios';
import { getAxiosBaseURL } from '@/lib/api-base';
import { csrfHeadersForMethod } from '@/lib/csrf';

const api = axios.create({
  baseURL: getAxiosBaseURL(),
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const method = (config.method ?? 'GET').toUpperCase();
  const devAgentId = localStorage.getItem('dev_agent_id') || '3c865aae-edcf-4d93-b434-92e69b2230aa';

  Object.assign(config.headers, csrfHeadersForMethod(method));
  config.headers['X-Agent-Id'] = devAgentId;
  
  return config;
});

import { type ClientIdentityDto } from './clientsApi';

export interface MeetingDto {
  idMeeting: string;
  scheduledAt: string;
  clientFullName: string;
  type: string;
  status: string;
}

export interface DealPriorityDto {
  idDeal: string;
  idClientFolder: string;
  clientFullName: string;
  clientPhone: string;
  clientEmail: string;
  stage: string;
  aiLeadScore: number;
  aiRecommendedAction: string;
  lastInteractionAt: string;
}

export interface AgentKpiDto {
  activeClients: number;
  weekMeetings: number;
  pendingContracts: number;
  avgLeadScore: number;
  monthlyScore: number;
  totalClosings: number;
}

export interface AgentDashboardDto {
  agentFirstName: string;
  agentFullName: string;
  agentRole: string;
  agentEmail: string;
  agentPhone: string;
  agentCreatedAt: string;
  kpis: AgentKpiDto;
  todayMeetings: MeetingDto[];
  priorities: DealPriorityDto[];
  todayTasks: MeetingDto[];
  pendingClients: ClientIdentityDto[];
}

export const fetchAgentDashboard = async (): Promise<AgentDashboardDto> => {
  const response = await api.get<AgentDashboardDto>('/api/agent/dashboard');
  return response.data;
};

export const toggleMeeting = async (meetingId: string): Promise<MeetingDto> => {
  const response = await api.patch<MeetingDto>(`/api/agent/meetings/${meetingId}/toggle`);
  return response.data;
};
