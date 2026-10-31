"use client";

import { useCallback, useState } from "react";
import type { TemplateCategory } from "@/redux/service/templateService";
import { INITIAL_VALUES, type CardFormValues, type EventRow, type FormErrors } from "./types";
import { validateStep } from "./validate";
import { STEP_LABELS } from "./config";

const newRow = (): EventRow => ({
  id: crypto.randomUUID(),
  name: "",
  date: "",
  startTime: "",
  venueName: "",
  venueAddress: "",
});

export function useCreateCardForm(category: TemplateCategory, initialValues?: CardFormValues) {
  const [values, setValues] = useState<CardFormValues>(initialValues ?? INITIAL_VALUES);
  const [initial] = useState(initialValues); // lets validation tell an unchanged event date from a new one
  const [errors, setErrors] = useState<FormErrors>({});
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);

  const clearError = useCallback((key: string) => {
    setErrors((prev) => {
      if (!(key in prev)) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const setField = useCallback(
    <K extends keyof CardFormValues>(key: K, value: CardFormValues[K]) => {
      setValues((prev) => ({ ...prev, [key]: value }));
      clearError(key);
    },
    [clearError],
  );

  const addEvent = () => setValues((prev) => ({ ...prev, events: [...prev.events, newRow()] }));
  const removeEvent = (id: string) =>
    setValues((prev) => ({ ...prev, events: prev.events.filter((e) => e.id !== id) }));
  const updateEvent = (id: string, patch: Partial<EventRow>) => {
    setValues((prev) => ({ ...prev, events: prev.events.map((e) => (e.id === id ? { ...e, ...patch } : e)) }));
    setErrors({});
  };

  const goNext = (): boolean => {
    const found = validateStep(step, values, category, initial);
    setErrors(found);
    if (Object.keys(found).length) return false;
    setDirection(1);
    setStep((s) => Math.min(s + 1, STEP_LABELS.length - 1));
    return true;
  };

  const goBack = () => {
    setErrors({});
    setDirection(-1);
    setStep((s) => Math.max(s - 1, 0));
  };

  /** Validates every step. Returns true when all are valid, otherwise jumps to the first bad step. */
  const validateAll = (): boolean => {
    for (let i = 0; i < STEP_LABELS.length; i++) {
      const found = validateStep(i, values, category, initial);
      if (Object.keys(found).length) {
        setErrors(found);
        setDirection(i < step ? -1 : 1);
        setStep(i);
        return false;
      }
    }
    return true;
  };

  return { values, errors, step, direction, setField, addEvent, removeEvent, updateEvent, goNext, goBack, validateAll };
}

export type CreateCardForm = ReturnType<typeof useCreateCardForm>;
