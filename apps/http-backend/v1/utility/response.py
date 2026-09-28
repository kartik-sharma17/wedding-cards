from fastapi.responses import JSONResponse


def response(status: bool = True, message: str = "", data=None, code=200):
    return JSONResponse(
        status_code=code, content={"status": status, "message": message, "data": data}
    )
