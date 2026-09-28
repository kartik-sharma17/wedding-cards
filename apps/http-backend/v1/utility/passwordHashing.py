from passlib.context import CryptContext
import hashlib

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def HashPassword(password: str)-> str:
    return pwd_context.hash(password)


def VerifyPassword(plainPass: str, hashPass: str):
    return pwd_context.verify(plainPass, hashPass)
