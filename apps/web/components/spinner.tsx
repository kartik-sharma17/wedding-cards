import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn("h-4 w-4 animate-spin", className)} />;
}

export function InlineLoader({ label }: { label?: string }) {
  return (
    <span className="flex items-center gap-2 text-xs text-muted-foreground">
      <Spinner className="h-3 w-3" />
      {label}
    </span>
  );
}