import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  const devAgentId = localStorage.getItem('dev_agent_id') || '3c865aae-edcf-4d93-b434-92e69b2230aa';
  config.headers['X-Agent-Id'] = devAgentId;
  return config;
});

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

// Meeting related API calls
export const fetchMeetings = async () => {
  const response = await api.get('/api/agent/meetings');
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

export const updateMeetingStatus = async (meetingId: string, request: UpdateMeetingStatusDto): Promise<MeetingItem> => {
  const response = await api.patch<MeetingItem>(`/api/agent/meetings/${meetingId}/status`, request);
  return response.data;
};

export const deleteMeeting = async (meetingId: string): Promise<void> => {
  await api.delete(`/api/agent/meetings/${meetingId}`);
};

export default api;
