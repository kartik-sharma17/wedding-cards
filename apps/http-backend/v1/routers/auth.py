from fastapi import APIRouter
from v1.schema import registerUser, LoginSchema
from v1.services import auth_service

authrouter = APIRouter(prefix="/auth", tags=["auth"])


@authrouter.post("/register")
async def register(user: registerUser):
    return await auth_service.RegisterUser(user)

@authrouter.get("/verify-email/{token}")
async def verifyEmail(token):
    return await auth_service.VerifyAccount(token)


@authrouter.post("/login")
async def login(cred: LoginSchema):
    return await auth_service.Login(cred)

@authrouter.post("/resend-verification")
async def resendVerificationLink(email: str):
    return await auth_service.ResendVerificationLink(email)
