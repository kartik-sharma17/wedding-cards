from v1.db.connectDB import getDB
from v1.models.template import TemplateCategory
from v1.schema.templateSchema import TemplateSummary, TemplateDetail
from v1.utility import response, NotFoundError, toObjectId


class TemplateService:
    @property
    def collection(self):
        return getDB()["Template"]

    async def FindById(self, templateId: str, activeOnly: bool = True):
        """Raw template doc or None. Used by CardService too."""

        query = {"_id": toObjectId(templateId)}

        result = await self.collection.find_one(query)

        if not result["is_active"]:
            return response(status=False, message="Template is not active", code=401)

        return response(data=result)

    async def FindBySlug(self, slug: str, activeOnly: bool = True):
        """Raw template doc or None, looked up by slug."""

        query: dict = {"slug": slug.strip().lower()}
        if activeOnly:
            query["is_active"] = True

        return await self.collection.find_one(query)

    async def GetTemplate(self, slug: str):
        doc = await self.FindBySlug(slug)

        if doc is None:
            return response(status=False, message="Template not found", code=404)

        doc["id"] = str(doc.pop("_id"))
        data = TemplateDetail.model_validate(doc).model_dump(mode="json")

        return response(message="Template fetched successfully", data=data)

    async def ListTemplates(
        self, category: TemplateCategory | None, page: int, limit: int
    ):
        query: dict = {"is_active": True}
        if category is not None:
            query["category"] = category.value

        total = await self.collection.count_documents(query)
        cursor = (
            self.collection.find(query)
            .sort("createAt", -1)
            .skip((page - 1) * limit)
            .limit(limit)
        )
        docs = await cursor.to_list(length=limit)

        items = []

        for d in docs:
            d["id"] = str(d.pop("_id"))
            items.append(TemplateSummary.model_validate(d).model_dump(mode="json"))

        return response(
            message="Templates fetched successfully",
            data={"items": items, "page": page, "limit": limit, "total": total},
        )


template_service = TemplateService()
