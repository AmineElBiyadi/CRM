import axios from "axios";

const API_BASE_URL = "/api/documents";

const getClientId = () => localStorage.getItem("client_id") || "d755eba6-106f-4f81-af56-4e4d60f16840";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

apiClient.interceptors.request.use((config) => {
  const clientId = getClientId();
  if (clientId) {
    config.headers["X-Client-Id"] = clientId;
  }
  return config;
});

export const documentApi = {
  getDocumentsByDeal: async (idDeal: string) => {
    const { data } = await apiClient.get(`/deal/${idDeal}`);
    return data;
  },
  uploadDocument: async (idDeal: string, type: string, file: File) => {
    const formData = new FormData();
    formData.append("dealId", idDeal);
    formData.append("type", type);
    formData.append("file", file);
    const { data } = await apiClient.post(`/upload`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return data;
  },
};
