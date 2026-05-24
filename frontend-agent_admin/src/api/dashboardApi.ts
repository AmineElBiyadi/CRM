import axios from 'axios';

const api = axios.create({
  baseURL: '',
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
}

export interface AgentDashboardDto {
  agentFirstName: string;
  agentFullName: string;
  agentRole: string;
  kpis: AgentKpiDto;
  todayMeetings: MeetingDto[];
  priorities: DealPriorityDto[];
  todayTasks: MeetingDto[];
}

export const fetchAgentDashboard = async (): Promise<AgentDashboardDto> => {
  const response = await api.get<AgentDashboardDto>('/api/agent/dashboard');
  return response.data;
};

export const toggleMeeting = async (meetingId: string): Promise<MeetingDto> => {
  const response = await api.patch<MeetingDto>(`/api/agent/meetings/${meetingId}/toggle`);
  return response.data;
};
