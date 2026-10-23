# v1/routers/pdfRouter.py
from fastapi import APIRouter, Depends, Query

from v1.dependencies import verifyUserDependency
from v1.services import pdf_service

pdfRouter = APIRouter(prefix="/pdf", tags=["pdf"])


@pdfRouter.post("/cards/{cardId}", summary="Make (or reuse) the card PDF and return a short-lived download link")
async def createCardPdf(cardId: str, user: dict = Depends(verifyUserDependency)):
    return await pdf_service.createCardPdf(user, cardId)


@pdfRouter.get("/print-data/{cardId}", summary="Card data for the print page (needs a print token)")
async def printData(cardId: str, t: str = Query(min_length=1)):
    return await pdf_service.printData(cardId, t)