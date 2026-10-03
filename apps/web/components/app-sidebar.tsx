"use client";

import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuthUser } from "@/hooks/use-auth-user";
import { useUploadDialog } from "@/contexts/upload-dialog-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "./spinner";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useCreateFolderMutation,
  useDeleteFolderMutation,
  useGetAllFoldersQuery,
  useRenameFolderMutation,
  type FolderItem,
} from "@/redux/service/folderService";
import {
  Folder as FolderIcon,
  FolderPlus,
  ChevronRight,
  ChevronDown,
  MoreVertical,
  Pencil,
  Trash2,
  UploadCloud,
  LogOut,
} from "lucide-react";

type TreeNode = FolderItem & { children: TreeNode[] };

const GENERAL_ID = "__general__"; // virtual id, never sent to backend as folder_id

function buildTree(folders: FolderItem[]): TreeNode[] {
  const map = new Map<string, TreeNode>();
  folders.forEach((f) => map.set(f.folder_id, { ...f, children: [] }));

  const roots: TreeNode[] = [];
  map.forEach((node) => {
    if (node.parent_id && map.has(node.parent_id)) {
      map.get(node.parent_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  });
  return roots;
}

export function AppSidebar() {
  const { user, initials, signOut } = useAuthUser();
  const { openDialog } = useUploadDialog();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selectedFolderId = searchParams.get("folder"); // null = General

  const { data } = useGetAllFoldersQuery();
  const folders = data?.data ?? [];
  const tree = useMemo(() => buildTree(folders), [folders]);

  const [creatingRoot, setCreatingRoot] = useState(false);
  const [rootName, setRootName] = useState("");
  const [createFolder, { isLoading: isCreatingRoot }] = useCreateFolderMutation();

  const isTrashActive = pathname === "/trash";

  const selectFolder = (folderId: string | null) => {
    router.push(folderId ? `${pathname.includes("/trash")? pathname.replace("/trash",""):pathname }?folder=${folderId}` : "/dashboard");
  };

  const handleCreateRoot = async () => {
    const trimmed = rootName.trim();
    if (!trimmed) return setCreatingRoot(false);
    try {
      await createFolder({ name: trimmed, parent_id: null }).unwrap();
    } catch {
      toast.error("Couldn't create folder");
    } finally {
      setRootName("");
      setCreatingRoot(false);
    }
  };

  // General is a normal-looking row, just not deletable/renamable — not a separate concept
  const generalNode: TreeNode = {
    folder_id: GENERAL_ID,
    name: "General",
    parent_id: null,
    children: [],
  };

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col overflow-y-auto border-r border-border bg-background">
      <div className="px-6 py-6">
        <Link href="/dashboard" className="font-display text-xl tracking-tight">
          VAULT
        </Link>
      </div>

      <div className="flex items-center gap-3 px-6 pb-6">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-foreground text-sm font-semibold text-background">
          {initials}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{user?.name ?? "—"}</p>
          <p className="truncate text-xs text-muted-foreground">{user?.email ?? ""}</p>
        </div>
      </div>

      <Separator />

      <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-6">
        <Button variant="outline" className="mb-3 w-full justify-start gap-3" onClick={openDialog}>
          <UploadCloud className="h-4 w-4" strokeWidth={1.75} />
          Upload document
        </Button>

        <div className="flex items-center justify-between px-1 pb-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Folders</span>
          <button type="button" onClick={() => setCreatingRoot(true)} title="New folder">
            {isCreatingRoot ? <Spinner className="h-4 w-4" /> : <FolderPlus className="h-4 w-4 text-muted-foreground hover:text-foreground" />}
          </button>
        </div>

        {/* General rendered through the exact same row component as real folders */}
        <FolderRow
          node={generalNode}
          depth={0}
          isSelected={!isTrashActive && !selectedFolderId}
          isGeneral
          onSelect={() => selectFolder(null)}
        />

        {tree.map((node) => (
          <FolderNode
            key={node.folder_id}
            node={node}
            depth={0}
            selectedFolderId={isTrashActive ? undefined : selectedFolderId}
            onSelect={selectFolder}
          />
        ))}

        {creatingRoot && (
          <div className="px-1 py-1">
            <Input
              autoFocus
              value={rootName}
              onChange={(e) => setRootName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreateRoot();
                if (e.key === "Escape") setCreatingRoot(false);
              }}
              onBlur={handleCreateRoot}
              placeholder="Folder name"
              className="h-8 text-sm"
            />
          </div>
        )}

        <Separator className="my-3" />

        <Link
          href="/dashboard/trash"
          className={cn(
            "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
            isTrashActive
              ? "bg-foreground text-background"
              : "text-foreground/80 hover:bg-secondary"
          )}
        >
          <Trash2 className="h-4 w-4 shrink-0" strokeWidth={1.75} />
          Trash
        </Link>
      </nav>

      <Separator />

      <div className="shrink-0 px-4 py-4">
        <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground" onClick={signOut}>
          <LogOut className="h-4 w-4" strokeWidth={1.75} />
          Sign out
        </Button>
      </div>
    </aside>
  );
}

// Shared row UI for both General and real folders — same look, General just disables rename/delete
function FolderRow({
  node,
  depth,
  isSelected,
  isGeneral = false,
  hasChildren = false,
  expanded = false,
  isBusy = false,
  onSelect,
  onToggleExpand,
  onRename,
  onNewSubfolder,
  onDelete,
}: {
  node: TreeNode;
  depth: number;
  isSelected: boolean;
  isGeneral?: boolean;
  hasChildren?: boolean;
  expanded?: boolean;
  isBusy?: boolean;
  onSelect: () => void;
  onToggleExpand?: () => void;
  onRename?: () => void;
  onNewSubfolder?: () => void;
  onDelete?: () => void;
}) {
  return (
    <div
      className={cn(
        "group flex items-center gap-1 rounded-md px-1 py-1 text-sm font-medium",
        isSelected ? "bg-foreground text-background" : "text-foreground/80 hover:bg-secondary"
      )}
      style={{ paddingLeft: 8 + depth * 16 }}
    >
      <button
        type="button"
        onClick={onToggleExpand}
        className={cn(!hasChildren && "invisible")}
        disabled={!onToggleExpand}
      >
        {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
      </button>

      <button type="button" onClick={onSelect} className="flex flex-1 items-center gap-2 truncate text-left">
        <FolderIcon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
        <span className="truncate">{node.name}</span>
      </button>

      {isBusy ? (
        <Spinner className="h-3.5 w-3.5" />
      ) : (
        <DropdownMenu>
          <DropdownMenuTrigger className="opacity-0 group-hover:opacity-100">
            <MoreVertical className="h-3.5 w-3.5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
          >
            {onNewSubfolder && (
              <DropdownMenuItem onClick={onNewSubfolder}>
                <FolderPlus className="mr-2 h-4 w-4" /> New subfolder
              </DropdownMenuItem>
            )}
            {isGeneral ? (
              <Tooltip>
                <TooltipTrigger>
                  <div>
                    <DropdownMenuItem disabled>
                      <Trash2 className="mr-2 h-4 w-4" /> Delete
                    </DropdownMenuItem>
                  </div>
                </TooltipTrigger>
                <TooltipContent>General folder can&apos;t be deleted</TooltipContent>
              </Tooltip>
            ) : (
              <>
                <DropdownMenuItem onClick={onRename}>
                  <Pencil className="mr-2 h-4 w-4" /> Rename
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={onDelete}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}

function FolderNode({
  node,
  depth,
  selectedFolderId,
  onSelect,
}: {
  node: TreeNode;
  depth: number;
  selectedFolderId: string | null | undefined;
  onSelect: (folderId: string | null) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameReady, setRenameReady] = useState(false);
  const [isCreatingChild, setIsCreatingChild] = useState(false);
  const [createReady, setCreateReady] = useState(false);
  const [nameInput, setNameInput] = useState(node.name);
  const [childName, setChildName] = useState("");
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const renameInputRef = useRef<HTMLInputElement>(null);
  const createInputRef = useRef<HTMLInputElement>(null);

  const [renameFolder, { isLoading: isRenamingMutation }] = useRenameFolderMutation();
  const [deleteFolder, { isLoading: isDeleting }] = useDeleteFolderMutation();
  const [createFolder, { isLoading: isCreatingChildMutation }] = useCreateFolderMutation();

  const isActive = selectedFolderId === node.folder_id;
  const hasChildren = node.children.length > 0;
  const isBusy = isRenamingMutation || isDeleting || isCreatingChildMutation;

  useEffect(() => {
    if (isRenaming) {
      setRenameReady(false);
      const timer = setTimeout(() => {
        renameInputRef.current?.focus();
        renameInputRef.current?.select();
        setRenameReady(true);
      }, 60);
      return () => clearTimeout(timer);
    }
  }, [isRenaming]);

  useEffect(() => {
    if (isCreatingChild) {
      setCreateReady(false);
      const timer = setTimeout(() => {
        createInputRef.current?.focus();
        setCreateReady(true);
      }, 60);
      return () => clearTimeout(timer);
    }
  }, [isCreatingChild]);

  const handleRename = async () => {
    const trimmed = nameInput.trim();
    if (!trimmed || trimmed === node.name) {
      setIsRenaming(false);
      setNameInput(node.name);
      return;
    }
    try {
      await renameFolder({ folderId: node.folder_id, name: trimmed }).unwrap();
      setIsRenaming(false);
    } catch {
      toast.error("Couldn't rename folder");
      setNameInput(node.name);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteFolder(node.folder_id).unwrap();
      if (isActive) onSelect(null);
      setConfirmDeleteOpen(false);
    } catch {
      toast.error("Couldn't delete folder");
    }
  };

  const handleCreateChild = async () => {
    const trimmed = childName.trim();
    if (!trimmed) {
      setIsCreatingChild(false);
      return;
    }
    try {
      await createFolder({ name: trimmed, parent_id: node.folder_id }).unwrap();
      setExpanded(true);
    } catch {
      toast.error("Couldn't create folder");
    } finally {
      setChildName("");
      setIsCreatingChild(false);
    }
  };

  return (
    <div>
      {isRenaming ? (
        <div className="flex items-center gap-1 py-1" style={{ paddingLeft: 8 + depth * 16 }}>
          <Input
            ref={renameInputRef}
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleRename();
              if (e.key === "Escape") {
                setIsRenaming(false);
                setNameInput(node.name);
              }
            }}
            onBlur={() => {
              if (renameReady) handleRename();
            }}
            className="h-7 flex-1 text-sm"
          />
          {isRenamingMutation && <Spinner className="h-3.5 w-3.5" />}
        </div>
      ) : (
        <FolderRow
          node={node}
          depth={depth}
          isSelected={isActive}
          hasChildren={hasChildren}
          expanded={expanded}
          isBusy={isBusy}
          onSelect={() => onSelect(node.folder_id)}
          onToggleExpand={() => setExpanded((e) => !e)}
          onRename={() => setIsRenaming(true)}
          onNewSubfolder={() => {
            setExpanded(true);
            setIsCreatingChild(true);
          }}
          onDelete={() => setConfirmDeleteOpen(true)}
        />
      )}

      {expanded && (
        <div>
          {isCreatingChild && (
            <div className="flex items-center gap-1 py-1" style={{ paddingLeft: 24 + (depth + 1) * 16 }}>
              <Input
                ref={createInputRef}
                value={childName}
                onChange={(e) => setChildName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateChild();
                  if (e.key === "Escape") {
                    setChildName("");
                    setIsCreatingChild(false);
                  }
                }}
                onBlur={() => {
                  if (createReady) handleCreateChild();
                }}
                placeholder="Folder name"
                className="h-7 flex-1 text-sm"
              />
              {isCreatingChildMutation && <Spinner className="h-3.5 w-3.5" />}
            </div>
          )}

          {node.children.map((child) => (
            <FolderNode
              key={child.folder_id}
              node={child}
              depth={depth + 1}
              selectedFolderId={selectedFolderId}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}

      <AlertDialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete &ldquo;{node.name}&rdquo;?</AlertDialogTitle>
            <AlertDialogDescription>
              This deletes the folder, all its subfolders, and all documents inside them. This can&apos;t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? <Spinner className="mr-2 h-4 w-4" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}