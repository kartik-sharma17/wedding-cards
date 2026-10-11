from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder

def response(status: bool = True, message: str = "", data=None, code=200):
    return JSONResponse(
        status_code=code,
        content=jsonable_encoder(
            {"status": status, "message": message, "data": data}
        ),
    )