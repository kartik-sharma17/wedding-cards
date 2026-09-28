from bson import ObjectId
from datetime import datetime, timezone
from fastapi import HTTPException
from v1.db.connectDB import getDB
from v1.utility import log, response, DeleteObject, AttachThumbnailUrls
from v1.models import Folder


class FolderService:
    @property
    def collection(self):
        return getDB()["Folder"]

    @property
    def document_collection(self):
        return getDB()["Document"]

    async def CreateFolder(self, user: dict, name: str, parent_id: str | None = None):
        try:
            owner_id = str(user["_id"])

            if parent_id:
                parent = await self.collection.find_one({"_id": ObjectId(parent_id)})
                if not parent:
                    raise HTTPException(status_code=404, detail={"status": False, "message": "Parent folder not found"})
                if parent["owner_id"] != owner_id:
                    raise HTTPException(status_code=403, detail={"status": False, "message": "You do not have access to this folder"})

            new_folder = Folder(
                owner_id=owner_id,
                name=name,
                parent_id=parent_id,
                created_at=datetime.now(timezone.utc),
                updated_at=None,
            )

            result = await self.collection.insert_one(new_folder.dict(by_alias=True, exclude={"id"}))

            return response(
                message="Folder created successfully",
                data={"folder_id": str(result.inserted_id), "name": name, "parent_id": parent_id},
            )
        except HTTPException:
            raise
        except Exception as e:
            log.info(f"this is a issue {str(e)}")
            raise HTTPException(status_code=500, detail={"status": False, "message": "Something went wrong while creating folder"})

    async def RenameFolder(self, user: dict, folder_id: str, name: str):
        try:
            owner_id = str(user["_id"])
            folder = await self.collection.find_one({"_id": ObjectId(folder_id)})

            if not folder:
                raise HTTPException(status_code=404, detail={"status": False, "message": "Folder not found"})
            if folder["owner_id"] != owner_id:
                raise HTTPException(status_code=403, detail={"status": False, "message": "You do not have access to this folder"})

            await self.collection.update_one(
                {"_id": ObjectId(folder_id)},
                {"$set": {"name": name, "updated_at": datetime.now(timezone.utc)}},
            )

            return response(message="Folder renamed successfully", data={"folder_id": folder_id, "name": name})
        except HTTPException:
            raise
        except Exception as e:
            log.info(f"this is a issue {str(e)}")
            raise HTTPException(status_code=500, detail={"status": False, "message": "Something went wrong while renaming folder"})

    async def _get_descendant_folder_ids(self, folder_id: str) -> list[str]:
        ids = []
        queue = [folder_id]
        while queue:
            current = queue.pop()
            children = await self.collection.find({"parent_id": current}).to_list(length=None)
            for child in children:
                child_id = str(child["_id"])
                ids.append(child_id)
                queue.append(child_id)
        return ids

    async def DeleteFolder(self, user: dict, folder_id: str):
        try:
            owner_id = str(user["_id"])
            folder = await self.collection.find_one({"_id": ObjectId(folder_id)})

            if not folder:
                raise HTTPException(status_code=404, detail={"status": False, "message": "Folder not found"})
            if folder["owner_id"] != owner_id:
                raise HTTPException(status_code=403, detail={"status": False, "message": "You do not have access to this folder"})

            all_folder_ids = [folder_id] + await self._get_descendant_folder_ids(folder_id)

            documents = await self.document_collection.find(
                {"folder_id": {"$in": all_folder_ids}}
            ).to_list(length=None)

            for doc in documents:
                await DeleteObject(key=doc["url"])
                if doc.get("thumbnail_key"):
                    await DeleteObject(key=doc["thumbnail_key"])

            await self.document_collection.delete_many({"folder_id": {"$in": all_folder_ids}})
            await self.collection.delete_many({"_id": {"$in": [ObjectId(fid) for fid in all_folder_ids]}})

            return response(message="Folder deleted successfully", data={"folder_id": folder_id})
        except HTTPException:
            raise
        except Exception as e:
            log.info(f"this is a issue {str(e)}")
            raise HTTPException(status_code=500, detail={"status": False, "message": "Something went wrong while deleting folder"})

    async def MoveFolder(self, user: dict, folder_id: str, new_parent_id: str | None):
        try:
            owner_id = str(user["_id"])
            folder = await self.collection.find_one({"_id": ObjectId(folder_id)})

            if not folder:
                raise HTTPException(status_code=404, detail={"status": False, "message": "Folder not found"})
            if folder["owner_id"] != owner_id:
                raise HTTPException(status_code=403, detail={"status": False, "message": "You do not have access to this folder"})

            if new_parent_id:
                if new_parent_id == folder_id:
                    raise HTTPException(status_code=400, detail={"status": False, "message": "A folder cannot be moved into itself"})

                new_parent = await self.collection.find_one({"_id": ObjectId(new_parent_id)})
                if not new_parent:
                    raise HTTPException(status_code=404, detail={"status": False, "message": "Target folder not found"})
                if new_parent["owner_id"] != owner_id:
                    raise HTTPException(status_code=403, detail={"status": False, "message": "You do not have access to the target folder"})

                descendant_ids = await self._get_descendant_folder_ids(folder_id)
                if new_parent_id in descendant_ids:
                    raise HTTPException(status_code=400, detail={"status": False, "message": "Cannot move a folder into one of its own subfolders"})

            await self.collection.update_one(
                {"_id": ObjectId(folder_id)},
                {"$set": {"parent_id": new_parent_id, "updated_at": datetime.now(timezone.utc)}},
            )

            return response(message="Folder moved successfully", data={"folder_id": folder_id, "parent_id": new_parent_id})
        except HTTPException:
            raise
        except Exception as e:
            log.info(f"this is a issue {str(e)}")
            raise HTTPException(status_code=500, detail={"status": False, "message": "Something went wrong while moving folder"})

    async def GetAllFolders(self, user: dict):
        try:
            owner_id = str(user["_id"])
            folders = await self.collection.find({"owner_id": owner_id}).to_list(length=None)

            data = [
                {
                    "folder_id": str(f["_id"]),
                    "name": f["name"],
                    "parent_id": f.get("parent_id"),
                    "created_at": str(f.get("created_at")),
                    "updated_at": str(f.get("updated_at")),
                }
                for f in folders
            ]

            return response(message="Folders fetched successfully", data=data)
        except Exception as e:
            log.info(f"this is a issue {str(e)}")
            raise HTTPException(status_code=500, detail={"status": False, "message": "Something went wrong while fetching folders"})

    async def GetFolderContents(self, user: dict, folder_id: str | None):
        try:
            owner_id = str(user["_id"])

            if folder_id:
                folder = await self.collection.find_one({"_id": ObjectId(folder_id)})
                if not folder:
                    raise HTTPException(status_code=404, detail={"status": False, "message": "Folder not found"})
                if folder["owner_id"] != owner_id:
                    raise HTTPException(status_code=403, detail={"status": False, "message": "You do not have access to this folder"})

            subfolders = await self.collection.find({"owner_id": owner_id, "parent_id": folder_id}).to_list(length=None)
            documents = await self.document_collection.find(
    {"owner_id": owner_id, "folder_id": folder_id, "deleted_at": None}
).to_list(length=None)

            documents_data = await AttachThumbnailUrls(documents)

            return response(
                message="Folder contents fetched successfully",
                data={
                    "folders": [
                        {"folder_id": str(f["_id"]), "name": f["name"], "parent_id": f.get("parent_id")}
                        for f in subfolders
                    ],
                    "documents": documents_data,
                },
            )
        except HTTPException:
            raise
        except Exception as e:
            log.info(f"this is a issue {str(e)}")
            raise HTTPException(status_code=500, detail={"status": False, "message": "Something went wrong while fetching folder contents"})


folder_service = FolderService()