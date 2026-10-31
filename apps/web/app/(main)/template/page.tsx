import TemplatesExplorer from "@/components/templates/TemplatesExplorer";
import { PAGES, pageMetadata } from "@/lib/seo";

// This stays a server component so it can export metadata; the interactive grid is in TemplatesExplorer.
export const metadata = pageMetadata({ ...PAGES.templates, path: "/templates" });

export default function TemplatesPage() {
  return <TemplatesExplorer />;
}
