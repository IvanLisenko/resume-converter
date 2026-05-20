# Backend конвертера резюме

Backend-сервис для перевода резюме из формата ТРАЙВ `.docx` в партнёрские шаблоны `.docx`.

## Назначение

Сервис принимает резюме кандидата в формате ТРАЙВ, извлекает данные в единую внутреннюю модель и генерирует готовый `.docx` по шаблону выбранного партнёра. Приложение рассчитано на работу рекрутеров и администраторов: рекрутеры конвертируют резюме, администраторы управляют партнёрами, шаблонами и сотрудниками.

Ключевое требование проекта: исходные и сгенерированные резюме не хранятся постоянно. В базе остаются только служебные записи об операциях, а персональные данные кандидата удаляются после обработки.

## Архитектура

Backend построен как FastAPI-приложение с разделением ответственности по слоям:

- `api` - HTTP-эндпоинты и сборка роутеров
- `schemas` - Pydantic DTO для запросов и ответов
- `models` - SQLAlchemy ORM-модели
- `repositories` - работа с базой данных
- `services` - бизнес-логика
- `documents` - парсинг, валидация и генерация `.docx`
- `storage` - работа с файлами и жизненный цикл временных файлов
- `core` - настройки, безопасность, логирование и ошибки приложения
- `db` - подключение к базе данных и интеграция миграций

## Структура

```text
backend/
  app/
    api/
    core/
    db/
    models/
    schemas/
    repositories/
    services/
    documents/
    storage/
    tests/
  alembic/
  Dockerfile
  pyproject.toml
  README.md
```

## Локальный запуск

Основной способ запуска для разработки - через Docker Compose из корня репозитория. Compose-файл расположен в корне, чтобы единообразно запускать backend сейчас и frontend на следующих этапах:

```bash
docker compose up --build
```

Команда поднимает:

- backend-сервис на FastAPI;
- PostgreSQL;
- volume для данных PostgreSQL;
- volume для постоянного хранения шаблонов партнёров.

Backend будет доступен по адресу:

```text
http://localhost:8000
```

Документация FastAPI будет доступна по адресу:

```text
http://localhost:8000/docs
```

Системные endpoints:

```text
GET /api/v1/health
GET /api/v1/ready
```

Также приложение можно установить и запустить локально без Docker:

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
uvicorn app.main:app --reload
```

## Настройки

Настройки читаются из переменных окружения с префиксом `RESUME_CONVERTER_`.

Для локального Docker-запуска используется файл `backend/.env`. Пример значений хранится в `backend/.env.example`.

Примеры:

```bash
RESUME_CONVERTER_APP_NAME="API конвертера резюме"
RESUME_CONVERTER_ENVIRONMENT="local"
RESUME_CONVERTER_DATABASE_URL=postgresql+psycopg://resume_converter:resume_converter@postgres:5432/resume_converter
RESUME_CONVERTER_TEMPLATE_STORAGE_PATH=/data/templates
```

## База данных

В локальном Docker-контуре используется PostgreSQL. Параметры подключения с хост-машины:

```text
Host: localhost
Port: 5432
Database: resume_converter
User: resume_converter
Password: resume_converter
```

JDBC URL для IDE:

```text
jdbc:postgresql://localhost:5432/resume_converter
```

Проверить доступность PostgreSQL:

```bash
docker compose exec -T postgres pg_isready -U resume_converter -d resume_converter
```

Основные таблицы:

- `users` - сотрудники приложения
- `partners` - партнёры
- `partner_templates` - версии шаблонов партнёров
- `operation_logs` - журнал операций без персональных данных резюме

## Миграции

Схема базы данных управляется через Alembic. Конфигурация находится в `alembic.ini`, файлы миграций - в `alembic/versions`.

Применить миграции:

```bash
docker compose exec backend alembic upgrade head
```

Посмотреть текущую ревизию:

```bash
docker compose exec backend alembic current
```

Проверить, что ORM-модели и миграции синхронизированы:

```bash
docker compose exec backend alembic check
```

Создать новую миграцию после изменения ORM-моделей:

```bash
docker compose exec backend alembic revision --autogenerate -m "описание изменения"
```
