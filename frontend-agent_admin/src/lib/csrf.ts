/** Reads the double-submit CSRF cookie set by the backend (non-HttpOnly). */

const CSRF_COOKIE = "csrf_token";

export function getCsrfToken(): string | null {
  if (typeof document === "undefined") return null;

  const match = document.cookie.match(
    new RegExp(`(?:^|;\\s*)${CSRF_COOKIE}=([^;]*)`),
  );
  if (!match) return null;

  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}

const MUTATING_METHODS = new Set(["POST", "PUT", "DELETE", "PATCH"]);

export function csrfHeadersForMethod(method: string): Record<string, string> {
  if (!MUTATING_METHODS.has(method.toUpperCase())) return {};

  const token = getCsrfToken();
  return token ? { "X-CSRF-Token": token } : {};
}
