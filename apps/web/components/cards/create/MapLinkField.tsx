"use client";

import { useState } from "react";
import { Lock, MapPin, X } from "lucide-react";
import FormField from "@/components/auth/FormField";
import Modal from "@/components/ui/Modal";
import BrandButton from "@/components/ui/BrandButton";
import type { CreateCardForm } from "./useCreateCardForm";

export default function MapLinkField({ form }: { form: CreateCardForm }) {
  const { values, errors, setField } = form;
  const [confirmOpen, setConfirmOpen] = useState(false);

  const enable = () => {
    setField("mapEnabled", true);
    setConfirmOpen(false);
  };

  const remove = () => {
    setField("mapEnabled", false);
    setField("mapUrl", "");
  };

  if (!values.mapEnabled) {
    return (
      <>
        <div className="flex flex-wrap items-center justify-between gap-4 border border-dashed border-brand-deep/25 bg-brand-cream/60 p-4">
          <div className="flex items-center gap-3">
            <MapPin className="size-5 text-brand-teal" />
            <div>
              <p className="text-sm font-medium text-brand-deep">Google Maps location</p>
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Lock className="size-3" /> Paid feature
              </p>
            </div>
          </div>
          <BrandButton variant="outline" onClick={() => setConfirmOpen(true)} className="!px-4 !py-2">
            Add map link
          </BrandButton>
        </div>

        <Modal
          open={confirmOpen}
          onClose={() => setConfirmOpen(false)}
          size="sm"
          title="Map link is a paid feature"
        >
          <div className="flex flex-col gap-6 px-6 pb-6 sm:px-8 sm:pb-8">
            <p className="leading-relaxed text-muted-foreground">
              You can add your Google Maps link now, but it will only show on your card after you pay. Sharing your card
              stays free either way.
            </p>
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <BrandButton variant="outline" onClick={() => setConfirmOpen(false)}>
                Not now
              </BrandButton>
              <BrandButton variant="deep" onClick={enable}>
                Yes, add map link
              </BrandButton>
            </div>
          </div>
        </Modal>
      </>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-end gap-3">
        <div className="flex-1">
          <FormField
            label="Google Maps link"
            type="url"
            placeholder="https://maps.app.goo.gl/…"
            value={values.mapUrl}
            onChange={(e) => setField("mapUrl", e.target.value)}
            error={errors.mapUrl}
            autoFocus
          />
        </div>
        <button
          type="button"
          onClick={remove}
          aria-label="Remove map link"
          className="mb-1 rounded-full p-3 text-brand-deep/60 transition-colors hover:bg-brand-cream hover:text-brand-deep"
        >
          <X className="size-5" />
        </button>
      </div>
      <p className="flex items-start gap-2 bg-brand-gold/15 px-3 py-2 text-sm text-brand-deep">
        <Lock className="mt-0.5 size-4 shrink-0" />
        This link will show on your card once you&apos;ve paid.
      </p>
    </div>
  );
}
