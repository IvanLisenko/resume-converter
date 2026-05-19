# Миграции Alembic

В этой папке хранятся миграции схемы PostgreSQL.

Основные файлы:

- `env.py` - подключает настройки приложения и общий реестр SQLAlchemy-моделей.
- `script.py.mako` - шаблон новых файлов миграций.
- `versions/` - история миграций базы данных.

Применить миграции из Docker-контейнера:

```bash
docker compose exec backend alembic upgrade head
```
