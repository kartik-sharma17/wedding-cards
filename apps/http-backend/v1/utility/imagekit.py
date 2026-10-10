import os

import httpx
from fastapi import UploadFile
from config import settings

from v1.utility import BadRequestError, InternalServerError, log

IMAGEKIT_UPLOAD_URL = "https://upload.imagekit.io/api/v1/files/upload"
MAX_IMAGE_BYTES = 5 * 1024 * 1024
ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp"}


def _looksLikeImage(content: bytes) -> bool:
    # Check the real bytes, not just the Content-Type header the client sent.
    return (
        content.startswith(b"\xff\xd8\xff")
        or content.startswith(b"\x89PNG\r\n\x1a\n")
        or (content[:4] == b"RIFF" and content[8:12] == b"WEBP")
    )


async def UploadImage(file: UploadFile, folder: str = "/templates") -> str:
    """Uploads one image to ImageKit and returns its public URL."""

    if file.content_type not in ALLOWED_TYPES:
        raise BadRequestError("Only JPG, PNG or WEBP images are allowed")

    content = await file.read()

    if len(content) > MAX_IMAGE_BYTES:
        raise BadRequestError("Each image must be 5 MB or smaller")

    if not _looksLikeImage(content):
        raise BadRequestError("The uploaded file is not a valid image")

    privateKey = settings.IMAGEKIT_PRIVATE_KEY
    if not privateKey:
        log.info("IMAGEKIT_PRIVATE_KEY is not set")
        raise InternalServerError("Image upload is not configured")

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            res = await client.post(
                IMAGEKIT_UPLOAD_URL,
                auth=(privateKey, ""),
                data={
                    "fileName": file.filename or "upload",
                    "folder": folder,
                    "useUniqueFileName": "true",
                },
                files={"file": (file.filename or "upload", content, file.content_type)},
            )
        res.raise_for_status()
        return res.json()["url"]
    except (httpx.HTTPError, KeyError, ValueError) as e:
        log.info(f"imagekit upload failed {str(e)}")
        raise InternalServerError("Image upload failed, please try again")
