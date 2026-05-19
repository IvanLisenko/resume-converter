class AppError(Exception):
    """Базовая ошибка приложения со стабильным API-кодом."""

    def __init__(self, code: str, message: str, details: dict | None = None) -> None:
        self.code = code
        self.message = message
        self.details = details or {}
        super().__init__(message)
