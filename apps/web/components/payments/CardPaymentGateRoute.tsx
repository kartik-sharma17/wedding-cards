"use client";

import { useParams, usePathname } from "next/navigation";
import CardPaymentGate from "./Cardpaymentgate";

/** Reads the cardId from the URL so ONE layout can serve every template folder. */
export default function CardPaymentGateRoute() {
  const { cardId } = useParams<{ cardId?: string }>();
  const pathname = usePathname();

  // The PDF page and the guest share page must never show the owner's payment UI.
  if (pathname.endsWith("/print") || pathname.endsWith("/share")) return null;
  if (!cardId) return null; // pages without a card id (e.g. /card/baby-bloom) show nothing

  const templateSlug = pathname.split("/").filter(Boolean)[1]; // /card/<templateSlug>/<cardId>
  return <CardPaymentGate cardId={cardId} templateSlug={templateSlug} />;
}