import { apiRefresh } from "@/lib/auth";
import { csrfHeadersForMethod } from "@/lib/csrf";

const API_BASE = "http://localhost:8081";

export async function apiFetch(path: string, options: RequestInit = {}) {
  const method = (options.method ?? "GET").toUpperCase();

  const doFetch = () =>
    fetch(`${API_BASE}${path}`, {
      ...options,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...csrfHeadersForMethod(method),
        ...options.headers,
      },
    });

  let res = await doFetch();

  if (res.status === 401) {
    const refreshed = await apiRefresh();
    if (refreshed) {
      res = await doFetch();
    }
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? "Erreur serveur.");
  }

  if (res.status === 204) return null;
  return res.json();
}
