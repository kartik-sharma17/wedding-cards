"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLazyVerifyEmailQuery } from "@/redux/service/authService";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";

type VerifyState = "verifying" | "success" | "error";

export default function VerifyEmailPage() {
  const router = useRouter();
  const params = useParams<{ token: string }>();
  const token = params?.token;

  const [verifyEmail] = useLazyVerifyEmailQuery();
  const [state, setState] = useState<VerifyState>("verifying");
  const [message, setMessage] = useState("");
  const hasRun = useRef(false);

  useEffect(() => {
    if (!token || hasRun.current) return;
    hasRun.current = true;

    (async () => {
      try {
        const res = await verifyEmail(token).unwrap();
        setMessage(res.message);
        setState("success");

        setTimeout(() => {
          router.push("/login");
        }, 3000);
      } catch (err) {
        const errMessage =
          (err as { data?: { message?: string } })?.data?.message ??
          "This verification link is invalid or has expired.";
        setMessage(errMessage);
        setState("error");
      }
    })();
  }, [token, verifyEmail, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link href="/" className="font-display text-3xl tracking-tight">
            VAULT
          </Link>
        </div>

        <Card className="border-border">
          <CardContent className="flex flex-col items-center px-6 py-10 text-center">
            {state === "verifying" && (
              <>
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-secondary">
                  <Loader2 className="h-6 w-6 animate-spin" strokeWidth={1.5} />
                </div>
                <h1 className="text-lg font-semibold">Verifying your email</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Hang tight, this only takes a moment.
                </p>
              </>
            )}

            {state === "success" && (
              <>
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-secondary">
                  <CheckCircle2 className="h-6 w-6" strokeWidth={1.5} />
                </div>
                <h1 className="text-lg font-semibold">Email verified</h1>
                <p className="mt-2 text-sm text-muted-foreground">{message}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Redirecting you to log in…
                </p>
                <Button className="mt-6 w-full">
                  <Link href="/login">Log in now</Link>
                </Button>
              </>
            )}

            {state === "error" && (
              <>
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-secondary">
                  <XCircle className="h-6 w-6" strokeWidth={1.5} />
                </div>
                <h1 className="text-lg font-semibold">Verification failed</h1>
                <p className="mt-2 text-sm text-muted-foreground">{message}</p>
                <div className="mt-6 flex w-full flex-col gap-2">
                  <Button variant="outline">
                    <Link href="/login">Back to log in</Link>
                  </Button>
                  <Button>
                    <Link href="/signup">Create a new account</Link>
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}