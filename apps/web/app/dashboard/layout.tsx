"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { UploadDialogProvider, useUploadDialog } from "@/contexts/upload-dialog-context";
import { UploadDialog } from "@/components/upload-dialog";
import { Suspense } from "react";

function DashboardShell({ children }: { children: React.ReactNode }) {
  const { open, setOpen } = useUploadDialog();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Suspense fallback={null}>
      <AppSidebar />
    </Suspense>
      <main className="flex-1 overflow-y-auto px-6 py-8 md:px-10 md:py-10">
        {children}
      </main>
      <Suspense fallback={null}>
      <UploadDialog open={open} onOpenChange={setOpen} />
    </Suspense>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // No client-side auth check here — middleware.ts already verifies the
  // "token" cookie server-side and redirects to /login before this layout
  // ever renders, so there's no flash of protected content to guard against.
  return (
    <UploadDialogProvider>
      <DashboardShell>{children}</DashboardShell>
    </UploadDialogProvider>
  );
}