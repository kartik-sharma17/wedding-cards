from fastapi import HTTPException, status


class BadRequestError(HTTPException):
    def __init__(self, message: str = "Bad request"):
        super().__init__(status_code=status.HTTP_400_BAD_REQUEST, detail=message)


class NotFoundError(HTTPException):
    def __init__(self, message: str = "Resource not found"):
        super().__init__(status_code=status.HTTP_404_NOT_FOUND, detail=message)


class UnauthorizedError(HTTPException):
    def __init__(self, message: str = "Not authorized"):
        super().__init__(status_code=status.HTTP_401_UNAUTHORIZED, detail=message)


class ForbiddenError(HTTPException):
    def __init__(self, message: str = "Forbidden"):
        super().__init__(status_code=status.HTTP_403_FORBIDDEN, detail=message)


class ConflictError(HTTPException):
    def __init__(self, message: str = "Already exists"):
        super().__init__(status_code=status.HTTP_409_CONFLICT, detail=message)


class PaymentRequiredError(HTTPException):
    def __init__(self, message: str = "Payment required"):
        super().__init__(status_code=status.HTTP_402_PAYMENT_REQUIRED, detail=message)

class BadRequestError(HTTPException):
    def __init__(self, message: str = "Bad request", data: dict | None = None):
        super().__init__(status.HTTP_400_BAD_REQUEST, message, data)

class InternalServerError(HTTPException):
    def __init__(self, message: str = "Something went wrong, please try again", data: dict | None = None):
        super().__init__(status.HTTP_500_INTERNAL_SERVER_ERROR, message, data)