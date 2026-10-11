import { Suspense } from "react";
import CardPaymentGate from "@/components/payments/Cardpaymentgate";

export default function CardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ cardId: string }>;
}) {
  return (
    <>
    <div className="mt-20">
      {children}
    </div>
      <Suspense fallback={null}>
        <PaymentGate params={params} />
      </Suspense>
    </>
  );
}

async function PaymentGate({ params }: { params: Promise<{ cardId: string }> }) {
  const { cardId } = await params;
  return <CardPaymentGate cardId={cardId} />;
}