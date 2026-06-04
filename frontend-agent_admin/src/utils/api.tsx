import apiClient from "@/lib/api-client";
import { ApiError } from "@/lib/api-error";

/**
 * Legacy wrapper that now uses the unified apiClient (Axios).
 * This allows all legacy calls to benefit from X-Agent-Id injection and global error handling.
 */
export async function apiFetch(path: string, options: RequestInit = {}) {
  const method = (options.method ?? "GET").toUpperCase();
  
  try {
    const response = await apiClient({
      url: path,
      method: method,
      data: options.body ? JSON.parse(options.body as string) : undefined,
      headers: options.headers as any,
    });
    
    return response.data;
  } catch (error: any) {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx. Global interceptor handles toasts,
      // here we just throw an error compatible with legacy expectations if needed.
      throw error.response.data;
    } else if (error.request) {
      // The request was made but no response was received
      throw ApiError.client(
        "NETWORK_ERROR",
        "Impossible de joindre le serveur.",
        "Vérifiez que le backend est démarré et accessible.",
      );
    } else {
      throw error;
    }
  }
}
