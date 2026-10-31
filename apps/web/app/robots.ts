import type { MetadataRoute } from "next";
import { SITE } from "@/lib/seo";

// /login and /register stay crawlable on purpose: they carry a "noindex" tag,
// and Google can only obey that tag if it is allowed to fetch the page.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api/"] }],
    sitemap: `${SITE.url}/sitemap.xml`,
  };
}
