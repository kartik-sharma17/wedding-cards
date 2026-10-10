import asyncio
import re

from fastapi import UploadFile
from pydantic import BaseModel, ValidationError

from v1.db.connectDB import getDB
from v1.models.base import timeZone
from v1.models.template import TemplateCategory
from v1.schema.templateSchema import (
    AdminTemplate,
    CreateTemplateSchema,
    UpdateTemplateSchema,
)
from v1.utility import (
    response,
    toObjectId,
    NotFoundError,
    BadRequestError,
    ConflictError,
)
from v1.utility.imagekit import UploadImage

IMAGE_FOLDER = "/templates"
MAX_PREVIEW_IMAGES = 8


def parsePayload(schema: type[BaseModel], raw: str):
    """The JSON part of a multipart request -> a validated schema."""
    try:
        return schema.model_validate_json(raw)
    except ValidationError as e:
        err = e.errors()[0]
        field = ".".join(str(p) for p in err["loc"])
        message = err["msg"].removeprefix("Value error, ")
        raise BadRequestError(f"{field}: {message}" if field else message)


def realFiles(files: list[UploadFile] | None) -> list[UploadFile]:
    # Browsers can send an empty part when no file was chosen.
    return [f for f in (files or []) if f is not None and f.filename]


class AdminTemplateService:
    @property
    def collection(self):
        return getDB()["Template"]

    @property
    def cards(self):
        return getDB()["Card"]

    def serialize(self, doc: dict) -> dict:
        item = {**doc, "id": str(doc["_id"])}
        item.pop("_id")
        return AdminTemplate.model_validate(item).model_dump(mode="json")

    async def ensureSlugAvailable(self, slug: str, exceptId=None):
        query: dict = {"slug": slug}
        if exceptId is not None:
            query["_id"] = {"$ne": exceptId}

        if await self.collection.find_one(query) is not None:
            raise ConflictError("A template with this slug already exists")

    async def createTemplate(
        self,
        rawData: str,
        thumbnail: UploadFile | None,
        previewImages: list[UploadFile] | None,
    ):
        data = parsePayload(CreateTemplateSchema, rawData)
        previews = realFiles(previewImages)

        if len(previews) > MAX_PREVIEW_IMAGES:
            raise BadRequestError(f"You can add up to {MAX_PREVIEW_IMAGES} preview images")

        await self.ensureSlugAvailable(data.slug)

        thumbnailUrl = None
        if realFiles([thumbnail]):
            thumbnailUrl = await UploadImage(thumbnail, IMAGE_FOLDER)
        previewUrls = list(
            await asyncio.gather(*(UploadImage(f, IMAGE_FOLDER) for f in previews))
        )

        now = timeZone()
        doc = {
            "templateName": data.templateName,
            "slug": data.slug,
            "category": data.category.value,
            "templateType": data.templateType.value,
            "current_version": 1,
            "price": 0 if data.is_free else data.price,
            "currency": data.currency,
            "is_free": data.is_free,
            "thumbnail_url": thumbnailUrl,
            "preview_images": previewUrls,
            "max_photos": data.max_photos,
            "requires_video": data.requires_video,
            "is_active": data.is_active,
            "supportedFields": data.supportedFields,
            "manifest": data.manifest,
            "createAt": now,
            "updateAt": now,
        }
        result = await self.collection.insert_one(doc)
        doc["_id"] = result.inserted_id

        return response(message="Template created successfully", data=self.serialize(doc))

    async def listTemplates(
        self,
        search: str | None,
        category: TemplateCategory | None,
        status: str | None,
        page: int,
        limit: int,
    ):
        query: dict = {}

        if category is not None:
            query["category"] = category.value

        if status == "active":
            query["is_active"] = True
        elif status == "inactive":
            query["is_active"] = False

        if search and search.strip():
            pattern = {"$regex": re.escape(search.strip()), "$options": "i"}
            query["$or"] = [{"templateName": pattern}, {"slug": pattern}]

        total = await self.collection.count_documents(query)
        cursor = (
            self.collection.find(query)
            .sort("createAt", -1)
            .skip((page - 1) * limit)
            .limit(limit)
        )
        docs = await cursor.to_list(length=limit)

        return response(
            message="Templates fetched successfully",
            data={
                "items": [self.serialize(d) for d in docs],
                "page": page,
                "limit": limit,
                "total": total,
            },
        )

    async def readTemplate(self, templateId: str):
        template = await self.collection.find_one(
            {"_id": toObjectId(templateId, "Invalid template ID")}
        )

        if template is None:
            raise NotFoundError("Template not found")

        return response(message="Template fetched successfully", data=self.serialize(template))

    async def updateTemplate(
        self,
        templateId: str,
        rawData: str,
        thumbnail: UploadFile | None,
        previewImages: list[UploadFile] | None,
    ):
        objectId = toObjectId(templateId, "Invalid template ID")
        template = await self.collection.find_one({"_id": objectId})

        if template is None:
            raise NotFoundError("Template not found")

        data = parsePayload(UpdateTemplateSchema, rawData)
        changes = data.model_dump(mode="json", exclude_unset=True)
        keep = changes.pop("existingPreviewImages", None)

        if "slug" in changes and changes["slug"] != template["slug"]:
            await self.ensureSlugAvailable(changes["slug"], exceptId=objectId)

        if "is_free" in changes or "price" in changes:
            isFree = changes.get("is_free", template.get("is_free", False))
            price = changes.get("price", template.get("price", 0))
            if isFree:
                changes["price"] = 0
            elif price <= 0:
                raise BadRequestError("Set a price greater than 0, or mark the template as free")

        newPreviews = realFiles(previewImages)
        current = template.get("preview_images", [])
        # Only URLs this template already has can be kept.
        kept = current if keep is None else [u for u in keep if u in current]

        if len(kept) + len(newPreviews) > MAX_PREVIEW_IMAGES:
            raise BadRequestError(f"You can add up to {MAX_PREVIEW_IMAGES} preview images")

        if realFiles([thumbnail]):
            changes["thumbnail_url"] = await UploadImage(thumbnail, IMAGE_FOLDER)

        if keep is not None or newPreviews:
            uploaded = list(
                await asyncio.gather(*(UploadImage(f, IMAGE_FOLDER) for f in newPreviews))
            )
            changes["preview_images"] = kept + uploaded

        changes["updateAt"] = timeZone()
        await self.collection.update_one({"_id": objectId}, {"$set": changes})

        updated = await self.collection.find_one({"_id": objectId})
        return response(message="Template updated successfully", data=self.serialize(updated))

    async def deleteTemplate(self, templateId: str):
        objectId = toObjectId(templateId, "Invalid template ID")
        template = await self.collection.find_one({"_id": objectId})

        if template is None:
            raise NotFoundError("Template not found")

        # Cards keep a reference to their template, so one that is in use is
        # deactivated instead of deleted.
        cardCount = await self.cards.count_documents({"templateId": str(objectId)})

        if cardCount > 0:
            await self.collection.update_one(
                {"_id": objectId},
                {"$set": {"is_active": False, "updateAt": timeZone()}},
            )
            return response(
                message=f"This template is used by {cardCount} card(s), so it was deactivated instead of deleted",
                data={"deleted": False, "deactivated": True},
            )

        await self.collection.delete_one({"_id": objectId})
        return response(
            message="Template deleted successfully",
            data={"deleted": True, "deactivated": False},
        )


admin_template_service = AdminTemplateService()
