/** Auth — HttpOnly cookies on the server; user profile cached client-side only */

import { csrfHeadersForMethod } from "@/lib/csrf";

const USER_KEY = "crm_user";
const REMEMBER_KEY = "crm_remember";

export interface AuthUser {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  role: "ADMIN" | "AGENT" | "CLIENT";
}

const API_BASE = "http://localhost:8081";

const fetchOpts: RequestInit = { credentials: "include" };

/** Single in-flight refresh; concurrent 401 handlers share this promise. */
let refreshPromise: Promise<AuthUser | null> | null = null;

function storage(remember: boolean): Storage {
  return remember ? localStorage : sessionStorage;
}

export function saveUser(user: AuthUser, rememberMe: boolean) {
  storage(rememberMe).setItem(USER_KEY, JSON.stringify(user));
  if (rememberMe) {
    localStorage.setItem(REMEMBER_KEY, "1");
    sessionStorage.removeItem(USER_KEY);
  } else {
    localStorage.removeItem(REMEMBER_KEY);
    localStorage.removeItem(USER_KEY);
  }
}

export function getUser(): AuthUser | null {
  const raw =
    sessionStorage.getItem(USER_KEY) ??
    localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function clearUser() {
  sessionStorage.removeItem(USER_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(REMEMBER_KEY);
}

function mapUser(data: {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  role: "ADMIN" | "AGENT" | "CLIENT";
}): AuthUser {
  return {
    userId: data.userId,
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    role: data.role,
  };
}

function authFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const method = (init.method ?? "GET").toUpperCase();
  return fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...csrfHeadersForMethod(method),
      ...init.headers,
    },
  });
}

export async function apiLogin(
  email: string,
  password: string,
  rememberMe: boolean,
): Promise<AuthUser> {
  const res = await authFetch("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password, rememberMe }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? "Identifiants incorrects.");
  }

  const data = await res.json();
  const user = mapUser(data);
  saveUser(user, rememberMe);
  return user;
}

async function performRefresh(): Promise<AuthUser | null> {
  const res = await authFetch("/api/auth/refresh", { method: "POST" });

  if (!res.ok) return null;

  const data = await res.json();
  const user = mapUser(data);
  const remember = localStorage.getItem(REMEMBER_KEY) === "1";
  saveUser(user, remember);
  return user;
}

/** At most one refresh request in-flight; callers share the same result. */
export function apiRefresh(): Promise<AuthUser | null> {
  if (!refreshPromise) {
    refreshPromise = performRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

export async function apiMe(): Promise<AuthUser | null> {
  const res = await authFetch("/api/auth/me");

  if (!res.ok) return null;

  const data = await res.json();
  const user = mapUser(data);
  const remember = localStorage.getItem(REMEMBER_KEY) === "1";
  saveUser(user, remember);
  return user;
}

export async function apiLogout(): Promise<void> {
  await authFetch("/api/auth/logout", { method: "POST" });
  clearUser();
}

/** Validates session via cookies; refreshes access token when needed. */
export async function ensureAuthenticated(): Promise<AuthUser | null> {
  const me = await apiMe();
  if (me) return me;

  const refreshed = await apiRefresh();
  if (refreshed) return refreshed;

  clearUser();
  return null;
}
