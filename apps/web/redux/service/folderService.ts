import { RootApiService } from "./root";
import { ApiResponse } from "./authService";
import { DocumentListItem } from "./documentService";

export type FolderItem = {
    folder_id: string;
    name: string;
    parent_id: string | null;
    created_at?: string;
    updated_at?: string | null;
};

export type FolderContents = {
    folders: FolderItem[];
    documents: DocumentListItem[];
};

export const folderService = RootApiService.injectEndpoints({
    endpoints: (build) => ({
        createFolder: build.mutation<ApiResponse<{ folder_id: string; name: string; parent_id: string | null }>,
            { name: string; parent_id?: string | null }
        >({
            query: (body) => ({ url: "/folder/create", method: "POST", body }),
            invalidatesTags: ["Folder"],
        }),

        getAllFolders: build.query<ApiResponse<FolderItem[]>, void>({
            query: () => ({ url: "/folder/all", method: "GET" }),
            providesTags: ["Folder"],
        }),

        getFolderContents: build.query<ApiResponse<FolderContents>, string | null>({
            query: (folderId) => ({
                url: folderId ? `/folder/contents?folder_id=${folderId}` : "/folder/contents",
                method: "GET",
            }),
            providesTags: ["Folder", "Document"],
        }),

        renameFolder: build.mutation
            <ApiResponse<{ folder_id: string; name: string }>,
                { folderId: string; name: string }
            >({
                query: ({ folderId, name }) => ({
                    url: `/folder/rename/${folderId}`,
                    method: "PATCH",
                    body: { name },
                }),
                invalidatesTags: ["Folder"],
            }),

        moveFolder: build.mutation<ApiResponse<{ folder_id: string; parent_id: string | null }>,
            { folderId: string; newParentId: string | null }
        >({
            query: ({ folderId, newParentId }) => ({
                url: `/folder/move/${folderId}`,
                method: "PATCH",
                body: { new_parent_id: newParentId },
            }),
            invalidatesTags: ["Folder"],
        }),

        deleteFolder: build.mutation<ApiResponse<{ folder_id: string }>, string>({
            query: (folderId) => ({ url: `/folder/delete/${folderId}`, method: "DELETE" }),
            invalidatesTags: ["Folder", "Document"],
        }),
    }),
    overrideExisting: false,
});

export const {
    useCreateFolderMutation,
    useGetAllFoldersQuery,
    useGetFolderContentsQuery,
    useRenameFolderMutation,
    useMoveFolderMutation,
    useDeleteFolderMutation,
} = folderService;