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
    
    IMAGEKIT_PRIVATE_KEY: str = os.getenv("IMAGEKIT_PRIVATE_KEY")

    RAZORPAY_API: str = os.getenv("RAZORPAY_API")
    RAZOR_PAY_API_KEY: str = os.getenv("RAZOR_PAY_API_KEY")
    RAZOR_PAY_SECRET: str = os.getenv("RAZOR_PAY_SECRET")

    PDF_TOKEN_SECRET: str = os.getenv("PDF_TOKEN_SECRET")
    PDF_FRONTEND_URL: str = os.getenv("PDF_FRONTEND_URL")
    CACHE_DIR: str = os.getenv("CACHE_DIR")
    PDF_MAX_CONCURRENCY: int = os.getenv("PDF_MAX_CONCURRENCY")
    PDF_RENDER_VERSION: int = os.getenv("PDF_RENDER_VERSION")
    PDF_CHROME_CHANNEL: int = os.getenv("PDF_CHROME_CHANNEL")

settings = Settings()
