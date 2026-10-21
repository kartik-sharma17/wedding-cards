// app/(main)/card/forest-forever/[cardId]/share/page.tsx
//
// NOTE: in a SHARE link the [cardId] segment holds the card's publicSlug (the unguessable
// token), not the database id:  /card/forest-forever/<publicSlug>/share
import { Suspense } from "react";
import ForestForeverShare from "../ForestForeverShare";

export const metadata = { title: "You're invited", robots: { index: false, follow: false } };

type Params = Promise<{ cardId: string }>;

export default function SharePage({ params }: { params: Params }) {
  return (
    <Suspense fallback={null}>
      <ShareRoute params={params} />
    </Suspense>
  );
}

async function ShareRoute({ params }: { params: Params }) {
  const { cardId: publicSlug } = await params;
  return <ForestForeverShare publicSlug={publicSlug} />;
}