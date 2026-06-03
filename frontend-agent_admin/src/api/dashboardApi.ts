import apiClient from '@/lib/api-client';

const api = apiClient;

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
