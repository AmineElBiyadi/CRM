import apiClient from "../lib/api-client";

export const dossierApi = {
  getDossiers: async () => {
    const { data } = await apiClient.get("/api/client/dossiers");
    return data;
  },
  getDossierActivity: async (idFolder: string) => {
    const { data } = await apiClient.get(`/api/client/dossiers/${idFolder}/activity`);
    return data;
  },
};
