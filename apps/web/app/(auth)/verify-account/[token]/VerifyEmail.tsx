"use client";

import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useResendVerificationMutation, useVerifyEmailQuery } from "@/redux/service/authService";
import { getApiErrorMessage } from "@/lib/auth";

const DASHBOARD_PATH = "/dashboard";

const field =
  "w-full border border-input bg-white px-4 py-3 text-sm text-brand-deep outline-none focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/30";
const primaryBtn = "inline-flex items-center justify-center gap-2 bg-brand-deep px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-brand-teal disabled:opacity-60";
const linkBtn = "border border-brand-deep px-6 py-3 text-sm text-brand-deep transition-colors hover:bg-brand-deep hover:text-white";

function Screen({ title, text, children }: { title: string; text?: string; children?: ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 bg-brand-cream px-6 text-center">
      <h1 className="font-serif text-4xl text-brand-deep">{title}</h1>
      {text && <p className="max-w-md text-muted-foreground">{text}</p>}
      {children}
    </div>
  );
}

/**
 * Opened from the link in the verification email: /verify-email/<token>
 * The API verifies the account and returns a login token, so we save it and go straight to the dashboard.
 */
export default function VerifyEmail({ token }: { token: string }) {
  const router = useRouter();
  const { data, error, isLoading } = useVerifyEmailQuery(token);
  const done = useRef(false);
  const auth = data?.data;

  useEffect(() => {
    if (!auth?.token || done.current) return;
    done.current = true;
    // Same cookie the rest of the app reads. Match the options your login page uses.
    Cookies.set("token", auth.token, { expires: 7, sameSite: "lax", secure: window.location.protocol === "https:" });
    router.replace(DASHBOARD_PATH);
  }, [auth, router]);

  // Success wins over a later error (e.g. a duplicate request), so a verified user never sees a failure.
  if (auth?.token) {
    return (
      <Screen title="Email verified" text={`Welcome to Festa Cards${auth.name ? `, ${auth.name}` : ""}. Taking you to your dashboard…`}>
        <CheckCircle2 className="size-10 text-brand-teal" aria-hidden />
        <Link href={DASHBOARD_PATH} className={linkBtn}>
          Go to dashboard
        </Link>
      </Screen>
    );
  }

  if (isLoading || !error) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-4 bg-brand-cream px-6 text-center" role="status" aria-live="polite">
        <Loader2 className="size-8 animate-spin text-brand-teal" aria-hidden />
        <p className="font-serif text-2xl text-brand-deep">Verifying your email…</p>
      </div>
    );
  }

  return (
    <Screen title="We couldn't verify your email" text={getApiErrorMessage(error, "This verification link isn't valid or has expired.")}>
      <ResendForm />
      <Link href="/login" className="mt-2 text-sm text-brand-deep underline underline-offset-4 hover:text-brand-teal">
        Already verified? Log in
      </Link>
    </Screen>
  );
}

function ResendForm() {
  const id = useId();
  const [email, setEmail] = useState("");
  const [notice, setNotice] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const [resend, { isLoading }] = useResendVerificationMutation();

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setNotice(null);
    const address = email.trim();
    try {
      await resend(address).unwrap();
      setNotice({ kind: "success", text: `We've sent a new verification link to ${address}. Check your inbox.` });
    } catch (err) {
      setNotice({ kind: "error", text: getApiErrorMessage(err, "We couldn't send a new link. Please try again.") });
    }
  };

  return (
    <form onSubmit={submit} className="mt-2 w-full max-w-sm space-y-3 text-left">
      <label htmlFor={id} className="block text-sm font-medium text-brand-deep">
        Send me a new link
      </label>
      <input id={id} type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className={field} />
      <button type="submit" disabled={isLoading || !email.trim()} className={`${primaryBtn} w-full`}>
        {isLoading && <Loader2 className="size-4 animate-spin" aria-hidden />}
        Resend verification email
      </button>
      {notice && (
        <p
          role={notice.kind === "error" ? "alert" : "status"}
          className={`border px-4 py-3 text-sm ${notice.kind === "error" ? "border-destructive/30 bg-destructive/5 text-destructive" : "border-brand-teal/30 bg-brand-teal/5 text-brand-teal"}`}
        >
          {notice.text}
        </p>
      )}
    </form>
  );
}