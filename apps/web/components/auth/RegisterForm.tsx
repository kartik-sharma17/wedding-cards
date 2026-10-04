"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, MailCheck } from "lucide-react";
import FormField from "./FormField";
import FormAlert from "./FormAlert";
import BrandButton from "../ui/BrandButton";
import { useRegisterMutation, useResendVerificationMutation } from "../../redux/service/authService";
import { getApiErrorMessage } from "../../lib/auth";
import { isValidEmail, isValidPhone, MIN_PASSWORD_LENGTH } from "../../lib/validators";
import { EASE } from "../../lib/motion";

type Fields = { full_name: string; email: string; phone: string; password: string; confirm: string };
type Errors = Partial<Record<keyof Fields, string>>;

const INITIAL: Fields = { full_name: "", email: "", phone: "", password: "", confirm: "" };

export default function RegisterForm() {
  const [register, { isLoading }] = useRegisterMutation();
  const [resend, { isLoading: isResending }] = useResendVerificationMutation();

  const [values, setValues] = useState<Fields>(INITIAL);
  const [errors, setErrors] = useState<Errors>({});
  const [serverError, setServerError] = useState("");
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [resendMessage, setResendMessage] = useState("");

  const set = (key: keyof Fields) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setValues((v) => ({ ...v, [key]: e.target.value }));

  const validate = (): boolean => {
    const next: Errors = {};
    if (!values.full_name.trim()) next.full_name = "Enter your full name.";
    if (!values.email.trim()) next.email = "Enter your email address.";
    else if (!isValidEmail(values.email)) next.email = "Enter a valid email address.";
    if (values.phone && !isValidPhone(values.phone)) next.phone = "Enter a valid phone number, digits only.";
    if (values.password.length < MIN_PASSWORD_LENGTH)
      next.password = `Use at least ${MIN_PASSWORD_LENGTH} characters.`;
    if (values.confirm !== values.password) next.confirm = "Passwords do not match.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setServerError("");
    if (!validate()) return;

    const email = values.email.trim();
    try {
      await register({
        full_name: values.full_name.trim(),
        email,
        password: values.password,
        ...(values.phone.trim() && { phone: values.phone.trim() }),
      }).unwrap();
      setSentTo(email);
    } catch (err) {
      setServerError(getApiErrorMessage(err));
    }
  };

  const onResend = async () => {
    if (!sentTo) return;
    setResendMessage("");
    try {
      const res = await resend(sentTo).unwrap();
      setResendMessage(res.message || "Verification link sent again.");
    } catch (err) {
      setResendMessage(getApiErrorMessage(err));
    }
  };

  return (
    <AnimatePresence mode="wait" initial={false}>
      {sentTo ? (
        <motion.div
          key="sent"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE }}
          className="flex flex-col items-center gap-5 border border-border bg-white p-10 text-center"
        >
          <span className="flex size-16 items-center justify-center rounded-full bg-brand-gold/20 text-brand-deep">
            <MailCheck className="size-8" strokeWidth={1.5} />
          </span>
          <h2 className="font-serif text-3xl text-brand-deep">Check your inbox</h2>
          <p className="leading-relaxed text-muted-foreground">
            We sent a verification link to <span className="font-medium text-brand-deep">{sentTo}</span>. Open it to
            activate your account, then log in.
          </p>
          <BrandButton href="/login" variant="deep" className="w-full">
            Go to log in
          </BrandButton>
          <button
            type="button"
            onClick={onResend}
            disabled={isResending}
            className="text-sm text-brand-deep underline underline-offset-4 disabled:opacity-60"
          >
            {isResending ? "Sending…" : "Didn't get it? Resend email"}
          </button>
          {resendMessage && (
            <p role="status" className="text-sm text-muted-foreground">
              {resendMessage}
            </p>
          )}
        </motion.div>
      ) : (
        <motion.form
          key="form"
          onSubmit={onSubmit}
          noValidate
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col gap-5"
        >
          {serverError && (
            <FormAlert>
              {serverError}
              {/already exist/i.test(serverError) && (
                <Link href="/login" className="mt-2 block font-medium underline underline-offset-4">
                  Log in instead
                </Link>
              )}
            </FormAlert>
          )}

          <FormField
            label="Full name"
            autoComplete="name"
            placeholder="Your full name"
            value={values.full_name}
            onChange={set("full_name")}
            error={errors.full_name}
          />
          <FormField
            label="Email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={values.email}
            onChange={set("email")}
            error={errors.email}
          />
          <FormField
            label="Phone (optional)"
            type="tel"
            autoComplete="tel"
            placeholder="98765 43210"
            value={values.phone}
            onChange={set("phone")}
            error={errors.phone}
          />
          <FormField
            label="Password"
            type="password"
            autoComplete="new-password"
            placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
            value={values.password}
            onChange={set("password")}
            error={errors.password}
          />
          <FormField
            label="Confirm password"
            type="password"
            autoComplete="new-password"
            placeholder="Re-enter your password"
            value={values.confirm}
            onChange={set("confirm")}
            error={errors.confirm}
          />

          <BrandButton type="submit" variant="deep" disabled={isLoading} className="mt-2 w-full">
            {isLoading ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Creating account…
              </>
            ) : (
              "Create account"
            )}
          </BrandButton>
        </motion.form>
      )}
    </AnimatePresence>
  );
}
