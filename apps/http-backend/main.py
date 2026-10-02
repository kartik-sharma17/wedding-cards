from sys import prefix

from fastapi import FastAPI
from v1.db.connectDB import connectDB
from fastapi.middleware.cors import CORSMiddleware
from v1.utility import log
from fastapi.responses import JSONResponse

app = FastAPI()


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    log.exception("Unhandled error on %s", request.url.path)
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event():
    await connectDB()


@app.get("/")
async def welcome():
    return {"This is a api service for Shaan - A Invitation Card Making Site"}


@app.head("/")
async def health_check():
    return JSONResponse(content={"status": "ok"})
