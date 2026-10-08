import SectionHeading from "@/components/ui/SectionHeading";
import BrandButton from "@/components/ui/BrandButton";
import TemplateCard from "./TemplateCard";
import { CATEGORY_LABELS } from "@/lib/templates";
import { ROUTES } from "@/lib/routes";
import type { TemplateCategory, TemplateSummary } from "@/services/templateService";

type Props = { templates: TemplateSummary[]; category: TemplateCategory };

export default function RelatedTemplates({ templates, category }: Props) {
  if (templates.length === 0) return null;
  return (
    <section className="bg-brand-cream py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <SectionHeading
          eyebrow="You may also like"
          title={`More ${CATEGORY_LABELS[category].toLowerCase()} designs`}
        >
          <BrandButton href={ROUTES.templates} variant="outline">
            See all templates
          </BrandButton>
        </SectionHeading>
        <div className="mt-14 grid grid-cols-2 gap-x-4 gap-y-10 md:gap-x-6 lg:grid-cols-4">
          {templates.map((t, i) => (
            <TemplateCard key={t.id} template={t} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
