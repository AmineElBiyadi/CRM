import axios, { type AxiosError } from 'axios';
import { getAxiosBaseURL } from './api-base';
import { csrfHeadersForMethod } from './csrf';
import { getUser, clearUser } from './auth';
import { toast } from 'sonner';

/**
 * Shared API client with global error handling and interceptors.
 * Handles:
 * - JWT authentication (Bearer token)
 * - Identity headers (X-Agent-Id)
 * - CSRF protection
 * - Automatic 401 redirect to login
 * - Global error toasts
 */
const apiClient = axios.create({
  baseURL: getAxiosBaseURL(),
  withCredentials: true,
});

// Request Interceptor
apiClient.interceptors.request.use((config) => {
  const method = (config.method ?? 'GET').toUpperCase();
  
  // 1. JWT Authentication
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // 2. Identity (X-Agent-Id)
  const user = getUser();
  if (user?.userId) {
    config.headers['X-Agent-Id'] = user.userId;
  }

  // 3. CSRF Protection
  Object.assign(config.headers, csrfHeadersForMethod(method));

  return config;
});

// Response Interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const status = error.response?.status;
    const data = error.response?.data as any;
    const message = data?.message || error.message || 'Une erreur est survenue';

    // Handle 401 Unauthorized
    if (status === 401) {
      clearUser();
      
      // Prevent infinite redirect loop if already on login
      if (!window.location.pathname.includes('/login')) {
        toast.error('Session expirée. Veuillez vous reconnecter.');
        setTimeout(() => {
          window.location.href = '/login';
        }, 1500);
      }
    } 
    // Handle 400 or other errors specifically if needed
    else if (status === 400) {
      toast.error(`Recherche impossible : ${message}`);
    }
    else if (status && status >= 500) {
      toast.error('Erreur serveur. Veuillez réessayer plus tard.');
    }
    // Generic error toast for other cases
    else if (status !== 404) { // Don't toast 404s by default if they are handled by components
        toast.error(message);
    }

    return Promise.reject(error);
  }
);

export default apiClient;
