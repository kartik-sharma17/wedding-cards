// Place at  app/(main)/card/layout.tsx  (the layout that sits above every template folder).
import { Suspense } from "react";
import CardPaymentGateRoute from "@/components/payments/CardPaymentGateRoute";

export default function CardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
    <div className="mt-20">
      {children}
    </div>
      <Suspense fallback={null}>
        <CardPaymentGateRoute />
      </Suspense>
    </>
  );
}