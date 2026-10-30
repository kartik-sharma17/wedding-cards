import type { Metadata } from "next";
import TemplatesExplorer from "@/components/templates/TemplatesExplorer";

export const metadata: Metadata = {
  title: "Invitation templates – Festa Cards",
  description: "Browse wedding, anniversary, birthday and baby shower invitation designs. Create and share free.",
};

export default function TemplatesPage() {
  return <TemplatesExplorer />;
}
