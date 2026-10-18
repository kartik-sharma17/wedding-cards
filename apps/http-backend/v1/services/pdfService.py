# v1/services/pdfService.py
import asyncio
import hashlib
import json
import logging
import os
from pathlib import Path

from fastapi.responses import FileResponse

from v1.db.connectDB import getDB
from v1.utility import response, toObjectId, NotFoundError, ForbiddenError
from v1.utility.pdfRenderer import render_pdf
from v1.utility.pdfTokens import sign_token, verify_token
from config import settings

logger = logging.getLogger(__name__)

FRONTEND_URL = settings.PDF_FRONTEND_URL if settings.PDF_FRONTEND_URL else "http://localhost:3000"
CACHE_DIR = Path(settings.CACHE_DIR or ".pdf_cache")
RENDER_VERSION = settings.PDF_RENDER_VERSION if settings.PDF_RENDER_VERSION else 1
_slots = asyncio.Semaphore(int(settings.PDF_MAX_CONCURRENCY if settings.PDF_MAX_CONCURRENCY else 2))


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
        key = hashlib.sha256(fingerprint.encode()).hexdigest()[:16]
        path = CACHE_DIR / f"{cardId}-{key}.pdf"

        if not path.exists():
            async with _slots:
                if not path.exists():  # another request may have finished while we waited
                    printToken = sign_token({"typ": "print", "cardId": cardId}, ttl=180)
                    pdf = await render_pdf(f"{FRONTEND_URL}/card/{slug}/{cardId}/print?t={printToken}")
                    await asyncio.to_thread(self._save, path, pdf, cardId)

        downloadToken = sign_token({"typ": "download", "cardId": cardId, "file": path.name}, ttl=120)
        return response(message="PDF ready", data={"downloadPath": f"/pdf/download?t={downloadToken}"})

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
    # GET /pdf/download?t=  (a normal link the browser follows; sends the file as an attachment)
    # ------------------------------------------------------------------
    def download(self, token: str):
        claims = verify_token(token, typ="download")
        path = CACHE_DIR / Path(claims["file"]).name  # .name strips any folder parts
        if not path.is_file():
            raise NotFoundError("This PDF is no longer available. Please try again.")
        return FileResponse(
            path,
            media_type="application/pdf",
            filename="invitation-card.pdf",
            headers={"Cache-Control": "private, no-store"},
        )

    # ------------------------------------------------------------------
    @staticmethod
    def _save(path: Path, pdf: bytes, cardId: str):
        CACHE_DIR.mkdir(parents=True, exist_ok=True)
        tmp = path.with_suffix(".tmp")
        tmp.write_bytes(pdf)
        tmp.replace(path)  # atomic: a half-written file is never served
        for old in CACHE_DIR.glob(f"{cardId}-*.pdf"):  # drop older versions of this card's PDF
            if old != path:
                old.unlink(missing_ok=True)


pdf_service = PdfService()