# v1/services/pdfService.py
import asyncio
import hashlib
import json
import logging
import os

from fastapi import HTTPException

from config import settings
from v1.db.connectDB import getDB
from v1.utility import response, toObjectId, NotFoundError, ForbiddenError
from v1.utility.blob.B2storage import (
    DeleteObjects,
    GeneratePresignedDownloadUrl,
    ListObjectKeys,
    ObjectExists,
    UploadObject,
)
from v1.utility.pdfRenderer import render_pdf
from v1.utility.pdfTokens import sign_token, verify_token

logger = logging.getLogger(__name__)


def _cfg(name: str, default=None):
    """Read a value from your settings class, then the environment, then the default."""
    value = getattr(settings, name, None)
    if value in (None, ""):
        value = os.getenv(name)
    return value if value not in (None, "") else default


# Where headless Chrome reaches the Next.js site. In Docker this is NOT localhost
# (use http://host.docker.internal:3000 for local testing, or your real site address).
FRONTEND_URL = str(_cfg("PDF_FRONTEND_URL", "http://localhost:3000")).rstrip("/")
# Bump this after you change a template's design, so old cached PDFs are not reused.
RENDER_VERSION = str(_cfg("PDF_RENDER_VERSION", "1"))
# Folder (key prefix) inside the Backblaze bucket.
STORAGE_PREFIX = str(_cfg("PDF_STORAGE_PREFIX", "pdfs")).strip("/")
DOWNLOAD_NAME = "invitation-card.pdf"
DOWNLOAD_LINK_SECONDS = 120
# Chrome is heavy: only a few PDFs are made at the same time.
_slots = asyncio.Semaphore(int(_cfg("PDF_MAX_CONCURRENCY", 2)))
# One lock per PDF: simultaneous clicks on the SAME card wait for each other, so it is made only once.
_locks: dict[str, asyncio.Lock] = {}


class PdfService:
    @property
    def cards(self):
        return getDB()["Card"]

    @property
    def details(self):
        return getDB()["CardDetails"]

    @property
    def templates(self):
        return getDB()["Template"]

    # ------------------------------------------------------------------
    # POST /pdf/cards/{cardId}  (owner, paid) -> makes or reuses the PDF, returns a download link
    # ------------------------------------------------------------------
    async def createCardPdf(self, user: dict, cardId: str):
        card = await self.cards.find_one({"_id": toObjectId(cardId, "Card not found")})
        if card is None:
            raise NotFoundError("Card not found")
        if card["ownerId"] != str(user["_id"]):
            raise ForbiddenError("You don't have access to this card")
        if not card.get("isPaid"):
            raise ForbiddenError("Please pay to download the PDF")

        details = await self.details.find_one({"_id": toObjectId(card["cardDetailsId"], "Card details not found")})
        if details is None:
            raise NotFoundError("Card details not found")

        template = await self.templates.find_one({"_id": toObjectId(card["templateId"], "Template not found")})
        if template is None:
            raise NotFoundError("Template not found")
        slug = template["slug"]  # must match the card/<slug>/ folder name in the Next.js app

        # Same card content + same template version + same render version = same PDF, so reuse it.
        fingerprint = json.dumps(
            {
                "details": {k: v for k, v in details.items() if k != "_id"},
                "templateVersion": card.get("templateVersion"),
                "slug": slug,
                "render": RENDER_VERSION,
            },
            sort_keys=True,
            default=str,
        )
        digest = hashlib.sha256(fingerprint.encode()).hexdigest()[:16]
        folder = f"{STORAGE_PREFIX}/{cardId}/"
        objectKey = f"{folder}{digest}.pdf"

        if not await self._exists(objectKey):
            lock = _locks.setdefault(objectKey, asyncio.Lock())
            try:
                async with lock:  # same card: the second click waits, then finds the finished file
                    if not await self._exists(objectKey):
                        async with _slots:  # different cards: only a few Chrome renders at once
                            printToken = sign_token({"typ": "print", "cardId": cardId}, ttl=180)
                            pdf = await render_pdf(f"{FRONTEND_URL}/card/{slug}/{cardId}/print?t={printToken}")
                            if not await UploadObject(objectKey, pdf, "application/pdf"):
                                raise HTTPException(status_code=502, detail="We couldn't save the PDF. Please try again.")
                            await self._removeOldVersions(folder, keep=objectKey)
            finally:
                if not lock.locked():
                    _locks.pop(objectKey, None)  # keep the dict from growing; the re-check above keeps this safe

        # The browser downloads straight from Backblaze through a short-lived signed link.
        downloadUrl = await GeneratePresignedDownloadUrl(
            objectKey,
            expires_in=DOWNLOAD_LINK_SECONDS,
            filename=DOWNLOAD_NAME,
            content_type="application/pdf",
        )
        if not downloadUrl:
            raise HTTPException(status_code=502, detail="We couldn't create the download link. Please try again.")

        return response(message="PDF ready", data={"downloadUrl": downloadUrl})

    # ------------------------------------------------------------------
    # GET /pdf/print-data/{cardId}?t=  (used only by the Next.js print page)
    # ------------------------------------------------------------------
    async def printData(self, cardId: str, token: str):
        verify_token(token, typ="print", cardId=cardId)

        card = await self.cards.find_one({"_id": toObjectId(cardId, "Card not found")})
        if card is None:
            raise NotFoundError("Card not found")
        details = await self.details.find_one({"_id": toObjectId(card["cardDetailsId"], "Card details not found")})
        if details is None:
            raise NotFoundError("Card details not found")

        details["_id"] = str(details["_id"])
        return response(message="Print data fetched", data={"details": details})

    # ------------------------------------------------------------------
    @staticmethod
    async def _exists(objectKey: str) -> bool:
        try:
            return await ObjectExists(objectKey)
        except Exception as exc:  # a storage outage must not look like "not generated yet"
            logger.error("Storage check failed for %s: %r", objectKey, exc)
            raise HTTPException(status_code=502, detail="Storage isn't available right now. Please try again.")

    @staticmethod
    async def _removeOldVersions(folder: str, keep: str):
        """Best effort: drop this card's older PDFs. A failure here never affects the download."""
        try:
            old = [k for k in await ListObjectKeys(folder) if k != keep]
            await DeleteObjects(old)
        except Exception as exc:
            logger.warning("Could not remove old PDFs under %s: %r", folder, exc)


pdf_service = PdfService()