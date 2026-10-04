import Cookies from "js-cookie";

export const TOKEN_COOKIE = "token"; // must match the cookie read in services/root.ts
const TOKEN_EXPIRY_DAYS = 7;

/** Where to send the user after a successful login. Change once the dashboard exists. */
export const AFTER_LOGIN_ROUTE = "/";

export const saveToken = (token: string) =>
  Cookies.set(TOKEN_COOKIE, token, {
    expires: TOKEN_EXPIRY_DAYS,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

export const getToken = () => Cookies.get(TOKEN_COOKIE);
export const clearToken = () => Cookies.remove(TOKEN_COOKIE);

const FALLBACK_ERROR = "Something went wrong. Please try again.";

/**
 * Pulls a readable message out of an RTK Query error.
 * FastAPI wraps HTTPException payloads as { detail: { status, message } },
 * and request validation errors as { detail: [{ msg, ... }] }.
 */
export function getApiErrorMessage(error: unknown, fallback = FALLBACK_ERROR): string {
  if (!error || typeof error !== "object") return fallback;

  const err = error as { status?: unknown; data?: unknown };

  if (err.status === "FETCH_ERROR") {
    return "We couldn't reach the server. Check your connection and try again.";
  }

  const data = err.data as { detail?: unknown; message?: unknown } | undefined;
  const detail = data?.detail;

  if (typeof detail === "string") return detail;

  if (Array.isArray(detail)) {
    const messages = detail
      .map((d) => (d && typeof d === "object" && "msg" in d ? String((d as { msg: unknown }).msg) : ""))
      .filter(Boolean);
    if (messages.length) return messages.join(". ");
  }

  if (detail && typeof detail === "object" && "message" in detail) {
    return String((detail as { message: unknown }).message);
  }

  if (typeof data?.message === "string") return data.message;

  return fallback;
}
