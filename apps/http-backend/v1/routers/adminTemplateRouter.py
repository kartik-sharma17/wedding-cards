from typing import Literal

from fastapi import APIRouter, Depends, File, Form, Query, UploadFile

from v1.dependencies import verifyAdminDependency
from v1.models.template import TemplateCategory
from v1.services.adminTemplateService import admin_template_service

# Every route here needs an admin, so the check is applied to the whole router.
adminTemplateRouter = APIRouter(
    prefix="/admin/templates",
    tags=["Admin Templates"],
    dependencies=[Depends(verifyAdminDependency)],
)


@adminTemplateRouter.post("", summary="Create a template (multipart: data JSON + images)")
async def createTemplate(
    data: str = Form(...),
    thumbnail: UploadFile | None = File(default=None),
    previewImages: list[UploadFile] | None = File(default=None),
):
    return await admin_template_service.createTemplate(data, thumbnail, previewImages)


@adminTemplateRouter.get("", summary="List all templates, including inactive ones")
async def listTemplates(
    search: str | None = Query(default=None, max_length=80),
    category: TemplateCategory | None = Query(default=None),
    status: Literal["active", "inactive"] | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=10, ge=1, le=100),
):
    return await admin_template_service.listTemplates(search, category, status, page, limit)


@adminTemplateRouter.get("/{templateId}", summary="Template for the edit form")
async def readTemplate(templateId: str):
    return await admin_template_service.readTemplate(templateId)


@adminTemplateRouter.patch("/{templateId}", summary="Update a template (multipart: data JSON + images)")
async def updateTemplate(
    templateId: str,
    data: str = Form(...),
    thumbnail: UploadFile | None = File(default=None),
    previewImages: list[UploadFile] | None = File(default=None),
):
    return await admin_template_service.updateTemplate(templateId, data, thumbnail, previewImages)


@adminTemplateRouter.delete("/{templateId}", summary="Delete a template (deactivates it if cards use it)")
async def deleteTemplate(templateId: str):
    return await admin_template_service.deleteTemplate(templateId)
