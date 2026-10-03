"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RotateCw } from "lucide-react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm text-center">
        <Link href="/" className="font-display text-3xl tracking-tight">
          VAULT
        </Link>

        <div className="mt-10 flex flex-col items-center">
          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-secondary">
            <AlertTriangle className="h-6 w-6" strokeWidth={1.5} />
          </div>

          <h1 className="font-display text-2xl">SOMETHING WENT WRONG</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            An unexpected error occurred. You can try again, or head back
            home.
          </p>

          {error.digest && (
            <p className="mt-3 text-xs text-muted-foreground">
              Reference: {error.digest}
            </p>
          )}

          <div className="mt-8 flex w-full items-center gap-3">
            <Button variant="outline" className="flex-1">
              <Link href="/">Go home</Link>
            </Button>
            <Button className="flex-1 gap-2" onClick={() => reset()}>
              <RotateCw className="h-4 w-4" />
              Try again
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}