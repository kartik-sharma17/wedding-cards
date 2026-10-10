"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import TemplateForm from "@/components/admin/TemplateForm";
import { useAdminGetTemplateQuery } from "@/services/adminTemplateService";

export default function EditTemplatePage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, isError, error, refetch } = useAdminGetTemplateQuery(id);
  const notFound = (error as { status?: unknown } | undefined)?.status === 404;

  if (isLoading) {
    return (
      <div className="grid animate-pulse gap-6 lg:grid-cols-3" aria-busy>
        <div className="h-96 bg-white lg:col-span-2" />
        <div className="h-96 bg-white" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col items-center gap-4 py-24 text-center">
        <h1 className="font-serif text-4xl text-brand-deep">{notFound ? "Template not found" : "We couldn't load this template"}</h1>
        <div className="flex gap-3">
          {!notFound && (
            <button type="button" onClick={() => refetch()} className="bg-brand-deep px-6 py-3 text-sm text-white hover:bg-brand-teal">
              Try again
            </button>
          )}
          <Link href="/admin/templates" className="border border-brand-deep px-6 py-3 text-sm text-brand-deep hover:bg-brand-deep hover:text-white">
            Back to templates
          </Link>
        </div>
      </div>
    );
  }

  return <TemplateForm key={data.data.id} template={data.data} />;
}
