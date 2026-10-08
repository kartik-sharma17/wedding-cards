import Link from "next/link";
import BrandButton from "@/components/ui/BrandButton";
import { ROUTES } from "@/lib/routes";

type Props = { params: Promise<{ slug: string; cardId: string }> };

/** Placeholder landing page after card creation. Replace with the real card editor / preview. */
export default async function CardPage({ params }: Props) {
  const { slug, cardId } = await params;
  return (
    <section className="bg-brand-cream pt-40 pb-32">
      <div className="mx-auto flex max-w-xl flex-col items-center gap-5 px-6 text-center">
        <h1 className="font-serif text-5xl text-brand-deep">Your card is created</h1>
        <p className="leading-relaxed text-muted-foreground">
          Card <span className="font-medium text-brand-deep">{cardId}</span> was saved as a draft using the{" "}
          <Link href={ROUTES.template(slug)} className="underline underline-offset-4">
            {slug}
          </Link>{" "}
          template. The card editor will appear here.
        </p>
        <BrandButton href={ROUTES.templates} variant="outline">
          Back to templates
        </BrandButton>
      </div>
    </section>
  );
}
