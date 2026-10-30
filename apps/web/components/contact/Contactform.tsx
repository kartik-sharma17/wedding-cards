"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { CONTACT_TOPICS, useSubmitContactMutation, type ContactTopic } from "@/redux/service/Contactservice";
import {SITE} from '@/lib/Siteconfig'

type FormState = {
  name: string;
  email: string;
  phone: string;
  topic: ContactTopic;
  message: string;
  company: string;
};

const EMPTY: FormState = { name: "", email: "", phone: "", topic: "payment", message: "", company: "" };

const inputClass =
  "w-full border border-border bg-white px-4 py-3 text-brand-deep placeholder:text-muted-foreground focus:border-brand-deep focus:outline-none";

const errorText = (e: unknown) => {
  const data = (e as FetchBaseQueryError | undefined)?.data as { message?: string } | undefined;
  return data?.message || "Something went wrong. Please try again.";
};

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-2 text-sm text-brand-deep">
      {label}
      {children}
      {error && <span className="text-xs text-red-600">{error}</span>}
    </label>
  );
}

export default function ContactForm() {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [serverError, setServerError] = useState("");
  const [submit, { isLoading, isSuccess, reset }] = useSubmitContactMutation();

  const update =
    (key: keyof FormState) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  const validate = () => {
    const next: Partial<Record<keyof FormState, string>> = {};
    if (form.name.trim().length < 2) next.name = "Please enter your name.";
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) next.email = "Please enter a valid email address.";
    if (form.message.trim().length < 10) next.message = "Please write at least 10 characters.";
    if (form.message.trim().length > 2000) next.message = "Please keep your message under 2000 characters.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setServerError("");
    if (!validate()) return;
    try {
      await submit({ ...form, phone: form.phone.trim() || undefined }).unwrap();
    } catch (err) {
      setServerError(errorText(err));
    }
  };

  if (isSuccess) {
    return (
      <div className="bg-brand-cream p-8 lg:p-10">
        <h2 className="font-serif text-3xl text-brand-deep">Message sent</h2>
        <p className="mt-3 text-muted-foreground">
          Thank you, {form.name.split(" ")[0]}. We’ll reply to {form.email} within {SITE.responseTime}.
        </p>
        <button
          type="button"
          onClick={() => {
            reset();
            setForm(EMPTY);
          }}
          className="mt-8 border border-brand-deep px-6 py-3 text-sm text-brand-deep transition-colors hover:bg-brand-deep hover:text-white"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Your name" error={errors.name}>
          <input className={inputClass} value={form.name} onChange={update("name")} autoComplete="name" />
        </Field>
        <Field label="Email" error={errors.email}>
          <input
            type="email"
            className={inputClass}
            value={form.email}
            onChange={update("email")}
            autoComplete="email"
          />
        </Field>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Phone (optional)">
          <input type="tel" className={inputClass} value={form.phone} onChange={update("phone")} autoComplete="tel" />
        </Field>
        <Field label="What is this about?">
          <select className={inputClass} value={form.topic} onChange={update("topic")}>
            {CONTACT_TOPICS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Message" error={errors.message}>
        <textarea rows={6} className={inputClass} value={form.message} onChange={update("message")} />
      </Field>

      {/* Honeypot: invisible to people, tempting to bots */}
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Company
          <input tabIndex={-1} autoComplete="off" value={form.company} onChange={update("company")} />
        </label>
      </div>

      {serverError && (
        <p role="alert" className="text-sm text-red-600">
          {serverError}
        </p>
      )}

      <div>
        <button
          type="submit"
          disabled={isLoading}
          className="bg-brand-deep px-8 py-3 text-sm text-white transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {isLoading ? "Sending..." : "Send message"}
        </button>
      </div>
    </form>
  );
}