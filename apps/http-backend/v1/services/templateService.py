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

        items = [
            TemplateSummary.model_validate(serializeDoc(d)).model_dump(mode="json")
            for d in docs
        ]
        return response(
            message="Templates fetched successfully",
            data={"items": items, "page": page, "limit": limit, "total": total},
        )

template_service = TemplateService()
