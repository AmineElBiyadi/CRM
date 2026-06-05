import apiClient from "../lib/api-client";

export const documentApi = {
  getDocumentsByDeal: async (idDeal: string) => {
    const { data } = await apiClient.get(`/api/documents/deal/${idDeal}`);
    return data;
  },
  uploadDocument: async (idDeal: string, type: string, file: File) => {
    const formData = new FormData();
    formData.append("dealId", idDeal);
    formData.append("type", type);
    formData.append("file", file);
    const { data } = await apiClient.post(`/api/documents/upload`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return data;
  },
};
