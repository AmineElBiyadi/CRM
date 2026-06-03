/**
 * In dev, use same-origin requests (Vite proxy → backend) so HttpOnly auth cookies are sent.
 * Set VITE_API_BASE_URL=http://localhost:8081 only if you intentionally bypass the proxy.
 */
export function getApiBase(): string {
  const fromEnv = import.meta.env.VITE_API_BASE_URL as string | undefined;
  if (import.meta.env.DEV) {
    if (!fromEnv || fromEnv === "proxy") return "";
  }
  return fromEnv || "http://localhost:8081";
}

/** Base URL for axios (empty string = Vite proxy in dev). */
export function getAxiosBaseURL(): string {
  return getApiBase();
}
