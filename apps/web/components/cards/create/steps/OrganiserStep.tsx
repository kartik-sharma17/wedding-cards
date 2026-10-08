"use client";

import FormField from "@/components/auth/FormField";
import SelectField from "@/components/ui/SelectField";
import { isWeddingStyle } from "@/lib/templates";
import { todayLocalDate } from "@/lib/dates";
import { HOST_LINE_OPTIONS } from "../config";
import { CUSTOM_HOST_LINE, type StepProps } from "../types";

export default function OrganiserStep({ form, category }: StepProps) {
  const { values, errors, setField } = form;
  const wedding = isWeddingStyle(category);
  const showFamilies = wedding && category !== "anniversary";

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-5">
        <div>
          <h3 className="font-serif text-2xl text-brand-deep">Hosted by</h3>
          <p className="text-sm text-muted-foreground">Who is inviting the guests?</p>
        </div>

        {wedding ? (
          <>
            <SelectField
              label="Opening line (optional)"
              placeholder="Choose a line"
              options={[...HOST_LINE_OPTIONS, { value: CUSTOM_HOST_LINE, label: "Write my own…" }]}
              value={values.hostLinePreset}
              onChange={(v) => setField("hostLinePreset", v)}
            />
            {values.hostLinePreset === CUSTOM_HOST_LINE && (
              <FormField
                label="Your opening line"
                placeholder="Together with our families, we invite you"
                value={values.hostLine}
                onChange={(e) => setField("hostLine", e.target.value)}
                error={errors.hostLine}
                autoFocus
              />
            )}
            {showFamilies && (
              <div className="grid gap-5 sm:grid-cols-2">
                <FormField
                  label="Bride's parents (optional)"
                  placeholder="Mr. & Mrs. Sharma"
                  value={values.brideParents}
                  onChange={(e) => setField("brideParents", e.target.value)}
                />
                <FormField
                  label="Groom's parents (optional)"
                  placeholder="Mr. & Mrs. Mehta"
                  value={values.groomParents}
                  onChange={(e) => setField("groomParents", e.target.value)}
                />
              </div>
            )}
          </>
        ) : (
          <FormField
            label="Hosted by (optional)"
            placeholder="Neha & Amit Verma"
            value={values.parentNames}
            onChange={(e) => setField("parentNames", e.target.value)}
          />
        )}
      </section>

      <section className="flex flex-col gap-5">
        <div>
          <h3 className="font-serif text-2xl text-brand-deep">Who should guests contact?</h3>
          <p className="text-sm text-muted-foreground">Shown on the card so guests can confirm their attendance.</p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField
            label="Contact name (optional)"
            placeholder="Rohan Mehta"
            autoComplete="off"
            value={values.rsvpContactName}
            onChange={(e) => setField("rsvpContactName", e.target.value)}
          />
          <FormField
            label="Phone (optional)"
            type="tel"
            placeholder="98765 43210"
            value={values.rsvpPhone}
            onChange={(e) => setField("rsvpPhone", e.target.value)}
            error={errors.rsvpPhone}
          />
          <FormField
            label="Email (optional)"
            type="email"
            placeholder="you@example.com"
            value={values.rsvpEmail}
            onChange={(e) => setField("rsvpEmail", e.target.value)}
            error={errors.rsvpEmail}
          />
          <FormField
            label="Reply by (optional)"
            type="date"
            min={todayLocalDate()}
            max={values.eventDate ? values.eventDate.slice(0, 10) : undefined}
            value={values.rsvpByDate}
            onChange={(e) => setField("rsvpByDate", e.target.value)}
            error={errors.rsvpByDate}
          />
        </div>
      </section>
    </div>
  );
}
