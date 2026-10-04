import Link from "next/link";

export default function Logo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" aria-label="Shaan home" className={`font-script text-4xl leading-none ${className}`}>
      Shaan
    </Link>
  );
}
