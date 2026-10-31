"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import Modal from "@/components/ui/Modal";
import BrandButton from "@/components/ui/BrandButton";
import CreateCardDialog from "./CreateCardDialog";
import { detailsToFormValues } from "./mapCardToForm";
import { useGetCardQuery, type CardPayload } from "@/redux/service/cardService";
import { getApiErrorMessage } from "@/lib/auth";

type Props = {
  cardId: string;
  templateName: string;
  templateSlug: string | null;
  onClose: () => void;
  onSaved: () => void;
};

/** Loads the saved card, then opens the same form used for creating, pre-filled. */
export default function EditCardDialog({ cardId, templateName, templateSlug, onClose, onSaved }: Props) {
  const { data, isFetching, isError, error, refetch } = useGetCardQuery(cardId, { refetchOnMountOrArgChange: true });

  // Keep the first fresh copy so a refetch after saving can't reset the form mid-edit.
  const [loaded, setLoaded] = useState<CardPayload | null>(null);
  useEffect(() => {
    if (!loaded && data?.data && !isFetching) setLoaded(data.data);
  }, [data, isFetching, loaded]);

  const initialValues = useMemo(() => (loaded ? detailsToFormValues(loaded.details) : null), [loaded]);

  if (!loaded || !initialValues) {
    return (
      <Modal open onClose={onClose} size="sm" title={isError ? "We couldn't open this card" : "Opening your card…"}>
        <div className="flex flex-col gap-5 px-6 pb-6 sm:px-8 sm:pb-8">
          {isError ? (
            <>
              <p className="leading-relaxed text-muted-foreground">{getApiErrorMessage(error, "Please try again.")}</p>
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <BrandButton variant="outline" onClick={onClose}>
                  Close
                </BrandButton>
                <BrandButton variant="deep" onClick={() => refetch()}>
                  Try again
                </BrandButton>
              </div>
            </>
          ) : (
            <Loader2 className="mx-auto size-6 animate-spin text-brand-teal" aria-label="Loading" />
          )}
        </div>
      </Modal>
    );
  }

  // Safety net: the dashboard already disables Edit for paid cards.
  if (loaded.card.isPaid) {
    return (
      <Modal open onClose={onClose} size="sm" title="Editing is locked">
        <div className="flex flex-col gap-5 px-6 pb-6 sm:px-8 sm:pb-8">
          <p className="leading-relaxed text-muted-foreground">
            This card has been paid for, so it can no longer be edited. Please contact our support team for any changes.
          </p>
          <BrandButton variant="deep" onClick={onClose}>
            Close
          </BrandButton>
        </div>
      </Modal>
    );
  }

  return (
    <CreateCardDialog
      open
      onClose={onClose}
      template={{ id: loaded.details.templateId, slug: templateSlug ?? "", templateName, category: loaded.details.templateCategory }}
      editing={{ cardId, initialValues, onSaved }}
    />
  );
}
