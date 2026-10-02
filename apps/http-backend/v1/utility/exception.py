from fastapi import HTTPException, status


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