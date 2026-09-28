from fastapi import APIRouter, Depends
from v1.schema import UploadRequestSchema, MoveDocumentSchema
from v1.services import document_service
from v1.dependencies import verifyUserDependency

documentRouter = APIRouter(prefix="/document", tags=["document"])


@documentRouter.post("/upload")
async def createDocument(documentData: UploadRequestSchema, user=Depends(verifyUserDependency)):
    return await document_service.UploadDocument(user, documentData)


@documentRouter.post("/confirm/{document_id}")
async def confirmUpload(document_id: str, user=Depends(verifyUserDependency)):
    return await document_service.ConfirmUpload(user, document_id)


@documentRouter.get("/download/{document_id}")
async def getDownloadUrl(document_id: str, user=Depends(verifyUserDependency)):
    return await document_service.GetDownloadUrl(user, document_id)


@documentRouter.get("/share/download")
async def getDownloadUrlByShareToken(share_token: str):
    return await document_service.GetDownloadUrlByShareToken(share_token)


@documentRouter.post("/share/{document_id}")
async def generateShareToken(
    document_id: str,
    expires_minutes: int = 5,
    user=Depends(verifyUserDependency),
):
    return await document_service.GenerateShareToken(user, document_id, expires_minutes)


@documentRouter.patch("/visibility/{document_id}")
async def changeVisibility(
    document_id: str,
    is_public: bool,
    user=Depends(verifyUserDependency),
):
    return await document_service.ChangeVisibility(user, document_id, is_public)


@documentRouter.get("/all")
async def getAllDocuments(user=Depends(verifyUserDependency)):
    return await document_service.GetAllDocument(user)

@documentRouter.delete("/delete/{document_id}")
async def deleteDocument(document_id: str, user=Depends(verifyUserDependency)):
    return await document_service.DeleteDocument(user, document_id)

@documentRouter.patch("/move/{document_id}")
async def moveDocument(document_id: str, documentData: MoveDocumentSchema, user=Depends(verifyUserDependency)):
    return await document_service.MoveDocument(user, document_id, documentData.folder_id)

@documentRouter.patch("/restore/{document_id}")
async def restoreDocument(document_id: str, user=Depends(verifyUserDependency)):
    return await document_service.RestoreDocument(user, document_id)


@documentRouter.delete("/permanent/{document_id}")
async def permanentlyDeleteDocument(document_id: str, user=Depends(verifyUserDependency)):
    return await document_service.PermanentlyDeleteDocument(user, document_id)


@documentRouter.get("/trash")
async def getTrash(user=Depends(verifyUserDependency)):
    return await document_service.GetTrash(user)