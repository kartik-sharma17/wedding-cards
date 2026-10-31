"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import { Loader2 } from "lucide-react";
import Modal from "@/components/ui/Modal";
import BrandButton from "@/components/ui/BrandButton";
import FormAlert from "@/components/auth/FormAlert";
import Stepper from "./Stepper";
import EventStep from "./steps/EventStep";
import OrganiserStep from "./steps/OrganiserStep";
import VenueStep from "./steps/VenueStep";
import { useCreateCardForm } from "./useCreateCardForm";
import { buildCreateCardRequest, buildUpdateCardRequest } from "./buildPayload";
import { STEP_LABELS } from "./config";
import type { CardFormValues } from "./types";
import { useCreateCardMutation, useUpdateCardMutation } from "@/redux/service/cardService";
import type { TemplateSummary } from "@/redux/service/templateService";
import { clearToken, getApiErrorMessage, isUnauthorizedError } from "@/lib/auth";
import { CATEGORY_LABELS } from "@/lib/templates";
import { ROUTES } from "@/lib/routes";
import { EASE } from "@/lib/motion";

type Props = {
  open: boolean;
  onClose: () => void;
  template: Pick<TemplateSummary, "id" | "slug" | "templateName" | "category">;
  /** Set when editing a card that already exists (see EditCardDialog). */
  editing?: { cardId: string; initialValues: CardFormValues; onSaved: () => void };
};

const slide: Variants = {
  enter: (dir: number) => ({ opacity: 0, x: dir * 36 }),
  center: { opacity: 1, x: 0, transition: { duration: 0.4, ease: EASE } },
  exit: (dir: number) => ({ opacity: 0, x: dir * -36, transition: { duration: 0.2 } }),
};

const STEP_COMPONENTS = [EventStep, OrganiserStep, VenueStep];

export default function CreateCardDialog({ open, onClose, template, editing }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  // The form lives here (not inside Modal) so closing the dialog keeps what the person typed.
  const form = useCreateCardForm(template.category, editing?.initialValues);
  const [createCard, { isLoading: creating }] = useCreateCardMutation();
  const [updateCard, { isLoading: saving }] = useUpdateCardMutation();
  const [serverError, setServerError] = useState("");
  const [createdCardId, setCreatedCardId] = useState<string | null>(null); // set once a new card exists
  const [redirecting, setRedirecting] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  const isLast = form.step === STEP_LABELS.length - 1;
  const busy = creating || saving || redirecting || createdCardId !== null;
  const StepComponent = STEP_COMPONENTS[form.step];
  const label = CATEGORY_LABELS[template.category].toLowerCase();

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: 0 });
  }, [form.step]);

  const submit = async () => {
    setServerError("");
    if (!form.validateAll()) return;

    try {
      if (editing) {
        await updateCard({ cardId: editing.cardId, body: buildUpdateCardRequest(template.category, form.values) }).unwrap();
        editing.onSaved();
        return;
      }
      const res = await createCard(buildCreateCardRequest(template, form.values)).unwrap();
      setCreatedCardId(res.data.cardId); // the notice below explains the edit rules, then continues
    } catch (err) {
      if (isUnauthorizedError(err)) {
        clearToken();
        router.push(ROUTES.login(pathname));
        return;
      }
      setServerError(getApiErrorMessage(err, editing ? "We couldn't save your changes. Please try again." : "We couldn't create your card. Please try again."));
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (isLast) void submit();
    else form.goNext();
  };

  const openCreatedCard = () => {
    if (!createdCardId) return;
    setRedirecting(true);
    router.push(ROUTES.card(template.slug, createdCardId));
  };

  return (
    <Modal
      open={open}
      onClose={() => !busy && onClose()}
      hideClose={busy}
      closeOnOverlay={false}
      title={editing ? `Edit your ${label} card` : `Create your ${label} card`}
      description={editing ? `${template.templateName}. You can edit until the card is paid for.` : `Using the ${template.templateName} design`}
      headerExtra={<Stepper current={form.step} />}
    >
      <form onSubmit={onSubmit} noValidate className="flex min-h-0 flex-1 flex-col">
        <div ref={bodyRef} data-lenis-prevent className="flex-1 overflow-x-hidden overflow-y-auto border-t border-border px-6 py-6 sm:px-8">
          <AnimatePresence mode="wait" custom={form.direction} initial={false}>
            <motion.div key={form.step} custom={form.direction} variants={slide} initial="enter" animate="center" exit="exit">
              {StepComponent && <StepComponent form={form} category={template.category} />}
            </motion.div>
          </AnimatePresence>

          {serverError && (
            <div className="mt-6">
              <FormAlert>{serverError}</FormAlert>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-border bg-white px-6 py-4 sm:px-8">
          {form.step === 0 ? (
            <BrandButton variant="outline" onClick={onClose} disabled={busy}>
              Cancel
            </BrandButton>
          ) : (
            <BrandButton variant="outline" onClick={form.goBack} disabled={busy}>
              Back
            </BrandButton>
          )}

          <BrandButton type="submit" variant="deep" arrow={!isLast && !busy} disabled={busy}>
            {busy ? (
              <>
                <Loader2 className="size-4 animate-spin" /> {redirecting ? "Opening your card…" : editing ? "Saving…" : "Creating your card…"}
              </>
            ) : isLast ? (
              editing ? "Save changes" : "Create card"
            ) : (
              "Next"
            )}
          </BrandButton>
        </div>
      </form>

      {/* Shown once, right after a new card is created */}
      <Modal open={createdCardId !== null && !redirecting} onClose={() => {}} hideClose closeOnOverlay={false} size="sm" title="Your card is saved as a draft">
        <div className="flex flex-col gap-5 px-6 pb-6 sm:px-8 sm:pb-8">
          <ul className="flex flex-col gap-3 text-sm leading-relaxed text-muted-foreground">
            <li>You can edit this card from your dashboard any time before you pay for it.</li>
            <li>Once the payment is done, editing is locked. For any change after that, please contact our support team.</li>
            <li>You can delete the card at any time.</li>
          </ul>
          <BrandButton variant="deep" arrow onClick={openCreatedCard}>
            Got it, open my card
          </BrandButton>
        </div>
      </Modal>
    </Modal>
  );
}
