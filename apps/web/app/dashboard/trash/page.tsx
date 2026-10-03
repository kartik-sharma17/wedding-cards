"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useGetTrashQuery, useRestoreDocumentMutation, usePermanentlyDeleteDocumentMutation } from "@/redux/service/documentService";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Spinner } from "@/components/spinner";
import { formatBytes, formatDate } from "@/lib/utils";
import { RotateCcw, Trash2, File as FileIcon, FileImage, FileText, FileSpreadsheet } from "lucide-react";

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith("image/")) return FileImage;
  if (mimeType.includes("sheet") || mimeType.includes("csv")) return FileSpreadsheet;
  if (mimeType.includes("pdf") || mimeType.includes("text")) return FileText;
  return FileIcon;
}

export default function TrashPage() {
  const { data, isLoading, isError } = useGetTrashQuery();
  const [restoreDocument, { isLoading: isRestoring }] = useRestoreDocumentMutation();
  const [permanentlyDeleteDocument, { isLoading: isDeleting }] = usePermanentlyDeleteDocumentMutation();
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const items = data?.data ?? [];

  const handleRestore = async (documentId: string) => {
    try {
      const res = await restoreDocument(documentId).unwrap();
      toast.success(res.message);
    } catch {
      toast.error("Couldn't restore document");
    }
  };

  const handlePermanentDelete = async () => {
    if (!confirmDeleteId) return;
    try {
      const res = await permanentlyDeleteDocument(confirmDeleteId).unwrap();
      toast.success(res.message);
    } catch {
      toast.error("Couldn't delete document");
    } finally {
      setConfirmDeleteId(null);
    }
  };

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-8">
        <h1 className="font-display text-3xl">TRASH</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Documents you&apos;ve deleted. Restore them or delete permanently.
        </p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-lg" />
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-lg border border-border py-16 text-center text-sm text-muted-foreground">
          Couldn&apos;t load trash. Try refreshing the page.
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border py-16 text-center">
          <p className="text-sm font-medium">Trash is empty.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((doc) => {
            const Icon = getFileIcon(doc.mime_type);
            return (
              <div key={doc.document_id} className="overflow-hidden rounded-xl border border-border bg-card">
                <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-secondary/40">
                  {doc.thumbnail_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={doc.thumbnail_url}
                      alt={doc.file_name}
                      className="h-full w-full object-cover opacity-60 grayscale"
                    />
                  ) : (
                    <Icon className="h-10 w-10 text-muted-foreground/40" strokeWidth={1.25} />
                  )}
                </div>

                <div className="p-3">
                  <p className="truncate text-sm font-medium" title={doc.file_name}>
                    {doc.file_name}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {formatBytes(doc.size)} · Deleted {formatDate(doc.deleted_at ?? doc.updated_at ?? doc.created_at)}
                  </p>

                  <div className="mt-3 flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 gap-1.5"
                      onClick={() => handleRestore(doc.document_id)}
                      disabled={isRestoring}
                    >
                      {isRestoring ? <Spinner className="h-3.5 w-3.5" /> : <RotateCcw className="h-3.5 w-3.5" />}
                      Restore
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 text-destructive hover:text-destructive"
                      onClick={() => setConfirmDeleteId(doc.document_id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AlertDialog open={confirmDeleteId !== null} onOpenChange={(open) => !open && setConfirmDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete permanently?</AlertDialogTitle>
            <AlertDialogDescription>
              This can&apos;t be undone. The file will be removed from storage forever.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handlePermanentDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? <Spinner className="mr-2 h-4 w-4" /> : null}
              Delete forever
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}