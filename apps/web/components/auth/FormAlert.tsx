import type { ReactNode } from "react";

export default function FormAlert({ children }: { children: ReactNode }) {
  return (
    <div role="alert" className="rounded-[2px] border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
      {children}
    </div>
  );
}
