"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import FormField from "@/components/auth/FormField";
import TextAreaField from "@/components/ui/TextAreaField";
import BrandButton from "@/components/ui/BrandButton";
import MapLinkField from "../MapLinkField";
import { FUNCTION_SUGGESTIONS, MAX_EXTRA_FUNCTIONS } from "../config";
import { todayLocalDate } from "@/lib/dates";
import type { StepProps } from "../types";

export default function VenueStep({ form, category }: StepProps) {
  const { values, errors, setField, addEvent, removeEvent, updateEvent } = form;
  // Other functions (mehendi, sangeet…) only make sense for weddings.
  const allowFunctions = category === "wedding";
  const [showFunctions, setShowFunctions] = useState(values.events.length > 0);

  const openFunctions = () => {
    setShowFunctions(true);
    if (values.events.length === 0) addEvent();
  };

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-5">
        <FormField
          label="Venue name (optional)"
          placeholder="The Grand Palace"
          value={values.venueName}
          onChange={(e) => setField("venueName", e.target.value)}
          autoFocus
        />
        <TextAreaField
          label="Address (optional)"
          rows={2}
          placeholder="Street, area, city"
          value={values.venueAddress}
          onChange={(e) => setField("venueAddress", e.target.value)}
        />
        <MapLinkField form={form} />
      </section>

      {allowFunctions && (
        <section className="flex flex-col gap-4">
          <div>
            <h3 className="font-serif text-2xl text-brand-deep">Other functions</h3>
            <p className="text-sm text-muted-foreground">
              Mehendi, haldi, sangeet and more, each with its own date and place.
            </p>
          </div>

          {showFunctions && (
            <>
              <datalist id="function-suggestions">
                {FUNCTION_SUGGESTIONS.map((f) => (
                  <option key={f} value={f} />
                ))}
              </datalist>
              <ul className="flex flex-col gap-4">
                {values.events.map((row, i) => (
                  <li key={row.id} className="flex flex-col gap-4 border border-border bg-brand-cream/50 p-4">
                    <div className="grid gap-4 sm:grid-cols-3">
                      <FormField
                        label="Function"
                        list="function-suggestions"
                        placeholder="Sangeet"
                        value={row.name}
                        onChange={(e) => updateEvent(row.id, { name: e.target.value })}
                        error={errors[`events.${i}.name`]}
                      />
                      <FormField
                        label="Date"
                        type="date"
                        min={todayLocalDate()}
                        value={row.date}
                        onChange={(e) => updateEvent(row.id, { date: e.target.value })}
                        error={errors[`events.${i}.date`]}
                      />
                      <FormField
                        label="Start time"
                        type="time"
                        value={row.startTime}
                        onChange={(e) => updateEvent(row.id, { startTime: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField
                        label="Venue name"
                        value={row.venueName}
                        onChange={(e) => updateEvent(row.id, { venueName: e.target.value })}
                      />
                      <FormField
                        label="Venue address"
                        value={row.venueAddress}
                        onChange={(e) => updateEvent(row.id, { venueAddress: e.target.value })}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeEvent(row.id)}
                      className="flex items-center gap-2 self-end text-sm text-brand-deep/70 transition-colors hover:text-destructive"
                    >
                      <Trash2 className="size-4" /> Remove
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}

          {(!showFunctions || values.events.length < MAX_EXTRA_FUNCTIONS) && (
            <BrandButton variant="outline" onClick={showFunctions ? addEvent : openFunctions} className="self-start !px-4 !py-2.5">
              <Plus className="size-4" /> {showFunctions ? "Add another function" : "Add a function"}
            </BrandButton>
          )}
        </section>
      )}

      <TextAreaField
        label="Anything guests should know? (optional)"
        placeholder="Parking, travel, stay or timing details"
        value={values.additionalNotes}
        onChange={(e) => setField("additionalNotes", e.target.value)}
      />
    </div>
  );
}
