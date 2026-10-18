"use client";

import { useParams, usePathname } from "next/navigation";
import CardPaymentGate from "./Cardpaymentgate";

/** Reads the cardId from the URL so ONE layout can serve every template folder. */
export default function CardPaymentGateRoute() {
  const { cardId } = useParams<{ cardId?: string }>();
  const pathname = usePathname();
  if (pathname.endsWith("/print")) return null; // the PDF page must never show the payment UI
  if (!cardId) return null; // pages without a card id (e.g. /card/baby-bloom) show nothing
  return <CardPaymentGate cardId={cardId} />;
}