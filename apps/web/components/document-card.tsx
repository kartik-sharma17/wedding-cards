import { Badge } from "@/components/ui/badge";
import { DocumentActionsMenu } from "@/components/document-actions-menu";
import { DocumentListItem } from "@/redux/service/documentService";
import { formatBytes, formatDate } from "@/lib/utils";
import { FileText, FileImage, FileSpreadsheet, File as FileIcon } from "lucide-react";

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith("image/")) return FileImage;
  if (mimeType.includes("sheet") || mimeType.includes("csv")) return FileSpreadsheet;
  if (mimeType.includes("pdf") || mimeType.includes("text")) return FileText;
  return FileIcon;
}

export function DocumentCard({
  document,
  currentFolderId = null,
}: {
  document: DocumentListItem;
  currentFolderId?: string | null;
}) {
  const Icon = getFileIcon(document.mime_type);
  const isFailed = document.status === "failed";
  const isUploading = document.status === "uploading";
  const canManage = document.status === "completed";

  return (
    <div className="group overflow-hidden rounded-xl border border-border bg-card transition-all hover:border-foreground/20 hover:shadow-md">
      {/* Preview area — real thumbnail fills it, otherwise a large centered icon on a tinted field */}
      <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-secondary/40">
        {document.thumbnail_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={document.thumbnail_url}
            alt={document.file_name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <Icon className="h-10 w-10 text-muted-foreground/50" strokeWidth={1.25} />
        )}

        {/* Status/visibility badges float over the preview, top-left */}
        <div className="absolute left-2 top-2 flex flex-wrap gap-1.5">
          {isFailed && (
            <Badge className="bg-destructive text-destructive-foreground hover:bg-destructive">
              Failed
            </Badge>
          )}
          {isUploading && <Badge variant="secondary">Uploading</Badge>}
          {document.is_public && !isFailed && (
            <Badge className="bg-foreground text-background hover:bg-foreground">
              Public
            </Badge>
          )}
        </div>

        {/* Actions menu floats over the preview, top-right, only when interactive */}
        {canManage && (
  <div className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
    <DocumentActionsMenu
      documentId={document.document_id}
      fileName={document.file_name}
      isPublic={document.is_public}
      currentFolderId={currentFolderId}
    />
  </div>
)}
      </div>

      {/* Metadata below the preview */}
      <div className="p-3">
        <p className="truncate text-sm font-medium" title={document.file_name}>
          {document.file_name}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {formatBytes(document.size)} · {formatDate(document.updated_at ?? document.created_at)}
        </p>
      </div>
    </div>
  );
}