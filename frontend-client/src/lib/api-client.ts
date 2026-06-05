import axios from 'axios';
import { csrfHeadersForMethod } from './csrf';

const getClientId = () => localStorage.getItem("client_id") || "d755eba6-106f-4f81-af56-4e4d60f16840";

/**
 * Shared API client for the Client Portal.
 */
const apiClient = axios.create({
  baseURL: '/',
  withCredentials: true,
});

apiClient.interceptors.request.use((config) => {
  const method = (config.method ?? 'GET').toUpperCase();

  // 1. JWT Authentication
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // 2. Client Identity
  const clientId = getClientId();
  if (clientId) {
    config.headers['X-Client-Id'] = clientId;
  }

  // 3. CSRF Protection
  Object.assign(config.headers, csrfHeadersForMethod(method));

  return config;
});

export default apiClient;
