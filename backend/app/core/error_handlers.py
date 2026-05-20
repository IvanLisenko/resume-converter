from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.errors import AppError


def build_error_response(
    code: str,
    message: str,
    details: dict | list | None = None,
) -> dict:
    return {
        "code": code,
        "message": message,
        "details": details or {},
    }


def register_error_handlers(app: FastAPI) -> None:
    @app.exception_handler(AppError)
    async def app_error_handler(request: Request, exc: AppError) -> JSONResponse:
        return JSONResponse(
            status_code=exc.status_code,
            content=build_error_response(exc.code, exc.message, exc.details),
        )

    @app.exception_handler(StarletteHTTPException)
    async def http_error_handler(request: Request, exc: StarletteHTTPException) -> JSONResponse:
        code = (
            "auth.unauthorized" if exc.status_code == status.HTTP_401_UNAUTHORIZED else "http.error"
        )
        if exc.status_code == status.HTTP_403_FORBIDDEN:
            code = "auth.forbidden"
        return JSONResponse(
            status_code=exc.status_code,
            content=build_error_response(code, str(exc.detail)),
        )

    @app.exception_handler(RequestValidationError)
    async def validation_error_handler(
        request: Request,
        exc: RequestValidationError,
    ) -> JSONResponse:
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content=build_error_response(
                "request.validation_failed",
                "Некорректные данные запроса",
                exc.errors(),
            ),
        )

    @app.exception_handler(Exception)
    async def unexpected_error_handler(request: Request, exc: Exception) -> JSONResponse:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=build_error_response("internal.error", "Внутренняя ошибка сервера"),
        )
