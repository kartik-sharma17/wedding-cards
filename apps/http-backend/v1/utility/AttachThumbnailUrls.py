from .r2.b2Storage import GeneratePresignedDownloadUrl

async def AttachThumbnailUrls(docs: list[dict]) -> list[dict]:
    """
    Takes raw Document dicts from Mongo and returns API-ready dicts with
    a presigned thumbnail_url attached. Presigning is local signing (no
    network call), so looping per-document is cheap even for large lists.
    """
    result = []
    for doc in docs:
        thumbnail_url = None
        if doc.get("thumbnail_key"):
            thumbnail_url = await GeneratePresignedDownloadUrl(
                key=doc["thumbnail_key"], expires_in=3600
            )
        result.append(
            {
                "document_id": str(doc["_id"]),
                "file_name": doc["file_name"],
                "mime_type": doc["mime_type"],
                "size": doc.get("size"),
                "is_public": doc.get("is_public", False),
                "status": doc.get("status"),
                "folder_id": doc.get("folder_id"),
                "thumbnail_url": thumbnail_url,
                "created_at": str(doc.get("created_at")),
                "updated_at": str(doc.get("updated_at")),
            }
        )
    return result