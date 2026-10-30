import type { Metadata } from "next";
import TemplateDetailView from "@/components/templates/TemplateDetailView";

type Props = { params: Promise<{ slug: string }> };

export const metadata: Metadata = {
  title: "Template preview – Festa Cards",
  description: "Preview this invitation design, see what's included and create your own card.",
};

// One route serves every template: baby-bloom, golden-anniversary, royal-wedding and any added later.
export default async function TemplatePage({ params }: Props) {
  const { slug } = await params;
  return <TemplateDetailView slug={slug} />;
}
