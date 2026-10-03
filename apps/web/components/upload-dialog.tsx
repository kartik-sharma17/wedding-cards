"use client";

import { useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Spinner } from "./spinner";
import { useConfirmUploadMutation, useCreateUploadRequestMutation } from "@/redux/service/documentService";
import { useGetAllFoldersQuery } from "@/redux/service/folderService";
import { uploadFileToPresignedUrl } from "@/lib/upload-file";
import { formatBytes } from "@/lib/utils";
import { FileIcon, UploadCloud, X, CheckCircle2, XCircle, Folder as FolderIcon } from "lucide-react";
import { generateThumbnail } from "@/lib/generate-thumbnail";

type UploadDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type UploadItemStatus = "requesting" | "uploading" | "confirming" | "done" | "error" | "cancelled";

type UploadItem = {
  id: string;
  file: File;
  status: UploadItemStatus;
  progress: number;
  errorMessage?: string;
  abort?: () => void;
  previewUrl?: string; // local blob URL, images only
};

export function UploadDialog({ open, onOpenChange }: UploadDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const searchParams = useSearchParams();
  const folderId = searchParams.get("folder"); // null = General

  const { data: foldersData } = useGetAllFoldersQuery();
  const currentFolderName = folderId
    ? foldersData?.data.find((f) => f.folder_id === folderId)?.name ?? "this folder"
    : "General";

  const [isPublic, setIsPublic] = useState(false);
  const [items, setItems] = useState<UploadItem[]>([]);

  const [createUploadRequest] = useCreateUploadRequestMutation();
  const [confirmUpload] = useConfirmUploadMutation();

  const isBusy = items.some(
    (i) => i.status === "requesting" || i.status === "uploading" || i.status === "confirming"
  );

  const updateItem = (id: string, patch: Partial<UploadItem>) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  };

  const removeItem = (id: string) => {
    setItems((prev) => {
      const target = prev.find((i) => i.id === id);
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((i) => i.id !== id);
    });
  };

  const uploadOne = async (item: UploadItem) => {
    try {
      updateItem(item.id, { status: "requesting" });

      const thumbnail = await generateThumbnail(item.file);

      const requestRes = await createUploadRequest({
        file_name: item.file.name,
        mime_type: item.file.type || "application/octet-stream",
        size: item.file.size,
        is_public: isPublic,
        folder_id: folderId,
        thumbnail,
      }).unwrap();

      const { document_id, upload_url } = requestRes.data;

      updateItem(item.id, { status: "uploading" });
      const { promise, abort } = uploadFileToPresignedUrl(upload_url, item.file, (pct) =>
        updateItem(item.id, { progress: pct })
      );
      updateItem(item.id, { abort });

      await promise;

      updateItem(item.id, { status: "confirming", abort: undefined });
      await confirmUpload(document_id).unwrap();

      updateItem(item.id, { status: "done" });
      toast.success(`${item.file.name} uploaded to ${currentFolderName}`);
    } catch (err) {
      if ((err as Error)?.name === "AbortError") {
        updateItem(item.id, { status: "cancelled", abort: undefined });
        return;
      }
      const message =
        (err as { data?: { detail?: { message?: string } } })?.data?.detail?.message ??
        "Upload failed";
      updateItem(item.id, { status: "error", errorMessage: message, abort: undefined });
      toast.error(`${item.file.name}: ${message}`);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    if (selected.length === 0) return;

    const newItems: UploadItem[] = selected.map((file) => ({
      id: `${file.name}-${file.size}-${Date.now()}-${Math.random()}`,
      file,
      status: "requesting",
      progress: 0,
      previewUrl: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined,
    }));

    setItems((prev) => [...prev, ...newItems]);
    newItems.forEach(uploadOne);
    e.target.value = "";
  };

  const handleClose = () => {
    if (isBusy) toast.info("Uploads keep running in the background");
    items.forEach((i) => i.previewUrl && URL.revokeObjectURL(i.previewUrl));
    setItems([]);
    setIsPublic(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(next) => (!next ? handleClose() : onOpenChange(next))}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload documents</DialogTitle>
          <DialogDescription className="flex items-center gap-1.5">
            <FolderIcon className="h-3.5 w-3.5" />
            Uploading to <span className="font-medium text-foreground">{currentFolderName}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex w-full flex-col items-center justify-center gap-2 rounded-md border border-dashed border-border py-8 text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
          >
            <UploadCloud className="h-6 w-6" strokeWidth={1.5} />
            <span className="text-sm font-medium">Click to choose files</span>
          </button>

          <input ref={inputRef} type="file" multiple className="hidden" onChange={handleFileSelect} />

          <div className="flex items-center justify-between rounded-md border border-border px-3 py-3">
            <div>
              <Label htmlFor="is-public" className="text-sm font-medium">
                Make public
              </Label>
              <p className="text-xs text-muted-foreground">Applies to files you add from now on.</p>
            </div>
            <Switch id="is-public" checked={isPublic} onCheckedChange={setIsPublic} />
          </div>

          {items.length > 0 && (
            <div className="max-h-72 space-y-2 overflow-y-auto">
              {items.map((item) => (
                <div key={item.id} className="rounded-md border border-border p-3">
                  <div className="flex items-center gap-3">
                    {item.previewUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.previewUrl}
                        alt={item.file.name}
                        className="h-16 w-16 shrink-0 rounded-md object-cover"
                      />
                    ) : (
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-md bg-secondary">
                        <FileIcon className="h-6 w-6 text-muted-foreground" strokeWidth={1.5} />
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{item.file.name}</p>
                      <p className="text-xs text-muted-foreground">{formatBytes(item.file.size)}</p>
                    </div>

                    {item.status === "done" && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                    {item.status === "error" && <XCircle className="h-4 w-4 text-destructive" />}
                    {["requesting", "uploading", "confirming"].includes(item.status) && (
                      <button type="button" onClick={() => item.abort?.()} title="Cancel upload">
                        <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                      </button>
                    )}
                    {["cancelled", "error", "done"].includes(item.status) && (
                      <button type="button" onClick={() => removeItem(item.id)}>
                        <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                      </button>
                    )}
                  </div>

                  {["requesting", "uploading", "confirming"].includes(item.status) && (
                    <div className="mt-2 space-y-1">
                      <Progress value={item.status === "uploading" ? item.progress : 100} />
                      <p className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Spinner className="h-3 w-3" />
                        {item.status === "requesting" && "Preparing…"}
                        {item.status === "uploading" && `Uploading… ${item.progress}%`}
                        {item.status === "confirming" && "Finalizing…"}
                      </p>
                    </div>
                  )}

                  {item.status === "cancelled" && <p className="mt-1 text-xs text-muted-foreground">Cancelled</p>}
                  {item.status === "error" && <p className="mt-1 text-xs text-destructive">{item.errorMessage}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}