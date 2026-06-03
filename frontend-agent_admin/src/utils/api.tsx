import { apiRefresh } from "@/lib/auth";
import { ApiError, parseApiErrorResponse } from "@/lib/api-error";
import { csrfHeadersForMethod } from "@/lib/csrf";
import { getApiBase } from "@/lib/api-base";

export async function apiFetch(path: string, options: RequestInit = {}) {
  const method = (options.method ?? "GET").toUpperCase();
  const apiBase = getApiBase();

  const buildHeaders = (): HeadersInit => {
    const headers: Record<string, string> = {
      ...csrfHeadersForMethod(method),
      ...(options.headers as Record<string, string> | undefined),
    };
    if (method !== "GET" && method !== "HEAD") {
      headers["Content-Type"] = headers["Content-Type"] ?? "application/json";
    }
    return headers;
  };

  const doFetch = () =>
    fetch(`${apiBase}${path}`, {
      ...options,
      credentials: "include",
      headers: buildHeaders(),
    });

  let res: Response;
  try {
    res = await doFetch();
  } catch {
    throw ApiError.client(
      "NETWORK_ERROR",
      "Impossible de joindre le serveur.",
      "Vérifiez que le backend est démarré et accessible.",
    );
  }

  if (res.status === 401) {
    const refreshed = await apiRefresh();
    if (refreshed) {
      try {
        res = await doFetch();
      } catch {
        throw ApiError.client(
          "NETWORK_ERROR",
          "Impossible de joindre le serveur après renouvellement de session.",
        );
      }
    }
  }

  if (!res.ok) {
    throw await parseApiErrorResponse(res);
  }

  if (res.status === 204) return null;
  return res.json();
}
