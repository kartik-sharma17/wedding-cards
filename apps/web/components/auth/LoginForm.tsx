"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import FormField from "./FormField";
import FormAlert from "./FormAlert";
import BrandButton from "@/components/ui/BrandButton";
import { getApiErrorMessage, getSafeRedirect, saveToken } from "@/lib/auth";
import { isValidEmail } from "@/lib/validators";
import { useResendVerificationMutation,useLoginMutation } from "@/redux/service/authService";

type Errors = { email?: string; password?: string };

export default function LoginForm() {
  const router = useRouter();
  const [login, { isLoading }] = useLoginMutation();
  const [resend, { isLoading: isResending }] = useResendVerificationMutation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [serverError, setServerError] = useState("");
  const [notice, setNotice] = useState("");
  const [needsVerification, setNeedsVerification] = useState(false);

  const validate = (): boolean => {
    const next: Errors = {};
    if (!email.trim()) next.email = "Enter your email address.";
    else if (!isValidEmail(email)) next.email = "Enter a valid email address.";
    if (!password) next.password = "Enter your password.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setServerError("");
    setNotice("");
    setNeedsVerification(false);
    if (!validate()) return;

    try {
      const res = await login({ email: email.trim(), password }).unwrap();
      saveToken(res.data.token);
      router.push("/dashboard");
    } catch (err) {
      const message = getApiErrorMessage(err);
      setServerError(message);
      setNeedsVerification(/not verified/i.test(message));
    }
  };

  const onResend = async () => {
    try {
      const res = await resend(email.trim()).unwrap();
      setServerError("");
      setNeedsVerification(false);
      setNotice(res.message || "Verification link sent. Check your inbox.");
    } catch (err) {
      setServerError(getApiErrorMessage(err));
    }
  };

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      {serverError && (
        <FormAlert>
          {serverError}
          {needsVerification && (
            <button
              type="button"
              onClick={onResend}
              disabled={isResending}
              className="mt-2 block font-medium underline underline-offset-4 disabled:opacity-60"
            >
              {isResending ? "Sending…" : "Resend verification email"}
            </button>
          )}
        </FormAlert>
      )}
      {notice && (
        <p role="status" className="rounded-[2px] border border-brand-teal/30 bg-brand-teal/5 px-4 py-3 text-sm text-brand-teal">
          {notice}
        </p>
      )}

      <FormField
        label="Email"
        type="email"
        autoComplete="email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={errors.email}
      />
      <FormField
        label="Password"
        type="password"
        autoComplete="current-password"
        placeholder="Your password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={errors.password}
      />

      <BrandButton type="submit" variant="deep" disabled={isLoading} className="mt-2 w-full">
        {isLoading ? (
          <>
            <Loader2 className="size-4 animate-spin" /> Logging in…
          </>
        ) : (
          "Log in"
        )}
      </BrandButton>
    </form>
  );
}
