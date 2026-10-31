import type { Metadata } from "next";
import { notFound } from "next/navigation";
import TemplateDetailView from "@/components/templates/TemplateDetailView";
import JsonLd from "@/components/seo/JsonLd";
import TemplatesExplorer from "@/components/templates/TemplatesExplorer";
import { getTemplateBySlug } from "@/lib/seoData";
import { breadcrumbJsonLd, pageMetadata, templateJsonLd, templateMetadata, templatePath, templateTitle } from "@/lib/seo";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const lookup = await getTemplateBySlug(slug);

  if (lookup.status === "found") return templateMetadata(lookup.template);

  // The API is down or unclear: keep the page indexable with generic tags rather than hiding it.
  return pageMetadata({
    title: "Invitation Card Template",
    description: "Preview this invitation card design, add your details and share it free with your guests.",
    path: templatePath(slug),
    noindex: lookup.status === "missing",
  });
}

// One route serves every template, including the ones created in the admin dashboard.
export default async function TemplatePage({ params }: Props) {
  const { slug } = await params;
  const lookup = await getTemplateBySlug(slug);

  if (lookup.status === "missing") notFound(); // a real 404, not a "soft 404" page

  return (
    <>
      {lookup.status === "found" && (
        <JsonLd
          data={[
            templateJsonLd(lookup.template),
            breadcrumbJsonLd([
              { name: "Home", path: "/" },
              { name: "Templates", path: "/templates" },
              { name: templateTitle(lookup.template), path: templatePath(slug) },
            ]),
          ]}
        />
      )}
      <TemplateDetailView slug={slug} />
    </>
  );
}
