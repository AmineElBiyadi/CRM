import axios from "axios";

const API_BASE_URL = "/api/auth";

export const authApi = {
  login: async (credentials: any) => {
    const { data } = await axios.post(`${API_BASE_URL}/login`, credentials);
    return data;
  },
  getCurrentUser: async () => {
    const { data } = await axios.get(`${API_BASE_URL}/me`);
    return data;
  },
};
