# v1/routers/publicRouter.py
from fastapi import APIRouter, Path, Request

from v1.services import public_card_service

# Everything under /public is reachable WITHOUT a login. Keep it small and read-only.
publicRouter = APIRouter(prefix="/public", tags=["public"])


@publicRouter.get("/cards/{publicSlug}", summary="A shared card for guests (no login). Counts the visit.")
async def getPublicCard(request: Request, publicSlug: str = Path(min_length=4, max_length=64)):
    return await public_card_service.getPublicCard(request, publicSlug)