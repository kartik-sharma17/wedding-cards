from fastapi import APIRouter, Depends

from v1.schema import CreateCardSchema, UpdateCardSchema
from v1.services import card_service
from v1.dependencies import verifyUserDependency

router = APIRouter(prefix="/cards", tags=["cards"])

@router.post("")
async def createCard(
    payload: CreateCardSchema,
    user: dict = Depends(verifyUserDependency),
):
    return await card_service.createCard(user, payload)


@router.get("/{cardId}")
async def readCard(
    cardId: str,
    user: dict = Depends(verifyUserDependency),
):
    return await card_service.readCard(user, cardId)


@router.patch("/{cardId}")
async def updateCard(
    cardId: str,
    payload: UpdateCardSchema,
    user: dict = Depends(verifyUserDependency),
):
    return await card_service.updateCard(user, cardId, payload)


@router.delete("/{cardId}")
async def deleteCard(
    cardId: str,
    user: dict = Depends(verifyUserDependency),
):
    return await card_service.deleteCard(user, cardId)