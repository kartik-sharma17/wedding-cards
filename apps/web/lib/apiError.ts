/**
 * Turns any RTK Query / fetch / FastAPI error into a plain string, so it is always safe to render.
 * Handles nested bodies like { status, message: { status, message, data } } and
 * FastAPI validation errors like { detail: [{ msg: "..." }] }.
 */
export function getApiErrorMessage(error: unknown, fallback = "Something went wrong. Please try again."): string {
  if (error instanceof Error && error.message) return error.message;

  const status = (error as { status?: number | string } | null | undefined)?.status;
  if (status === "FETCH_ERROR") return "Check your internet connection and try again.";

  const find = (value: unknown, depth = 0): string | null => {
    if (typeof value === "string") return value.trim() || null;
    if (!value || typeof value !== "object" || depth > 5) return null;

    if (Array.isArray(value)) {
      for (const item of value) {
        const hit = find(item, depth + 1);
        if (hit) return hit;
      }
      return null;
    }

    const obj = value as Record<string, unknown>;
    for (const key of ["message", "detail", "msg", "error", "data"]) {
      const hit = find(obj[key], depth + 1);
      if (hit) return hit;
    }
    return null;
  };

  const hit = find(error);
  if (hit) return hit;

  if (status === 401) return "Please sign in to continue.";
  if (status === 403) return "You don't have access to this.";
  if (status === 404) return "We couldn't find what you were looking for.";
  return fallback;
}