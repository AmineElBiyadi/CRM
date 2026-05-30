import axios from "axios";

const API_BASE_URL = "http://localhost:8081/api/client";

const getClientId = () => localStorage.getItem("client_id") || "d755eba6-106f-4f81-af56-4e4d60f16840";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

apiClient.interceptors.request.use((config) => {
  const clientId = getClientId();
  if (clientId) {
    config.headers["X-Client-Id"] = clientId;
  }
  return config;
});

export const dossierApi = {
  getDossiers: async () => {
    const { data } = await apiClient.get("/dossiers");
    return data;
  },
  getDossierActivity: async (idFolder) => {
    const { data } = await apiClient.get(`/dossiers/${idFolder}/activity`);
    return data;
  },
};
