import { Suspense } from "react";
import WeddingTemplate1Page from "./WeddinCardMain";

export default function Page({ params }: { params: Promise<{ cardId: string }> }) {
  return (
    <Suspense fallback={null}>
      <CardRoute params={params} />
    </Suspense>
  );
}

async function CardRoute({ params }: { params: Promise<{ cardId: string }> }) {
  const { cardId } = await params;
  return <WeddingTemplate1Page cardId={cardId} />;
}