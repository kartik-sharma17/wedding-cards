import { Suspense } from "react";
import VerifyEmail from "./VerifyEmail";

export const metadata = { title: "Verify your email", robots: { index: false, follow: false } };

type Params = Promise<{ token: string }>;

export default function VerifyEmailPage({ params }: { params: Params }) {
  return (
    <Suspense fallback={null}>
      <VerifyEmailRoute params={params} />
    </Suspense>
  );
}

async function VerifyEmailRoute({ params }: { params: Params }) {
  const { token } = await params;
  return <VerifyEmail token={token} />;
}