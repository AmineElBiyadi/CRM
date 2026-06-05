import apiClient from "../lib/api-client";

export const authApi = {
  login: async (credentials: any) => {
    const { data } = await apiClient.post(`/api/auth/login-client`, credentials);
    // Sauvegarder le token et les infos client
    if (data.token) {
      localStorage.setItem('token', data.token);
    }
    if (data.userId) {
      localStorage.setItem('client_id', data.userId);
    }
    localStorage.setItem('user', JSON.stringify(data));
    return data;
  },
  getCurrentUser: async () => {
    const { data } = await apiClient.get(`/api/auth/me`);
    return data;
  },
  logout: async () => {
    await apiClient.post(`/api/auth/logout`);
    localStorage.removeItem('token');
    localStorage.removeItem('client_id');
    localStorage.removeItem('user');
  }
};
