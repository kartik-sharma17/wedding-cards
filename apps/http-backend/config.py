from dotenv import load_dotenv
import os

load_dotenv()

class Settings:
    MONGO_URL: str = os.getenv("MONGO_URL")
    DATABASE_NAME: str = os.getenv("DATABASE_NAME")
    ACCESS_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_EXPIRE_MINUTES"))
    SECRET_KEY: str = os.getenv("SECRET_KEY")
    ALGORITHM: str = os.getenv("ALGORITHM")

    RESEND_API_KEY: str = os.getenv("RESEND_API_KEY")
    MAIL_FROM_NAME: str = os.getenv("MAIL_FROM_NAME")
    EMAIL_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("EMAIL_TOKEN_EXPIRE_MINUTES"))

    B2_ENDPOINT_URL: str = os.getenv("B2_ENDPOINT_URL")
    B2_ACCESS_KEY_ID: str = os.getenv("B2_ACCESS_KEY_ID")
    B2_SECRET_ACCESS_KEY: str = os.getenv("B2_SECRET_ACCESS_KEY")
    B2_BUCKET_NAME: str = os.getenv("B2_BUCKET_NAME")

    BASE_URL: str = os.getenv("BASE_URL")

settings = Settings()
