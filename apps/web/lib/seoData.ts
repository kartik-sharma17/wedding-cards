import type { TemplateDetail, TemplateSummary } from "@/redux/service/templateService";

const API = process.env.NEXT_PUBLIC_BASE_URL;
const HOUR = 60 * 60;

export type TemplateLookup =
  | { status: "found"; template: TemplateDetail }
  | { status: "missing" } // the API said 404, so the page should be a real 404
  | { status: "unknown" }; // API unreachable or unexpected: render the page without per-template tags

/** Server-side lookup for metadata. Next caches the response and reuses it between generateMetadata and the page. */
export async function getTemplateBySlug(slug: string): Promise<TemplateLookup> {
  if (!API) return { status: "unknown" };
  try {
    const res = await fetch(`${API}/templates/${encodeURIComponent(slug)}`, { next: { revalidate: HOUR } });
    if (res.status === 404) return { status: "missing" };
    if (!res.ok) return { status: "unknown" };
    const json = (await res.json()) as { data?: TemplateDetail };
    return json.data ? { status: "found", template: json.data } : { status: "unknown" };
  } catch {
    return { status: "unknown" };
  }
}

/** Every active template, for the sitemap. The API returns at most 100 per page. */
export async function getAllTemplates(): Promise<TemplateSummary[]> {
  if (!API) return [];
  const limit = 100;
  const all: TemplateSummary[] = [];
  try {
    for (let page = 1; page <= 20; page++) {
      const res = await fetch(`${API}/templates?page=${page}&limit=${limit}`, { next: { revalidate: HOUR } });
      if (!res.ok) break;
      const json = (await res.json()) as { data?: { items: TemplateSummary[]; total: number } };
      const items = json.data?.items ?? [];
      all.push(...items);
      if (items.length < limit || all.length >= (json.data?.total ?? 0)) break;
    }
  } catch {
    // Return what we have; the sitemap still lists the static pages.
  }
  return all;
}
