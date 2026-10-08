"use client";

import { useRef, useState } from "react";
import SectionHeading from "@/components/ui/SectionHeading";
import BrandButton from "@/components/ui/BrandButton";
import CategoryFilter, { type CategoryValue } from "./CategoryFilter";
import TemplateCard from "./TemplateCard";
import Pagination from "./Pagination";
import StatusMessage from "./StatusMessage";
import { useGetTemplatesQuery } from "@/redux/service/templateService";

const PAGE_SIZE = 12;

export default function TemplatesExplorer() {
  const [category, setCategory] = useState<CategoryValue>("all");
  const [page, setPage] = useState(1);
  const gridRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, isFetching, isError, refetch } = useGetTemplatesQuery({
    category: category === "all" ? undefined : category,
    page,
    limit: PAGE_SIZE,
  });

  const items = data?.data.items ?? [];
  const total = data?.data.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const changeCategory = (value: CategoryValue) => {
    setCategory(value);
    setPage(1);
  };

  const changePage = (next: number) => {
    setPage(next);
    gridRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section className="bg-brand-cream pt-32 pb-24 md:pt-40 md:pb-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <SectionHeading
          eyebrow="Templates"
          title={"Find the card that feels\nlike your celebration"}
          description="Preview any design, then add your details and send it to your relatives for free. Pay only if you want to download it."
        />

        <div className="mt-12">
          <CategoryFilter value={category} onChange={changeCategory} />
        </div>

        <div ref={gridRef} className="mt-10 scroll-mt-28">
          {!isLoading && !isError && (
            <p className="mb-6 text-sm text-muted-foreground" aria-live="polite">
              {total === 0 ? "No designs found" : `${total} ${total === 1 ? "design" : "designs"}`}
            </p>
          )}

          {isLoading ? (
            <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 md:gap-x-6 xl:grid-cols-4" aria-busy>
              {Array.from({ length: 8 }, (_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-[3/4] bg-brand-deep/10" />
                  <div className="mt-4 h-3 w-1/3 bg-brand-deep/10" />
                  <div className="mt-3 h-6 w-2/3 bg-brand-deep/10" />
                </div>
              ))}
            </div>
          ) : isError ? (
            <StatusMessage title="We couldn't load the templates" text="Check your connection and try again.">
              <BrandButton onClick={() => refetch()}>Try again</BrandButton>
            </StatusMessage>
          ) : items.length === 0 ? (
            <StatusMessage title="Nothing here yet" text="We're adding new designs to this occasion. Have a look at the others in the meantime.">
              <BrandButton variant="outline" onClick={() => changeCategory("all")}>
                Show all designs
              </BrandButton>
            </StatusMessage>
          ) : (
            <div
              key={`${category}-${page}`}
              className={`grid grid-cols-2 gap-x-4 gap-y-10 transition-opacity duration-300 md:grid-cols-3 md:gap-x-6 xl:grid-cols-4 ${
                isFetching ? "opacity-60" : "opacity-100"
              }`}
            >
              {items.map((t, i) => (
                <TemplateCard key={t.id} template={t} index={i} />
              ))}
            </div>
          )}

          {!isLoading && !isError && <Pagination page={page} totalPages={totalPages} onChange={changePage} />}
        </div>
      </div>
    </section>
  );
}
