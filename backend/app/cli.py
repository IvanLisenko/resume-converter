import argparse
import asyncio

from app.core.config import settings
from app.db.session import async_session_maker, engine
from app.services.user_service import UserService


async def create_first_admin() -> None:
    required_values = {
        "RESUME_CONVERTER_FIRST_ADMIN_EMAIL": settings.first_admin_email,
        "RESUME_CONVERTER_FIRST_ADMIN_FULL_NAME": settings.first_admin_full_name,
        "RESUME_CONVERTER_FIRST_ADMIN_PASSWORD": settings.first_admin_password,
    }
    missing_values = [name for name, value in required_values.items() if not value]
    if missing_values:
        names = ", ".join(missing_values)
        raise RuntimeError(f"Не заданы переменные окружения: {names}")

    async with async_session_maker() as session:
        user = await UserService(session).create_or_update_first_admin(
            email=settings.first_admin_email or "",
            full_name=settings.first_admin_full_name or "",
            password=settings.first_admin_password or "",
        )

    await engine.dispose()
    print(f"Первый администратор готов: {user.email}")


def main() -> None:
    parser = argparse.ArgumentParser()
    subparsers = parser.add_subparsers(dest="command", required=True)
    subparsers.add_parser("create-first-admin")

    args = parser.parse_args()
    if args.command == "create-first-admin":
        asyncio.run(create_first_admin())


if __name__ == "__main__":
    main()
