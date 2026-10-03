import { RootApiService } from "./root";
import { ApiResponse } from "./authService";

export type UploadRequestPayload = {
  file_name: string;
  mime_type: string;
  size: number;
  is_public: boolean;
  folder_id?: string | null;
  thumbnail?: string | null;
};

export type UploadRequestResponseData = {
  document_id: string;
  upload_url: string;
  r2_key: string;
  expires_in: number;
};

export type ConfirmUploadResponseData = {
  document_id: string;
  size: number;
};

export type DownloadUrlResponseData = {
  file_name: string;
  download_url: string;
  expires_in: number;
};

export type ShareTokenResponseData = {
  share_token: string;
  expires_in_minutes: number;
};

export type VisibilityResponseData = {
  document_id: string;
  is_public: boolean;
};

export type DocumentStatus = "uploading" | "completed" | "failed";

export type DocumentListItem = {
  document_id: string;
  file_name: string;
  mime_type: string;
  size: number;
  is_public: boolean;
  status: DocumentStatus;
  folder_id: string | null;
  thumbnail_url?: string | null;
  deleted_at?: string | null; 
  created_at: string;
  updated_at: string | null;
};

export const documentService = RootApiService.injectEndpoints({
  endpoints: (build) => ({
    createUploadRequest: build.mutation<
      ApiResponse<UploadRequestResponseData>,
      UploadRequestPayload
    >({
      query: (body) => ({
        url: "/document/upload",
        method: "POST",
        body,
      }),
    }),

    // Step 3 of upload flow — tell backend the upload finished
    confirmUpload: build.mutation<ApiResponse<ConfirmUploadResponseData>, string>({
      query: (documentId) => ({
        url: `/document/confirm/${documentId}`,
        method: "POST",
      }),
      invalidatesTags: ["Document"],
    }),

    // owner-authenticated download
    getDownloadUrl: build.query<ApiResponse<DownloadUrlResponseData>, string>({
      query: (documentId) => ({
        url: `/document/download/${documentId}`,
        method: "GET",
      }),
    }),

    // public share-link download — no auth
    getDownloadUrlByShareToken: build.query<ApiResponse<DownloadUrlResponseData>, string>({
      query: (shareToken) => ({
        url: `/document/share/download?share_token=${encodeURIComponent(shareToken)}`,
        method: "GET",
      }),
    }),

    generateShareToken: build.mutation<
      ApiResponse<ShareTokenResponseData>,
      { documentId: string; expiresMinutes?: number }
    >({
      query: ({ documentId, expiresMinutes = 5 }) => ({
        url: `/document/share/${documentId}?expires_minutes=${expiresMinutes}`,
        method: "POST",
      }),
    }),

    changeVisibility: build.mutation<
      ApiResponse<VisibilityResponseData>,
      { documentId: string; isPublic: boolean }
    >({
      query: ({ documentId, isPublic }) => ({
        url: `/document/visibility/${documentId}?is_public=${isPublic}`,
        method: "PATCH",
      }),
      invalidatesTags: ["Document"],
    }),

    getAllDocuments: build.query<ApiResponse<DocumentListItem[]>, void>({
      query: () => ({
        url: "/document/all",
        method: "GET",
      }),
      providesTags: ["Document"],
    }),
    deleteDocument: build.mutation<ApiResponse<{ document_id: string }>, string>({
      query: (documentId) => ({
        url: `/document/delete/${documentId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Document"],
    }),
    moveDocument: build.mutation<ApiResponse<{ document_id: string; folder_id: string | null }>,
      { documentId: string; folderId: string | null }
    >({
      query: ({ documentId, folderId }) => ({
        url: `/document/move/${documentId}`,
        method: "PATCH",
        body: { folder_id: folderId },
      }),
      invalidatesTags: ["Document", "Folder"],
    }),
    restoreDocument: build.mutation<ApiResponse<{ document_id: string }>, string>({
      query: (documentId) => ({
        url: `/document/restore/${documentId}`,
        method: "PATCH",
      }),
      invalidatesTags: ["Document"],
    }),

    permanentlyDeleteDocument: build.mutation<ApiResponse<{ document_id: string }>, string>({
      query: (documentId) => ({
        url: `/document/permanent/${documentId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Document"],
    }),

    getTrash: build.query<ApiResponse<DocumentListItem[]>, void>({
      query: () => ({
        url: "/document/trash",
        method: "GET",
      }),
      providesTags: ["Document"],
    }),
  }),
  overrideExisting: false,
});

export const {
  useCreateUploadRequestMutation,
  useConfirmUploadMutation,
  useLazyGetDownloadUrlQuery,
  useLazyGetDownloadUrlByShareTokenQuery,
  useGenerateShareTokenMutation,
  useChangeVisibilityMutation,
  useGetAllDocumentsQuery,
  useDeleteDocumentMutation,
  useMoveDocumentMutation,
  useRestoreDocumentMutation,      
  usePermanentlyDeleteDocumentMutation,
  useGetTrashQuery,  
} = documentService;
