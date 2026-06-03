import apiClient from '@/lib/api-client';

const api = apiClient;

// Auth related API calls can be added here
export const login = async (credentials: any) => {
  const response = await api.post('/api/auth/login', credentials);
  return response.data;
};

export const changePassword = async (passwords: { oldPassword: string; newPassword: string }) => {
  const response = await api.post('/api/auth/change-password', passwords);
  return response.data;
};

export default api;
