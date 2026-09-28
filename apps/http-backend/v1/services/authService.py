from v1.models import User
from fastapi import HTTPException
from v1.schema import registerUser, LoginSchema
from v1.db.connectDB import getDB
from v1.utility import response, HashPassword, GenerateEmailVerifyToken, SendVerificationEmail, log, VerifyPassword, GenerateToken, VerifyEmailToken

class Auth:
    @property
    def collection(self):
        return getDB()["User"]

    async def RegisterUser(self, user: registerUser):
        try:
            existUser = await self.collection.find_one({"email": user.email})
            if existUser is not None:
                if existUser.get("is_verified"):
                    raise HTTPException(
                        status_code=409,
                        detail={
                            "message":"User is Already Exist with this Email id",
                            "status":False,
                        }
                    )
                else:
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
                    
                    verificationToken = await GenerateEmailVerifyToken(user.email)
                    sendMail = await SendVerificationEmail(
                        email=user.email, name=user.full_name, token=verificationToken
                    )
                    if sendMail:
                        return response(
                            message="Verication link is successfully sended to your email ID"
                        )
                    else:
                        raise HTTPException(
                            status_code=500,
                            detail={
                                "status":False,
                                "message":"Something went wrong while sending email, please try again",
                            }
                        )

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
            if sendMail:
                return response(
                    message="Verication link is successfully sended to your email ID"
                )
            else:
                raise HTTPException(
                    status_code=500,
                    detail={
                        "status":False,
                        "message":"Something went wrong while sending email, please try again",
                    }
                )
        except HTTPException:
            raise
        except Exception as e:
            log.info(f"this is a issue {str(e)}")
            return HTTPException(
                status_code=500,
                detail={
                    "message":"Something went wrong while creating a new account, please try again",
                    "status":False
                }
            )

    async def ResendVerificationLink(self,email: str):
        try:
            existUser = await self.collection.find_one({"email": email})
            if existUser is None:
                raise HTTPException(
                    status_code=404,
                    detail={
                        "status": False,
                        "message": "User not found with this email Id",
                        "data": None,
                    },
                )

            if existUser.get("is_verified"):
                raise HTTPException(
                    status_code=409,
                    detail={
                        "status": False,
                        "message": "Account already verified, please login",
                        "data": None,
                    },
                )

            verificationToken = await GenerateEmailVerifyToken(existUser.get("email"))

            sendMail = await SendVerificationEmail(
                email=existUser.get("email"), name=existUser.get("full_name"), token=verificationToken
            )

            if sendMail:
                return response(
                    message="Verication link is successfully sended to your email ID"
                )
            else:
                raise HTTPException(
                status_code=500,
                detail={
                        "status":False,
                        "message":"Something went wrong while sending email, please try again",
                    }
                )
        except HTTPException:
            raise
        except Exception as e:
            log.info(f"this is a issue {str(e)}")
            return HTTPException(
                status_code=500,
                detail={
                "message":"Something went wrong, please try again",
                "status":False
                }
            )

    async def VerifyAccount(self, token):
        try:
            result = await VerifyEmailToken(token)

            if result is None:
                raise HTTPException(
                    status_code=401,
                    detail={
                        "status": False,
                        "message": "Invalid or expired verification link, please try again",
                    },
                )

            email = result["sub"]

            user = await self.collection.find_one({"email": email})

            if not user:
                raise HTTPException(
                    status_code=404,
                    detail={
                        "status": False,
                        "message": "User not found",
                    },
                )

            await self.collection.update_one(
                {"email": email}, {"$set": {"is_verified": True}}
            )

            token = GenerateToken(
                data={
                    "email": user["email"],
                    "userName": user["full_name"],
                    "userId": str(user["_id"]),
                }
            )

            return response(
                message="Account Verification Successful",
                data={
                    "token": token,
                    "name": user["full_name"],
                    "email": user["email"],
                    "last_login": user.get("last_login"),
                },
            )
        except HTTPException:
            raise
        except Exception as e:
            log.info(f"this is a issue {str(e)}")
            raise HTTPException(
                status_code=500,
                detail={
                    "message": "Something went wrong while verifying your account, please try again",
                    "status": False,
                },
            )

    async def Login(self, cred:LoginSchema):
        try:
            email = cred.email
            password = cred.password

            if not email:
                raise HTTPException(
                    status_code=400,
                    detail={"status": False, "message": "please Enter Email ID"},
                )

            if not password:
                raise HTTPException(
                    status_code=400,
                    detail={"status": False, "message": "please Enter Password"},
                )

            user = await self.collection.find_one({"email": email})

            if user is None:
                raise HTTPException(
                    status_code=404,
                    detail={
                        "status": False,
                        "message": "No account associated with this email ID, please check your email ID or sign up",
                    },
                )

            if user.get("is_verified") is False:
                raise HTTPException(
                    status_code=401,
                    detail={
                        "status": False,
                        "message": "Account is not verified, please verify your account to login",
                    },
                )

            if not VerifyPassword(password, user["password"]):
                raise HTTPException(
                    status_code=401,
                    detail={
                        "status": False,
                        "message": "Wrong password, please check your password and try again",
                    },
                )

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
        except HTTPException:
            raise
        except Exception as e:
            log.info(f"this is a issue {str(e)}")
            raise HTTPException(
                status_code=500,
                detail={
                    "message": "Something went wrong, please try again",
                    "status": False,
                },
            )

auth_service = Auth()