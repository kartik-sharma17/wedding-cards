"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLazyGetDownloadUrlByShareTokenQuery } from "@/redux/service/documentService";
import { Download, FileText, Loader2, XCircle } from "lucide-react";

type ShareState = "loading" | "ready" | "error";

export default function SharedDocumentPage() {
  const params = useParams<{ token: string }>();
  const token = params?.token;

  const [getDownloadUrlByShareToken] = useLazyGetDownloadUrlByShareTokenQuery();
  const [state, setState] = useState<ShareState>("loading");
  const [fileName, setFileName] = useState("");
  const [downloadUrl, setDownloadUrl] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const hasRun = useRef(false);

  useEffect(() => {
    if (!token || hasRun.current) return;
    hasRun.current = true;

    (async () => {
      try {
        const res = await getDownloadUrlByShareToken(token).unwrap();
        setFileName(res.data.file_name);
        setDownloadUrl(res.data.download_url);
        setState("ready");

        // Kick off the download automatically; the button below covers
        // any browser that blocks the auto-redirect.
        window.location.href = res.data.download_url;
      } catch (err) {
        const message =
          (err as { data?: { message?: string } })?.data?.message ??
          "This share link is invalid or has expired.";
        setErrorMessage(message);
        setState("error");
      }
    })();
  }, [token, getDownloadUrlByShareToken]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link href="/" className="font-display text-3xl tracking-tight">
            VAULT
          </Link>
        </div>

        <Card className="border-border">
          <CardContent className="flex flex-col items-center px-6 py-10 text-center">
            {state === "loading" && (
              <>
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-secondary">
                  <Loader2 className="h-6 w-6 animate-spin" strokeWidth={1.5} />
                </div>
                <h1 className="text-lg font-semibold">Preparing your file</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Just a moment while we fetch the shared document.
                </p>
              </>
            )}

            {state === "ready" && (
              <>
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-secondary">
                  <FileText className="h-6 w-6" strokeWidth={1.5} />
                </div>
                <h1 className="text-lg font-semibold truncate max-w-full" title={fileName}>
                  {fileName}
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Your download should start automatically.
                </p>
                <Button className="mt-6 w-full gap-2">
                  <a className="flex gap-2 items-center" href={downloadUrl}>
                    <Download className="h-4 w-4" />
                    Click here if it doesn&apos;t
                  </a>
                </Button>
              </>
            )}

            {state === "error" && (
              <>
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-secondary">
                  <XCircle className="h-6 w-6" strokeWidth={1.5} />
                </div>
                <h1 className="text-lg font-semibold">Link unavailable</h1>
                <p className="mt-2 text-sm text-muted-foreground">{errorMessage}</p>
                <Button variant="outline" className="mt-6 w-full">
                  <Link href="/">Go home</Link>
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}