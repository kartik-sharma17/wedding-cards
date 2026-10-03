"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useResendVerificationMutation } from "@/redux/service/authService";
import { Loader2, Mail } from "lucide-react";

const RESEND_COOLDOWN_SECONDS = 120;

function EmailSentContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";

  const [resendVerification, { isLoading }] = useResendVerificationMutation();
  const [secondsLeft, setSecondsLeft] = useState(RESEND_COOLDOWN_SECONDS);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const interval = setInterval(() => {
      setSecondsLeft((prev) => Math.max(prev - 1, 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [secondsLeft]);

  const handleResend = async () => {
    if (!email) {
      toast.error("We couldn't find your email address. Please sign up again.");
      return;
    }
    try {
      const res = await resendVerification({ email }).unwrap();
      toast.success(res.message);
      setSecondsLeft(RESEND_COOLDOWN_SECONDS);
    } catch (err) {
      const message =
        (err as { data?: { message?: string } })?.data?.message ??
        "Couldn't resend the verification email.";
      toast.error(message);
    }
  };

  const canResend = secondsLeft <= 0 && !isLoading;
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = String(secondsLeft % 60).padStart(2, "0");

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
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-secondary">
              <Mail className="h-6 w-6" strokeWidth={1.5} />
            </div>

            <h1 className="text-lg font-semibold">Check your email</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              We sent a verification link to{" "}
              {email ? <span className="font-medium text-foreground">{email}</span> : "your email"}.
              Click the link to activate your account.
            </p>

            <Button
              variant="outline"
              className="mt-8 w-full"
              disabled={!canResend}
              onClick={handleResend}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {canResend ? "Resend email" : `Resend email in ${minutes}:${seconds}`}
            </Button>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              Wrong email?{" "}
              <Link href="/signup" className="font-medium text-foreground underline underline-offset-4">
                Sign up again
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function EmailSentPage() {
  return (
    <Suspense fallback={null}>
      <EmailSentContent />
    </Suspense>
  );
}