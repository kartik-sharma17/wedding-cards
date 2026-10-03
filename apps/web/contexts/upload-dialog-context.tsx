"use client";

import { createContext, useContext, useMemo, useState } from "react";

type UploadDialogContextValue = {
  open: boolean;
  openDialog: () => void;
  closeDialog: () => void;
  setOpen: (open: boolean) => void;
};

const UploadDialogContext = createContext<UploadDialogContextValue | null>(null);

export function UploadDialogProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  const value = useMemo(
    () => ({
      open,
      openDialog: () => setOpen(true),
      closeDialog: () => setOpen(false),
      setOpen,
    }),
    [open]
  );

  return (
    <UploadDialogContext.Provider value={value}>
      {children}
    </UploadDialogContext.Provider>
  );
}

export function useUploadDialog() {
  const ctx = useContext(UploadDialogContext);
  if (!ctx) {
    throw new Error("useUploadDialog must be used within UploadDialogProvider");
  }
  return ctx;
}
