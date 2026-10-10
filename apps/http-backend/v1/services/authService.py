import email

from v1.models import User
from v1.schema import registerUser, LoginSchema, AuthMe
from v1.db.connectDB import getDB
from v1.utility import (
    response,
    HashPassword,
    GenerateEmailVerifyToken,
    SendVerificationEmail,
    VerifyPassword,
    GenerateToken,
    VerifyEmailToken,
    ConflictError,
    NotFoundError,
    UnauthorizedError,
    BadRequestError,
    InternalServerError,
)

class Auth:
    @property
    def collection(self):
        return getDB()["User"]

    async def RegisterUser(self, user: registerUser):
        existUser = await self.collection.find_one({"email": user.email})

        if existUser is not None:
            if existUser.get("is_verified"):
                raise ConflictError("User is Already Exist with this Email id")

            hashed_password = HashPassword(user.password)
            await self.collection.update_one(
                {"email": user.email},
                {
                    "$set": {
                        "full_name": user.full_name,
                        "password": hashed_password,
                        "avatar": user.avatar,
                        "phone": user.phone if user.phone else None,
                    }
                },
            )
        else:
            hashed_password = HashPassword(user.password)
            new_user = User(
                full_name=user.full_name,
                email=user.email,
                password=hashed_password,
                avatar=user.avatar,
                phone=user.phone if user.phone else None,
            )
            await self.collection.insert_one(new_user.dict(by_alias=True, exclude={"id"}))

        verificationToken = await GenerateEmailVerifyToken(user.email)
        sendMail = await SendVerificationEmail(
            email=user.email, name=user.full_name, token=verificationToken
        )

        if not sendMail:
            raise InternalServerError("Something went wrong while sending email, please try again")

        return response(message="Verication link is successfully sended to your email ID")

    async def ResendVerificationLink(self, email: str):
        existUser = await self.collection.find_one({"email": email})

        if existUser is None:
            raise NotFoundError("User not found with this email Id")

        if existUser.get("is_verified"):
            raise ConflictError("Account already verified, please login")

        verificationToken = await GenerateEmailVerifyToken(existUser.get("email"))
        sendMail = await SendVerificationEmail(
            email=existUser.get("email"), name=existUser.get("full_name"), token=verificationToken
        )

        if not sendMail:
            raise InternalServerError("Something went wrong while sending email, please try again")

        return response(message="Verication link is successfully sended to your email ID")

    async def VerifyAccount(self, token):
        result = await VerifyEmailToken(token)

        if result is None:
            raise UnauthorizedError("Invalid or expired verification link, please try again")

        email = result["sub"]
        user = await self.collection.find_one({"email": email})

        if not user:
            raise NotFoundError("User not found")

        await self.collection.update_one({"email": email}, {"$set": {"is_verified": True}})

        newToken = GenerateToken(
            data={
                "email": user["email"],
                "userName": user["full_name"],
                "userId": str(user["_id"]),
            }
        )

        return response(
            message="Account Verification Successful",
            data={
                "token": newToken,
                "name": user["full_name"],
                "email": user["email"],
                "last_login": user.get("last_login"),
            },
        )

    async def Login(self, cred: LoginSchema):
        email = cred.email
        password = cred.password

        if not email:
            raise BadRequestError("please Enter Email ID")

        if not password:
            raise BadRequestError("please Enter Password")

        user = await self.collection.find_one({"email": email})

        if user is None:
            raise NotFoundError(
                "No account associated with this email ID, please check your email ID or sign up"
            )

        if user.get("is_verified") is False:
            raise UnauthorizedError("Account is not verified, please verify your account to login")

        if not VerifyPassword(password, user["password"]):
            raise UnauthorizedError("Wrong password, please check your password and try again")

        token = GenerateToken(
            data={
                "email": user["email"],
                "userName": user["full_name"],
                "userId": str(user["_id"]),
            }
        )

        return response(
            message="Login Successfully",
            data={
                "token": token,
                "name": user["full_name"],
                "email": user["email"],
                "last_login": user.get("last_login"),
            },
        )

    async def GetMe(self,user:str):
        userData = AuthMe(
            email = user["email"] if user.get("email") else None,
            role = user["role"] if user.get("role") else None,
        )
        return response(
                    message="User data fetched Successfully",
                    data=userData.model_dump(),
                )


auth_service = Auth()