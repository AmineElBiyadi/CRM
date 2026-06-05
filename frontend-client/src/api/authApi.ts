import axios from "axios";

const api = axios.create({
  baseURL: "/api/auth",
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authApi = {
  login: async (credentials: any) => {
    const { data } = await api.post(`/login-client`, credentials);
    return saveSession(data);
  },
  loginWithGoogle: async (idToken: string) => {
    const { data } = await api.post(`/google`, { idToken, portal: "CLIENT" });
    return saveSession(data);
  },
  linkGoogle: async (idToken: string) => {
    const { data } = await api.post(`/link-google`, { idToken });
    return data;
  },
  getCurrentUser: async () => {
    const { data } = await api.get(`/me`);
    return data;
  },
  logout: async () => {
    await api.post(`/logout`);
    localStorage.removeItem('token');
    localStorage.removeItem('client_id');
    localStorage.removeItem('user');
  }
};

function saveSession(data: any) {
  if (data.token) {
    localStorage.setItem('token', data.token);
  }
  if (data.userId) {
    localStorage.setItem('client_id', data.userId);
  }
  localStorage.setItem('user', JSON.stringify(data));
  return data;
}
