export const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());

export const isValidPhone = (value: string) => /^\+?[0-9]{10,14}$/.test(value.replace(/[\s-]/g, ""));

export const MIN_PASSWORD_LENGTH = 8;

/** Accepts the link formats Google Maps produces: share links, maps.google.com and google.com/maps. */
export function isGoogleMapsUrl(value: string): boolean {
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "https:" && url.protocol !== "http:") return false;
    const host = url.hostname.replace(/^www\./, "");
    if (host === "maps.app.goo.gl" || host === "maps.google.com") return true;
    if (host === "goo.gl" && url.pathname.startsWith("/maps")) return true;
    return /^google\.[a-z.]+$/.test(host) && url.pathname.startsWith("/maps");
  } catch {
    return false;
  }
}
