from sys import prefix

from fastapi import FastAPI
from v1.db.connectDB import connectDB
from fastapi.middleware.cors import CORSMiddleware


app = FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event():
    await connectDB()

@app.get("/")
async def welcome():
    return {"This is a api service for file manager"}

@app.head("/")
async def health_check():
    return JSONResponse(content={"status": "ok"})