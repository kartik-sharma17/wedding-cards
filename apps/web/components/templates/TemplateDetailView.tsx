"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { skipToken } from "@reduxjs/toolkit/query/react";
import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import BrandButton from "@/components/ui/BrandButton";
import TemplateGallery from "./TemplateGallery";
import TemplateInfo from "./TemplateInfo";
import TemplateProcess from "./TemplateProcess";
import TemplateFaq from "./TemplateFaq";
import RelatedTemplates from "./RelatedTemplates";
import StatusMessage from "./StatusMessage";
import CreateCardDialog from "@/components/cards/create/CreateCardDialog";
import { getToken } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";
import {
  CATEGORY_LABELS,
  formatPrice,
  getTemplateImages,
  isFreeTemplate,
  useGetTemplateBySlugQuery,
  useGetTemplatesQuery,
} from "@/redux/service/templateService";

const RELATED_COUNT = 4;

export default function TemplateDetailView({ slug }: { slug: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [createOpen, setCreateOpen] = useState(false);

  const { data, isLoading, isError, error, refetch } = useGetTemplateBySlugQuery(slug);
  const template = data?.data;

  // Related designs: same category, fetched once the main template is known.
  const { data: relatedData } = useGetTemplatesQuery(
    template ? { category: template.category, limit: RELATED_COUNT + 1 } : skipToken,
  );

  // Creating a card needs an account. Send visitors to log in and bring them back here.
  const onCreate = () => {
    if (!getToken()) {
      router.push(ROUTES.login(pathname));
      return;
    }
    setCreateOpen(true);
  };

  if (isLoading) {
    return (
      <div className="bg-white pt-32 pb-24 md:pt-40" aria-busy>
        <div className="mx-auto grid max-w-7xl animate-pulse gap-12 px-6 lg:grid-cols-2 lg:px-10">
          <div className="aspect-[4/5] bg-brand-cream" />
          <div className="flex flex-col gap-6">
            <div className="h-6 w-32 bg-brand-cream" />
            <div className="h-14 w-3/4 bg-brand-cream" />
            <div className="h-24 bg-brand-cream" />
            <div className="h-14 bg-brand-cream" />
          </div>
        </div>
      </div>
    );
  }

  // A 404 from the API means "no such slug", not a network failure.
  const isNotFound = isError && (error as FetchBaseQueryError | undefined)?.status === 404;

  if (isError && !isNotFound) {
    return (
      <div className="bg-white pt-32">
        <StatusMessage title="We couldn't load this design" text="Check your connection and try again.">
          <BrandButton onClick={() => refetch()}>Try again</BrandButton>
          <BrandButton href={ROUTES.templates} variant="outline">
            All templates
          </BrandButton>
        </StatusMessage>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="bg-white pt-32">
        <StatusMessage title="We couldn't find that design" text="It may have been removed or the link may be mistyped.">
          <BrandButton href={ROUTES.templates}>Browse all templates</BrandButton>
        </StatusMessage>
      </div>
    );
  }

  const related = (relatedData?.data?.items ?? [])
    .filter((t) => t.slug !== template.slug)
    .slice(0, RELATED_COUNT);

  const price = formatPrice(template);
  const free = isFreeTemplate(template);

  return (
    <>
      <section className="bg-white pt-28 pb-16 md:pt-36 md:pb-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <nav aria-label="Breadcrumb" className="mb-8 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <Link href={ROUTES.templates} className="hover:text-brand-deep">
              Templates
            </Link>
            <ChevronRight className="size-4" />
            <span>{CATEGORY_LABELS[template.category]}</span>
            <ChevronRight className="size-4" />
            <span aria-current="page" className="text-brand-deep">
              {template.templateName}
            </span>
          </nav>

          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
            <div className="lg:sticky lg:top-28 lg:self-start">
              <TemplateGallery images={getTemplateImages(template)} name={template.templateName} />
            </div>
            <TemplateInfo template={template} onCreate={onCreate} />
          </div>
        </div>
      </section>

      <TemplateProcess price={price} free={free} />
      <TemplateFaq price={price} free={free} />
      <RelatedTemplates templates={related} category={template.category} />

      {/* Sticky action bar on small screens */}
      <div className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-4 border-t border-border bg-white/95 px-6 py-3 backdrop-blur-md lg:hidden">
        <div>
          <p className="font-serif text-2xl leading-none text-brand-deep">{price}</p>
          <p className="text-xs text-muted-foreground">{free ? "Free template" : "to download"}</p>
        </div>
        <BrandButton onClick={onCreate} variant="deep" className="px-6!">
          Create your card
        </BrandButton>
      </div>

      <CreateCardDialog open={createOpen} onClose={() => setCreateOpen(false)} template={template} />
    </>
  );
}