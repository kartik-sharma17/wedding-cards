"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGenerateShareTokenMutation } from "@/redux/service/documentService";
import { Copy, Loader2, Check } from "lucide-react";

const EXPIRY_OPTIONS = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60];

type ShareLinkDialogProps = {
  documentId: string;
  fileName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ShareLinkDialog({
  documentId,
  fileName,
  open,
  onOpenChange,
}: ShareLinkDialogProps) {
  const [expiryMinutes, setExpiryMinutes] = useState("5");
  const [shareUrl, setShareUrl] = useState("");
  const [copied, setCopied] = useState(false);

  const [generateShareToken, { isLoading }] = useGenerateShareTokenMutation();

  const handleGenerate = async () => {
    setCopied(false);
    try {
      const res = await generateShareToken({
        documentId,
        expiresMinutes: Number(expiryMinutes),
      }).unwrap();

      const origin = typeof window !== "undefined" ? window.location.origin : "";
      setShareUrl(`${origin}/shared/${res.data.share_token}`);
    } catch (err){
            const message =
        (err as { data?: { detail?: { message?: string } }  })?.data?.detail?.message ??
        "Invalid email or password";
      toast.error(message);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success("Link copied");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setShareUrl("");
      setCopied(false);
    }
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Get share link</DialogTitle>
          <DialogDescription className="truncate">
            Create a temporary link for &ldquo;{fileName}&rdquo;.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Expires after</Label>
            <Select value={expiryMinutes} onValueChange={(value) => {
    if (value !== null) {
      setExpiryMinutes(value);
    }
  }} disabled={isLoading}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EXPIRY_OPTIONS.map((minutes) => (
                  <SelectItem key={minutes} value={String(minutes)}>
                    {minutes} minutes
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isLoading && (
            <div className="flex items-center justify-center gap-2 rounded-md border border-border py-6 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating link…
            </div>
          )}

          {!isLoading && shareUrl && (
            <div className="space-y-2">
              <Label>Share link</Label>
              <div className="flex items-center gap-2">
                <Input readOnly value={shareUrl} className="text-sm" />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleCopy}
                  aria-label="Copy link"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Expires in {expiryMinutes} minutes.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Close
          </Button>
          <Button onClick={handleGenerate} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {shareUrl ? "Generate new link" : "Generate link"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
