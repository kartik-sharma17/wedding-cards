"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { EASE } from "@/lib/motion";

// Shared across nested modals so closing the top one does not unlock the page early.
let scrollLocks = 0;
const lockScroll = () => {
  if (scrollLocks++ === 0) document.documentElement.style.overflow = "hidden";
};
const unlockScroll = () => {
  if (--scrollLocks === 0) document.documentElement.style.overflow = "";
};

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  /** "sm" is for confirmations and sits above any other open modal. */
  size?: "sm" | "lg";
  closeOnOverlay?: boolean;
  hideClose?: boolean;
  /** Rendered under the title, above the content (e.g. a stepper). */
  headerExtra?: ReactNode;
  children: ReactNode;
};

export default function Modal({
  open,
  onClose,
  title,
  description,
  size = "lg",
  closeOnOverlay = true,
  hideClose = false,
  headerExtra,
  children,
}: Props) {
  const [mounted, setMounted] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useEffect(() => setMounted(true), []);

  // Lock page scroll and manage focus while open.
  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    lockScroll();
    const frame = requestAnimationFrame(() => {
      const dialog = dialogRef.current;
      if (dialog && !dialog.contains(document.activeElement)) dialog.focus();
    });
    return () => {
      cancelAnimationFrame(frame);
      unlockScroll();
      previouslyFocused?.focus?.();
    };
  }, [open]);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") {
      e.stopPropagation(); // nested modals are React children, so keep Esc from closing the parent too
      if (!hideClose) onClose();
      return;
    }
    if (e.key !== "Tab") return;
    e.stopPropagation();
    const nodes = dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE);
    if (!nodes || nodes.length === 0) return;
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          data-lenis-prevent
          className={`fixed inset-0 flex items-end justify-center sm:items-center sm:p-6 ${size === "sm" ? "z-[110]" : "z-[100]"}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <div
            className="absolute inset-0 bg-brand-deep/70 backdrop-blur-sm"
            onClick={closeOnOverlay ? onClose : undefined}
            aria-hidden
          />
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
            onKeyDown={onKeyDown}
            initial={{ opacity: 0, y: 48 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 32 }}
            transition={{ duration: 0.45, ease: EASE }}
            className={`relative flex max-h-[94svh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl outline-none sm:rounded-lg ${
              size === "sm" ? "sm:max-w-md" : "sm:max-w-2xl"
            }`}
          >
            <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-4 sm:px-8">
              <div>
                <h2 id={titleId} className="font-serif text-3xl leading-tight text-brand-deep">
                  {title}
                </h2>
                {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
              </div>
              {!hideClose && (
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close"
                  className="-mt-1 -mr-2 rounded-full p-2 text-brand-deep/60 transition-colors hover:bg-brand-cream hover:text-brand-deep"
                >
                  <X className="size-5" />
                </button>
              )}
            </div>
            {headerExtra && <div className="px-6 pb-4 sm:px-8">{headerExtra}</div>}
            <div className="flex min-h-0 flex-1 flex-col">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
