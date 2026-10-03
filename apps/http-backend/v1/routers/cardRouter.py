from fastapi import APIRouter, Depends

from v1.schema import CreateCardSchema, UpdateCardSchema
from v1.services import card_service
from v1.dependencies import verifyUserDependency

cardRouter = APIRouter(prefix="/cards", tags=["cards"])

@cardRouter.post("")
async def createCard(
    payload: CreateCardSchema,
    user: dict = Depends(verifyUserDependency),
):
    return await card_service.createCard(user, payload)


@cardRouter.get("/{cardId}")
async def readCard(
    cardId: str,
    user: dict = Depends(verifyUserDependency),
):
    return await card_service.readCard(user, cardId)


@cardRouter.patch("/{cardId}")
async def updateCard(
    cardId: str,
    payload: UpdateCardSchema,
    user: dict = Depends(verifyUserDependency),
):
    return await card_service.updateCard(user, cardId, payload)


@cardRouter.delete("/{cardId}")
async def deleteCard(
    cardId: str,
    user: dict = Depends(verifyUserDependency),
):
    return await card_service.deleteCard(user, cardId)