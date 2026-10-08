import type { ReactNode } from "react";

type Props = { title: string; text: string; children?: ReactNode };

export default function StatusMessage({ title, text, children }: Props) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-24 text-center">
      <h2 className="font-serif text-3xl text-brand-deep">{title}</h2>
      <p className="leading-relaxed text-muted-foreground">{text}</p>
      <div className="flex flex-wrap justify-center gap-3 pt-2">{children}</div>
    </div>
  );
}
