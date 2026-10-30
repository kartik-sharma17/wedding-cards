import Link from "next/link";

export default function Logo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" aria-label="Festa Cards home" className={`font-script text-4xl leading-none ${className}`}>
      Festa
    </Link>
  );
}
