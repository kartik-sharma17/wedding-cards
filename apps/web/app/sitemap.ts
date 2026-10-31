import type { MetadataRoute } from "next";
import { SITE, templatePath } from "@/lib/seo";
import { getAllTemplates } from "@/lib/seoData";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const templates = await getAllTemplates();

  return [
    { url: SITE.url, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE.url}/templates`, changeFrequency: "weekly", priority: 0.9 },
    // Add the category landing pages here once they exist (see CATEGORY_SEO in lib/seo.ts).
    ...templates.map((t) => ({
      url: `${SITE.url}${templatePath(t.slug)}`,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
