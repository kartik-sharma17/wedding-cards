"use client";

import FormField from "@/components/auth/FormField";
import SelectField from "@/components/ui/SelectField";
import TextAreaField from "@/components/ui/TextAreaField";
import { isWeddingStyle } from "@/lib/templates";
import { nowLocalInput } from "@/lib/dates";
import {
  BABY_SHOWER_THEMES,
  BIRTHDAY_THEMES,
  CATEGORY_COPY,
  DRESS_CODE_OPTIONS,
  LANGUAGE_OPTIONS,
} from "../config";
import type { StepProps } from "../types";

export default function EventStep({ form, category }: StepProps) {
  const { values, errors, setField } = form;
  const copy = CATEGORY_COPY[category];
  const wedding = isWeddingStyle(category);
  const themes = category === "birthday" ? BIRTHDAY_THEMES : BABY_SHOWER_THEMES;

  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <FormField
        label={copy.nameOneLabel}
        placeholder={copy.nameOnePlaceholder}
        value={values.nameOne}
        onChange={(e) => setField("nameOne", e.target.value)}
        error={errors.nameOne}
        autoComplete="off"
        autoFocus
      />
      {wedding && (
        <FormField
          label={copy.nameTwoLabel ?? "Second name"}
          placeholder={copy.nameTwoPlaceholder}
          value={values.nameTwo}
          onChange={(e) => setField("nameTwo", e.target.value)}
          error={errors.nameTwo}
          autoComplete="off"
        />
      )}

      <div className="sm:col-span-2">
        <FormField
          label={copy.dateLabel}
          type="datetime-local"
          min={nowLocalInput()}
          value={values.eventDate}
          onChange={(e) => setField("eventDate", e.target.value)}
          error={errors.eventDate}
        />
      </div>

      {category === "anniversary" && (
        <FormField
          label="Years together (optional)"
          type="number"
          inputMode="numeric"
          min={1}
          max={100}
          placeholder="25"
          value={values.yearsTogether}
          onChange={(e) => setField("yearsTogether", e.target.value)}
          error={errors.yearsTogether}
        />
      )}
      {category === "birthday" && (
        <FormField
          label="Turning (optional)"
          type="number"
          inputMode="numeric"
          min={0}
          max={120}
          placeholder="5"
          value={values.celebrantAge}
          onChange={(e) => setField("celebrantAge", e.target.value)}
          error={errors.celebrantAge}
        />
      )}
      {(category === "birthday" || category === "baby_shower") && (
        <SelectField
          label="Theme (optional)"
          placeholder="Choose a theme"
          options={themes}
          value={values.theme}
          onChange={(v) => setField("theme", v)}
        />
      )}
      {(category === "wedding" || category === "reception") && (
        <FormField
          label="Couple hashtag (optional)"
          placeholder="#AnanyaWedsRohan"
          value={values.coupleHashtag}
          onChange={(e) => setField("coupleHashtag", e.target.value)}
        />
      )}

      <SelectField
        label="Card language"
        options={LANGUAGE_OPTIONS}
        placeholder="Choose a language"
        value={values.language}
        onChange={(v) => setField("language", v)}
      />
      <SelectField
        label="Dress code (optional)"
        placeholder="No preference"
        options={DRESS_CODE_OPTIONS}
        value={values.dressCode}
        onChange={(v) => setField("dressCode", v)}
      />

      <div className="sm:col-span-2">
        <TextAreaField
          label="Message to your guests (optional)"
          placeholder="We would be delighted to have you celebrate with us."
          value={values.invitationMessage}
          onChange={(e) => setField("invitationMessage", e.target.value)}
        />
      </div>
    </div>
  );
}
