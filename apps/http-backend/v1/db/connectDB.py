from motor.motor_asyncio import AsyncIOMotorClient
from fastapi import FastAPI
from config import settings

client = None
db = None


async def connectDB():
    global client, db
    client = AsyncIOMotorClient(settings.MONGO_URL)
    db = client[settings.DATABASE_NAME]
    print("Connected to MongoDB!")


def getDB():
    if db is None:
        raise Exception("DB not connected yet!")
    return db


async def disconnectDB():
    global client
    if client:
        client.close()
        print("🛑 MongoDB connection closed")
