import uuid
from bson import ObjectId
from datetime import datetime, timezone
from fastapi import HTTPException
from v1.db.connectDB import getDB
from v1.schema import UploadRequestSchema, UploadRequestResponseSchema
from v1.utility import (
    log,
    GeneratePresignedUploadUrl,
    GeneratePresignedDownloadUrl,
    VerifyObjectExists,
    response,
    GenerateShareToken,
    VerifyShareToken,
    DeleteObject,
    UploadThumbnail,
    AttachThumbnailUrls,
)
from v1.models import Document


class DocumentService:
    @property
    def collection(self):
        return getDB()["Document"]

    async def UploadDocument(self, user: dict, documentData: UploadRequestSchema):
        try:
            owner_id = str(user["_id"])

            file_extension = ""
            if "." in documentData.file_name:
                file_extension = documentData.file_name.rsplit(".", 1)[-1]

            r2_key = (
                f"{owner_id}/{uuid.uuid4()}.{file_extension}"
                if file_extension
                else f"{owner_id}/{uuid.uuid4()}"
            )

            upload_url = await GeneratePresignedUploadUrl(
                key=r2_key,
                content_type=documentData.mime_type,
                expires_in=900,
            )

            if not upload_url:
                raise HTTPException(
                    status_code=500,
                    detail={
                        "status": False,
                        "message": "Something went wrong while generating upload URL, please try again",
                    },
                )

            thumbnail_key = None
            if documentData.thumbnail:
                thumbnail_key = f"{owner_id}/thumbnails/{uuid.uuid4()}.jpg"
                uploaded = await UploadThumbnail(thumbnail_key, documentData.thumbnail)
                if not uploaded:
                    thumbnail_key = None

            new_document = Document(
                owner_id=owner_id,
                file_name=documentData.file_name,
                url=r2_key,
                mime_type=documentData.mime_type,
                size=documentData.size,
                is_public=documentData.is_public,
                share_token=None,
                status="uploading",
                folder_id=documentData.folder_id if documentData.folder_id else None,
                thumbnail_key=thumbnail_key,
                deleted_at=None,
                checksum=None,
                created_at=datetime.now(timezone.utc),
                updated_at=None,
            )

            result = await self.collection.insert_one(
                new_document.dict(by_alias=True, exclude={"id"})
            )

            data = UploadRequestResponseSchema(
                document_id=str(result.inserted_id),
                upload_url=upload_url,
                r2_key=r2_key,
                expires_in=900,
            )

            return response(
                message="Upload URL generated successfully",
                data=data.dict(),
            )

        except HTTPException:
            raise
        except Exception as e:
            log.info(f"this is a issue {str(e)}")
            raise HTTPException(
                status_code=500,
                detail={
                    "status": False,
                    "message": "Something went wrong while uploading document, please try again",
                },
            )

    async def ConfirmUpload(self, user: dict, document_id: str):
        try:
            owner_id = str(user["_id"])

            document = await self.collection.find_one({"_id": ObjectId(document_id)})

            if not document:
                raise HTTPException(
                    status_code=404,
                    detail={"status": False, "message": "Document not found"},
                )

            if document["owner_id"] != owner_id:
                raise HTTPException(
                    status_code=403,
                    detail={"status": False, "message": "You do not have access to this document"},
                )

            actual_size = await VerifyObjectExists(document["url"])

            if actual_size is None:
                await self.collection.update_one(
                    {"_id": ObjectId(document_id)},
                    {"$set": {"status": "failed", "updated_at": datetime.now(timezone.utc)}},
                )
                raise HTTPException(
                    status_code=400,
                    detail={
                        "status": False,
                        "message": "Upload could not be verified — file not found in storage",
                    },
                )

            expected_size = document.get("size")

            if expected_size is not None and actual_size != expected_size:
                await self.collection.update_one(
                    {"_id": ObjectId(document_id)},
                    {"$set": {"status": "failed", "updated_at": datetime.now(timezone.utc)}},
                )
                raise HTTPException(
                    status_code=400,
                    detail={
                        "status": False,
                        "message": f"Upload incomplete — expected {expected_size} bytes, got {actual_size} bytes",
                    },
                )

            await self.collection.update_one(
                {"_id": ObjectId(document_id)},
                {
                    "$set": {
                        "status": "completed",
                        "size": actual_size,
                        "updated_at": datetime.now(timezone.utc),
                    }
                },
            )

            return response(
                message="Upload confirmed",
                data={"document_id": document_id, "size": actual_size},
            )

        except HTTPException:
            raise
        except Exception as e:
            log.info(f"this is a issue {str(e)}")
            raise HTTPException(
                status_code=500,
                detail={"status": False, "message": "Something went wrong while confirming upload"},
            )

    async def GetDownloadUrl(self, user: dict, document_id: str):
        try:
            document = await self.collection.find_one({"_id": ObjectId(document_id)})

            if not document:
                raise HTTPException(
                    status_code=404,
                    detail={"status": False, "message": "Document not found"},
                )

            owner_id = str(user["_id"])
            is_owner = document["owner_id"] == owner_id

            if not is_owner:
                raise HTTPException(
                    status_code=403,
                    detail={"status": False, "message": "You do not have access to this document"},
                )

            download_url = await GeneratePresignedDownloadUrl(key=document["url"])

            if not download_url:
                raise HTTPException(
                    status_code=500,
                    detail={
                        "status": False,
                        "message": "Something went wrong while generating download URL, please try again",
                    },
                )

            return response(
                message="Download URL generated successfully",
                data={
                    "file_name": document["file_name"],
                    "download_url": download_url,
                    "expires_in": 900,
                },
            )

        except HTTPException:
            raise
        except Exception as e:
            log.info(f"this is a issue {str(e)}")
            raise HTTPException(
                status_code=500,
                detail={"status": False, "message": "Something went wrong while generating download URL"},
            )

    async def GetDownloadUrlByShareToken(self, share_token: str):
        try:
            payload = await VerifyShareToken(share_token)
            document_id = payload.get("document_id")

            if not document_id:
                raise HTTPException(
                    status_code=401,
                    detail={"status": False, "message": "Invalid share token"},
                )

            document = await self.collection.find_one({"_id": ObjectId(document_id)})

            if not document:
                raise HTTPException(
                    status_code=404,
                    detail={"status": False, "message": "Document not found"},
                )

            if not document.get("is_public"):
                raise HTTPException(
                    status_code=403,
                    detail={"status": False, "message": "This document is no longer public"},
                )

            download_url = await GeneratePresignedDownloadUrl(key=document["url"])

            if not download_url:
                raise HTTPException(
                    status_code=500,
                    detail={
                        "status": False,
                        "message": "Something went wrong while generating download URL, please try again",
                    },
                )

            return response(
                message="Download URL generated successfully",
                data={
                    "file_name": document["file_name"],
                    "download_url": download_url,
                    "expires_in": 900,
                },
            )

        except HTTPException:
            raise
        except Exception as e:
            log.info(f"this is a issue {str(e)}")
            raise HTTPException(
                status_code=500,
                detail={"status": False, "message": "Something went wrong while generating download URL"},
            )

    async def GenerateShareToken(self, user: dict, document_id: str, expires_minutes: int = 5):
        try:
            owner_id = str(user["_id"])

            document = await self.collection.find_one({"_id": ObjectId(document_id)})

            if not document:
                raise HTTPException(
                    status_code=404,
                    detail={"status": False, "message": "Document not found"},
                )

            if document["owner_id"] != owner_id:
                raise HTTPException(
                    status_code=403,
                    detail={"status": False, "message": "You do not have access to this document"},
                )

            if not document.get("is_public"):
                raise HTTPException(
                    status_code=400,
                    detail={
                        "status": False,
                        "message": "Document must be public before generating a share link. Change visibility first.",
                    },
                )

            token, actual_expiry = GenerateShareToken(document_id, expires_minutes)

            await self.collection.update_one(
                {"_id": ObjectId(document_id)},
                {"$set": {"share_token": token, "updated_at": datetime.now(timezone.utc)}},
            )

            return response(
                message="Share link generated successfully",
                data={
                    "share_token": token,
                    "expires_in_minutes": actual_expiry,
                },
            )

        except HTTPException:
            raise
        except Exception as e:
            log.info(f"this is a issue {str(e)}")
            raise HTTPException(
                status_code=500,
                detail={"status": False, "message": "Something went wrong while generating share link"},
            )

    async def ChangeVisibility(self, user: dict, document_id: str, is_public: bool):
        try:
            owner_id = str(user["_id"])

            document = await self.collection.find_one({"_id": ObjectId(document_id)})

            if not document:
                raise HTTPException(
                    status_code=404,
                    detail={"status": False, "message": "Document not found"},
                )

            if document["owner_id"] != owner_id:
                raise HTTPException(
                    status_code=403,
                    detail={"status": False, "message": "You do not have access to this document"},
                )

            update_fields = {"is_public": is_public, "updated_at": datetime.now(timezone.utc)}

            if not is_public:
                update_fields["share_token"] = None

            await self.collection.update_one(
                {"_id": ObjectId(document_id)},
                {"$set": update_fields},
            )

            return response(
                message="Visibility updated successfully",
                data={"document_id": document_id, "is_public": is_public},
            )

        except HTTPException:
            raise
        except Exception as e:
            log.info(f"this is a issue {str(e)}")
            raise HTTPException(
                status_code=500,
                detail={"status": False, "message": "Something went wrong while updating visibility"},
            )

    async def GetAllDocument(self, user: dict):
        try:
            owner_id = str(user["_id"])

            result = self.collection.find({"owner_id": owner_id, "deleted_at": None})
            documents = await result.to_list(length=None)

            data = await AttachThumbnailUrls(documents)

            return response(
                message="Documents fetched successfully",
                data=data,
            )

        except Exception as e:
            log.info(f"this is a issue {str(e)}")
            raise HTTPException(
                status_code=500,
                detail={"status": False, "message": "Something went wrong while fetching documents"},
            )

    async def DeleteDocument(self, user: dict, document_id: str):
        """Soft delete — moves the document to trash. Storage is untouched."""
        try:
            owner_id = str(user["_id"])

            document = await self.collection.find_one({"_id": ObjectId(document_id)})

            if not document:
                raise HTTPException(
                    status_code=404,
                    detail={"status": False, "message": "Document not found"},
                )

            if document["owner_id"] != owner_id:
                raise HTTPException(
                    status_code=403,
                    detail={"status": False, "message": "You do not have access to this document"},
                )

            if document.get("deleted_at"):
                raise HTTPException(
                    status_code=400,
                    detail={"status": False, "message": "Document is already in trash"},
                )

            await self.collection.update_one(
                {"_id": ObjectId(document_id)},
                {"$set": {"deleted_at": datetime.now(timezone.utc)}},
            )

            return response(
                message="Document moved to trash",
                data={"document_id": document_id},
            )

        except HTTPException:
            raise
        except Exception as e:
            log.info(f"this is a issue {str(e)}")
            raise HTTPException(
                status_code=500,
                detail={"status": False, "message": "Something went wrong while deleting document"},
            )

    async def RestoreDocument(self, user: dict, document_id: str):
        try:
            owner_id = str(user["_id"])

            document = await self.collection.find_one({"_id": ObjectId(document_id)})

            if not document:
                raise HTTPException(
                    status_code=404,
                    detail={"status": False, "message": "Document not found"},
                )

            if document["owner_id"] != owner_id:
                raise HTTPException(
                    status_code=403,
                    detail={"status": False, "message": "You do not have access to this document"},
                )

            if not document.get("deleted_at"):
                raise HTTPException(
                    status_code=400,
                    detail={"status": False, "message": "Document is not in trash"},
                )

            # If the document's folder was itself deleted since, fall back to General
            # rather than restoring into a folder that no longer exists.
            folder_id = document.get("folder_id")
            if folder_id:
                folder = await getDB()["Folder"].find_one({"_id": ObjectId(folder_id)})
                if not folder:
                    folder_id = None

            await self.collection.update_one(
                {"_id": ObjectId(document_id)},
                {"$set": {"deleted_at": None, "folder_id": folder_id, "updated_at": datetime.now(timezone.utc)}},
            )

            return response(
                message="Document restored",
                data={"document_id": document_id},
            )

        except HTTPException:
            raise
        except Exception as e:
            log.info(f"this is a issue {str(e)}")
            raise HTTPException(
                status_code=500,
                detail={"status": False, "message": "Something went wrong while restoring document"},
            )

    async def PermanentlyDeleteDocument(self, user: dict, document_id: str):
        """Hard delete — only allowed from trash. Removes from storage and DB."""
        try:
            owner_id = str(user["_id"])

            document = await self.collection.find_one({"_id": ObjectId(document_id)})

            if not document:
                raise HTTPException(
                    status_code=404,
                    detail={"status": False, "message": "Document not found"},
                )

            if document["owner_id"] != owner_id:
                raise HTTPException(
                    status_code=403,
                    detail={"status": False, "message": "You do not have access to this document"},
                )

            if not document.get("deleted_at"):
                raise HTTPException(
                    status_code=400,
                    detail={
                        "status": False,
                        "message": "Document must be in trash before it can be permanently deleted",
                    },
                )

            deleted_from_storage = await DeleteObject(key=document["url"])

            if not deleted_from_storage:
                raise HTTPException(
                    status_code=500,
                    detail={
                        "status": False,
                        "message": "Something went wrong while deleting the file from storage, please try again",
                    },
                )

            if document.get("thumbnail_key"):
                await DeleteObject(key=document["thumbnail_key"])

            await self.collection.delete_one({"_id": ObjectId(document_id)})

            return response(
                message="Document permanently deleted",
                data={"document_id": document_id},
            )

        except HTTPException:
            raise
        except Exception as e:
            log.info(f"this is a issue {str(e)}")
            raise HTTPException(
                status_code=500,
                detail={"status": False, "message": "Something went wrong while permanently deleting document"},
            )

    async def GetTrash(self, user: dict):
        try:
            owner_id = str(user["_id"])

            result = self.collection.find({"owner_id": owner_id, "deleted_at": {"$ne": None}})
            documents = await result.to_list(length=None)

            data = await AttachThumbnailUrls(documents)
            deleted_at_map = {str(d["_id"]): str(d.get("deleted_at")) for d in documents}
            for item in data:
                item["deleted_at"] = deleted_at_map.get(item["document_id"])

            return response(
                message="Trash fetched successfully",
                data=data,
            )

        except Exception as e:
            log.info(f"this is a issue {str(e)}")
            raise HTTPException(
                status_code=500,
                detail={"status": False, "message": "Something went wrong while fetching trash"},
            )

    async def MoveDocument(self, user: dict, document_id: str, folder_id: str | None):
        try:
            owner_id = str(user["_id"])

            document = await self.collection.find_one({"_id": ObjectId(document_id)})

            if not document:
                raise HTTPException(status_code=404, detail={"status": False, "message": "Document not found"})

            if document["owner_id"] != owner_id:
                raise HTTPException(status_code=403, detail={"status": False, "message": "You do not have access to this document"})

            if document.get("deleted_at"):
                raise HTTPException(status_code=400, detail={"status": False, "message": "Cannot move a document that is in trash"})

            if folder_id:
                folder = await getDB()["Folder"].find_one({"_id": ObjectId(folder_id)})
                if not folder:
                    raise HTTPException(status_code=404, detail={"status": False, "message": "Target folder not found"})
                if folder["owner_id"] != owner_id:
                    raise HTTPException(status_code=403, detail={"status": False, "message": "You do not have access to the target folder"})

            await self.collection.update_one(
                {"_id": ObjectId(document_id)},
                {"$set": {"folder_id": folder_id, "updated_at": datetime.now(timezone.utc)}},
            )

            return response(message="Document moved successfully", data={"document_id": document_id, "folder_id": folder_id})
        except HTTPException:
            raise
        except Exception as e:
            log.info(f"this is a issue {str(e)}")
            raise HTTPException(status_code=500, detail={"status": False, "message": "Something went wrong while moving document"})


document_service = DocumentService()