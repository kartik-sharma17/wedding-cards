from bson import ObjectId
from bson.errors import InvalidId

from v1.utility import BadRequestError


def toObjectId(value: str, message: str = "Invalid ID") -> ObjectId:
    try:
        return ObjectId(value)
    except (InvalidId, TypeError):
        raise BadRequestError(message)