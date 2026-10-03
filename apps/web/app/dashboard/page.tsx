"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useGetFolderContentsQuery } from "@/redux/service/folderService";
import { useGetAllDocumentsQuery } from "@/redux/service/documentService";
import { useUploadDialog } from "@/contexts/upload-dialog-context";
import { DocumentCard } from "@/components/document-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { formatBytes } from "@/lib/utils";
import { FileStack, HardDrive, Globe, Search, UploadCloud, Folder as FolderIcon } from "lucide-react";

const STORAGE_LIMIT_BYTES = 2 * 1024 * 1024 * 1024; // 2GB

function DashboardContent() {
  const searchParams = useSearchParams();
  const folderId = searchParams.get("folder"); // null = General

  const { data, isLoading, isError } = useGetFolderContentsQuery(folderId);
  const { data: allDocsData, isLoading: isLoadingAll } = useGetAllDocumentsQuery();
  const { openDialog } = useUploadDialog();
  const [search, setSearch] = useState("");

  const documents = useMemo(() => data?.data.documents ?? [], [data]);
  const subfolders = useMemo(() => data?.data.folders ?? [], [data]);
  const allDocuments = useMemo(() => allDocsData?.data ?? [], [allDocsData]);

  // Global stats (account-wide), used regardless of which folder is open
  const globalStats = useMemo(() => {
    const totalDocuments = allDocuments.length;
    const totalBytes = allDocuments.reduce((sum, doc) => sum + (doc.size || 0), 0);
    const publicDocuments = allDocuments.filter((doc) => doc.is_public).length;
    return { totalDocuments, totalBytes, publicDocuments };
  }, [allDocuments]);

  const filteredDocuments = useMemo(() => {
    if (!search.trim()) return documents;
    return documents.filter((doc) =>
      doc.file_name.toLowerCase().includes(search.trim().toLowerCase())
    );
  }, [documents, search]);

  const storagePercent = Math.min(
    100,
    Math.round((globalStats.totalBytes / STORAGE_LIMIT_BYTES) * 100)
  );

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl">
            {folderId ? "FOLDER" : "DASHBOARD"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {folderId
              ? "Everything inside this folder."
              : "Everything you've uploaded, in one place."}
          </p>
        </div>
        <Button onClick={openDialog} className="gap-2">
          <UploadCloud className="h-4 w-4" />
          Upload document
        </Button>
      </div>

      {/* Stat cards — always account-wide, not scoped to the open folder */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={FileStack}
          label="Documents uploaded"
          value={isLoadingAll ? null : String(globalStats.totalDocuments)}
        />
        <StatCard
          icon={HardDrive}
          label="Storage used"
          value={isLoadingAll ? null : formatBytes(globalStats.totalBytes)}
        />
        <StatCard
          icon={Globe}
          label="Public documents"
          value={isLoadingAll ? null : String(globalStats.publicDocuments)}
        />
      </div>

      {/* Storage progress bar — 2GB cap, account-wide */}
      <div className="mb-10 rounded-lg border border-border p-5">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium">Storage</span>
          <span className="text-muted-foreground">
            {isLoadingAll ? (
              <Skeleton className="h-4 w-24" />
            ) : (
              `${formatBytes(globalStats.totalBytes)} of ${formatBytes(STORAGE_LIMIT_BYTES)} used`
            )}
          </span>
        </div>
        <Progress
          value={isLoadingAll ? 0 : storagePercent}
          className={storagePercent >= 90 ? "[&>div]:bg-destructive" : undefined}
        />
        {storagePercent >= 90 && (
          <p className="mt-2 text-xs text-destructive">
            You&apos;re almost out of storage. Delete some documents to free up space.
          </p>
        )}
      </div>

      {/* Search */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold">
          {folderId ? "Folder contents" : "Your documents"}
        </h2>
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search documents…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-lg" />
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-lg border border-border py-16 text-center text-sm text-muted-foreground">
          Couldn&apos;t load this folder. Try refreshing the page.
        </div>
      ) : (
        <>
          {subfolders.length > 0 && !search && (
            <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {subfolders.map((folder) => (
                <a
                  key={folder.folder_id}
                  href={`?folder=${folder.folder_id}`}
                  className="flex items-center gap-3 rounded-lg border border-border p-4 transition-colors hover:border-foreground"
                >
                  <FolderIcon className="h-5 w-5 text-muted-foreground" strokeWidth={1.5} />
                  <span className="truncate text-sm font-medium">{folder.name}</span>
                </a>
              ))}
            </div>
          )}

          {filteredDocuments.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border py-16 text-center">
              <p className="text-sm font-medium">
                {search ? "No documents match your search." : "No documents in this folder yet."}
              </p>
              {!search && (
                <Button variant="outline" className="mt-4" onClick={openDialog}>
                  Upload a document
                </Button>
              )}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredDocuments.map((document) => (
                <DocumentCard
                  key={document.document_id}
                  document={document}
                  currentFolderId={folderId}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string | null;
}) {
  return (
    <div className="rounded-lg border border-border p-5">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-md bg-secondary">
        <Icon className="h-5 w-5" strokeWidth={1.5} />
      </div>
      {value === null ? (
        <Skeleton className="h-7 w-16" />
      ) : (
        <p className="font-display text-2xl">{value}</p>
      )}
      <p className="mt-1 text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DashboardContent />
    </Suspense>
  );
}