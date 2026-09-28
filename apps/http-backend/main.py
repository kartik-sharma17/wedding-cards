from sys import prefix

from fastapi import FastAPI
from v1.db.connectDB import connectDB
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from v1.routers import authrouter, documentRouter, folderRouter


app = FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000","https://file-manager-web-psi.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(authrouter, prefix="/v1")
app.include_router(documentRouter, prefix="/v1")
app.include_router(folderRouter, prefix="/v1")

@app.on_event("startup")
async def startup_event():
    await connectDB()

@app.get("/")
async def welcome():
    return {"This is a api service for file manager"}

@app.head("/")
async def health_check():
    return JSONResponse(content={"status": "ok"})