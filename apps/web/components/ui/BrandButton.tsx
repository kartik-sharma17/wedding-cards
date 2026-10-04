import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { ArrowRight } from "lucide-react";

type Variant = "deep" | "gold" | "outline" | "outlineLight";

const VARIANTS: Record<Variant, string> = {
  deep: "bg-brand-deep text-white hover:bg-brand-teal",
  gold: "bg-brand-gold text-brand-deep hover:bg-white",
  outline: "border border-brand-deep text-brand-deep hover:bg-brand-deep hover:text-white",
  outlineLight: "border border-white/70 text-white hover:bg-white hover:text-brand-deep",
};

type Props = {
  variant?: Variant;
  arrow?: boolean;
  href?: string;
  className?: string;
  children: ReactNode;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children">;

export default function BrandButton({
  variant = "deep",
  arrow = false,
  href,
  className = "",
  children,
  ...rest
}: Props) {
  const classes = `group inline-flex items-center justify-center gap-3 rounded-[2px] px-7 py-3.5 text-sm font-medium tracking-wide transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-gold disabled:pointer-events-none disabled:opacity-60 ${VARIANTS[variant]} ${className}`;

  const content = (
    <>
      {children}
      {arrow && <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={classes}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" className={classes} {...rest}>
      {content}
    </button>
  );
}
