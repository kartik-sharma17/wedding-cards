from fastapi import APIRouter, Query

from v1.models.template import TemplateCategory
from v1.services.templateService import template_service

router = APIRouter(prefix="/templates", tags=["Templates"])


@router.get("", summary="List templates (optionally filtered by category)")
async def list_templates(
    category: TemplateCategory | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
):
    return await template_service.ListTemplates(category, page, limit)


@router.get("/{templateId}", summary="Template detail (fields + manifest)")
async def get_template(templateId: str):
    return await template_service.GetTemplate(templateId)
