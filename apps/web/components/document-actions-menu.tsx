"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";
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
import { Button } from "@/components/ui/button";
import { ShareLinkDialog } from "@/components/share-link-dialog";
import {
  useDeleteDocumentMutation,
  useChangeVisibilityMutation,
  useLazyGetDownloadUrlQuery,
  useMoveDocumentMutation,
} from "@/redux/service/documentService";
import { useGetAllFoldersQuery } from "@/redux/service/folderService";
import {
  Download,
  Eye,
  EyeOff,
  FolderInput,
  FolderOpen,
  Link2,
  Loader2,
  MoreVertical,
  Trash2,
} from "lucide-react";

type DocumentActionsMenuProps = {
  documentId: string;
  fileName: string;
  isPublic: boolean;
  currentFolderId?: string | null;
};

type ApiError = { data?: { message?: string }; message?: string };

function getErrorMessage(err: unknown, fallback: string): string {
  const e = err as ApiError;
  return e?.data?.message ?? e?.message ?? fallback;
}

export function DocumentActionsMenu({
  documentId,
  fileName,
  isPublic,
  currentFolderId = null,
}: DocumentActionsMenuProps) {
  const [shareOpen, setShareOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [changeVisibility, { isLoading: isTogglingVisibility }] =
    useChangeVisibilityMutation();
  const [deleteDocument, { isLoading: isDeleting }] = useDeleteDocumentMutation();
  const [getDownloadUrl, { isFetching: isPreparingDownload }] =
    useLazyGetDownloadUrlQuery();
  const [moveDocument, { isLoading: isMoving }] = useMoveDocumentMutation();

  const { data: foldersData } = useGetAllFoldersQuery();
  const folders = foldersData?.data ?? [];

  const handleToggleVisibility = async () => {
    try {
      const res = await changeVisibility({ documentId, isPublic: !isPublic }).unwrap();
      toast.success(res.message);
    } catch (err) {
      toast.error(getErrorMessage(err, "Couldn't update visibility"));
    }
  };

  const handleDownload = async () => {
    try {
      const res = await getDownloadUrl(documentId).unwrap();
      toast.success(res.message);
      window.open(res.data.download_url, "_blank", "noopener,noreferrer");
    } catch (err) {
      toast.error(getErrorMessage(err, "Couldn't get download link"));
    }
  };

  const handleMove = async (folderId: string | null) => {
    if (folderId === currentFolderId) return;
    try {
      const res = await moveDocument({ documentId, folderId }).unwrap();
      toast.success(res.message);
    } catch (err) {
      toast.error(getErrorMessage(err, "Couldn't move document"));
    }
  };

  const handleDelete = async () => {
    try {
      const res = await deleteDocument(documentId).unwrap();
      toast.success(res.message);
      setDeleteOpen(false);
    } catch (err) {
      toast.error(getErrorMessage(err, "Couldn't delete document"));
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={handleDownload} disabled={isPreparingDownload}>
            {isPreparingDownload ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Download
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={handleToggleVisibility}
            disabled={isTogglingVisibility}
          >
            {isPublic ? (
              <EyeOff className="mr-2 h-4 w-4" />
            ) : (
              <Eye className="mr-2 h-4 w-4" />
            )}
            {isPublic ? "Make private" : "Make public"}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setShareOpen(true)}>
            <Link2 className="mr-2 h-4 w-4" />
            Get share link
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuSub>
            <DropdownMenuSubTrigger disabled={isMoving}>
              <FolderInput className="mr-2 h-4 w-4" />
              Move to folder
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                <DropdownMenuItem
                  onClick={() => handleMove(null)}
                  disabled={currentFolderId === null}
                >
                  <FolderOpen className="mr-2 h-4 w-4" />
                  General
                </DropdownMenuItem>
                {folders.length > 0 && <DropdownMenuSeparator />}
                {folders.map((f) => (
                  <DropdownMenuItem
                    key={f.folder_id}
                    onClick={() => handleMove(f.folder_id)}
                    disabled={currentFolderId === f.folder_id}
                  >
                    {f.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={() => setDeleteOpen(true)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Move to trash
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ShareLinkDialog
        documentId={documentId}
        fileName={fileName}
        open={shareOpen}
        onOpenChange={setShareOpen}
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Move &ldquo;{fileName}&rdquo; to trash?</AlertDialogTitle>
            <AlertDialogDescription>
              You can restore it from Trash later, or delete it permanently from there.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Move to trash
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}