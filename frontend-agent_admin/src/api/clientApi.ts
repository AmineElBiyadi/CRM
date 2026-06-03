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

// Client related API calls can be added here
// Note: See also clientsApi.ts for more client-related calls

export default api;
