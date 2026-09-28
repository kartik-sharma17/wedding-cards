from typing import Optional
from fastapi import APIRouter, Depends
from v1.schema import CreateFolderSchema, RenameFolderSchema, MoveFolderSchema
from v1.services import folder_service
from v1.dependencies import verifyUserDependency

folderRouter = APIRouter(prefix="/folder", tags=["folder"])


@folderRouter.post("/create")
async def createFolder(folderData: CreateFolderSchema, user=Depends(verifyUserDependency)):
    return await folder_service.CreateFolder(user, folderData.name, folderData.parent_id)


@folderRouter.get("/all")
async def getAllFolders(user=Depends(verifyUserDependency)):
    return await folder_service.GetAllFolders(user)


@folderRouter.get("/contents")
async def getFolderContents(folder_id: Optional[str] = None, user=Depends(verifyUserDependency)):
    return await folder_service.GetFolderContents(user, folder_id)


@folderRouter.patch("/rename/{folder_id}")
async def renameFolder(folder_id: str, folderData: RenameFolderSchema, user=Depends(verifyUserDependency)):
    return await folder_service.RenameFolder(user, folder_id, folderData.name)


@folderRouter.patch("/move/{folder_id}")
async def moveFolder(folder_id: str, folderData: MoveFolderSchema, user=Depends(verifyUserDependency)):
    return await folder_service.MoveFolder(user, folder_id, folderData.new_parent_id)


@folderRouter.delete("/delete/{folder_id}")
async def deleteFolder(folder_id: str, user=Depends(verifyUserDependency)):
    return await folder_service.DeleteFolder(user, folder_id)

