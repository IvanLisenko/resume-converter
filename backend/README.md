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

Endpoints авторизации:

```text
POST /api/v1/auth/login
POST /api/v1/auth/logout
GET  /api/v1/auth/me
```

Endpoints управления сотрудниками:

```text
GET    /api/v1/admin/users
POST   /api/v1/admin/users
GET    /api/v1/admin/users/{user_id}
PATCH  /api/v1/admin/users/{user_id}
PATCH  /api/v1/admin/users/{user_id}/role
PATCH  /api/v1/admin/users/{user_id}/block
PATCH  /api/v1/admin/users/{user_id}/unblock
```

Endpoints резюме:

```text
POST /api/v1/resumes/extract
POST /api/v1/resumes/generate
```

Endpoints партнёров:

```text
GET /api/v1/partners
GET /api/v1/partners/{partner_id}
```

Endpoint справочника шаблонных переменных:

```text
GET /api/v1/template-variables
```

Endpoints администрирования партнёров и шаблонов:

```text
GET    /api/v1/admin/partners
POST   /api/v1/admin/partners
GET    /api/v1/admin/partners/{partner_id}
PATCH  /api/v1/admin/partners/{partner_id}
DELETE /api/v1/admin/partners/{partner_id}

GET  /api/v1/admin/partners/{partner_id}/templates
POST /api/v1/admin/partners/{partner_id}/templates
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
RESUME_CONVERTER_TEMPORARY_UPLOAD_PATH=/tmp/resume-converter/uploads
RESUME_CONVERTER_TEMPORARY_GENERATED_PATH=/tmp/resume-converter/generated
```

## Файловое хранение

Постоянно сохраняются только шаблоны партнёров:

```text
/data/templates/{partner_code}/{template_id}.docx
```

Исходные резюме, сгенерированные резюме и JSON с персональными данными кандидата не предназначены для постоянного хранения.

Временные файлы создаются в отдельных каталогах:

```text
/tmp/resume-converter/uploads
/tmp/resume-converter/generated
```

Временные файлы выдаются через контекстные менеджеры и удаляются при выходе из контекста, включая случаи с ошибкой обработки.

## Авторизация

Доступ к защищённым endpoints выполняется через JWT access token.

Вход:

```http
POST /api/v1/auth/login
```

Тело запроса:

```json
{
  "email": "user@example.com",
  "password": "password"
}
```

Успешный ответ:

```json
{
  "access_token": "...",
  "token_type": "bearer"
}
```

Для защищённых запросов токен передаётся в заголовке:

```text
Authorization: Bearer <access_token>
```

Роли сотрудников:

```text
RECRUITER
ADMIN
```

Пароли хранятся только в виде хеша. Заблокированные сотрудники (`is_active = false`) не могут войти в приложение.

Срок жизни access token по умолчанию - 12 часов.

Создать или обновить первого администратора из переменных окружения:

```bash
docker compose exec backend python -m app.cli create-first-admin
```

Для локального запуска используются переменные:

```text
RESUME_CONVERTER_FIRST_ADMIN_EMAIL
RESUME_CONVERTER_FIRST_ADMIN_FULL_NAME
RESUME_CONVERTER_FIRST_ADMIN_PASSWORD
```

## Извлечение данных из резюме ТРАЙВ

Endpoint `POST /api/v1/resumes/extract` принимает `.docx` файл в формате ТРАЙВ через `multipart/form-data`.

Ограничения:

- поле файла: `file`
- формат: `.docx`
- максимальный размер: 10 МБ
- документ должен открываться как Word-файл
- документ должен содержать устойчивые секции ТРАЙВ: `Навыки`, `О себе`, `Образование`, `Знание языков`, `Опыт работы`

Из файла извлекаются:

- шапка резюме
- навыки
- блок `О себе`
- образование
- языки
- опыт работы по маркерам `Описание проекта`, `Задачи`, `Достижения`, `Команда проекта`, `Стек`

Исходный файл обрабатывается во временном каталоге и удаляется после обработки.

## Генерация партнёрского резюме

Endpoint `POST /api/v1/resumes/generate` принимает выбранного партнёра и актуальную JSON-модель резюме. Backend не хранит JSON резюме между извлечением и генерацией: рекрутер редактирует данные на frontend, а backend получает уже финальную модель для генерации.

Тело запроса:

```json
{
  "partnerId": "00000000-0000-0000-0000-000000000000",
  "resume": {
    "candidate": {
      "full_name": "Тишин Виктор Викторович",
      "position": "Java Developer",
      "level": "Senior",
      "location": "Москва",
      "available_from": "с 01.06.2026"
    },
    "contacts": {},
    "skills": {
      "primary": ["Java", "Spring"],
      "detailed": ["REST API", "PostgreSQL"]
    },
    "summary": "Краткое описание кандидата",
    "education": [],
    "languages": [],
    "experience": [],
    "extra": {}
  }
}
```

Backend находит активный шаблон партнёра, формирует `docxtpl` context, генерирует `.docx`, отдаёт файл на скачивание и удаляет временный файл после отправки ответа. Операция генерации фиксируется в журнале без сохранения персональных данных кандидата.

Для повторной генерации под другого партнёра frontend отправляет тот же отредактированный `resume`, меняя только `partnerId`. Повторная загрузка исходного ТРАЙВ-файла не нужна.

## Партнёры и шаблоны

Рекрутеры и администраторы могут получать список активных партнёров:

```http
GET /api/v1/partners
```

Администратор управляет партнёрами через endpoints `/api/v1/admin/partners`. Удаление партнёра выполняется мягко: запись остаётся в базе, но `is_active` становится `false`.

Создание партнёра:

```http
POST /api/v1/admin/partners
```

```json
{
  "code": "mosbirzha",
  "name": "Мосбиржа",
  "description": "Шаблон резюме для Мосбиржи"
}
```

Код партнёра используется в пути файлового хранилища, поэтому допускает только латинские буквы в нижнем регистре, цифры, дефис и подчёркивание.

Шаблоны партнёров загружаются администратором в формате `.docx`:

```http
POST /api/v1/admin/partners/{partner_id}/templates
```

Форма запроса:

```text
multipart/form-data
file: template.docx
```

При загрузке backend проверяет расширение файла, открываемость `.docx`, наличие шаблонных переменных и соответствие переменных разрешённому справочнику. После успешной проверки файл сохраняется в постоянное хранилище, а в базе создаётся запись версии шаблона. Новый загруженный шаблон становится активным, предыдущие версии этого партнёра деактивируются.

Файл сохраняется по схеме:

```text
/data/templates/{partner_code}/{template_id}.docx
```

В записи шаблона сохраняется `variables_schema`: версия справочника, список переменных, найденных в конкретном `.docx`, и полный список доступных переменных для администратора.

Если шаблон содержит неизвестное поле, backend возвращает ошибку:

```json
{
  "code": "template.unknown_variable",
  "message": "Шаблон содержит неизвестное поле: candidate.birth_date",
  "details": {
    "unknown_variables": ["candidate.birth_date"]
  }
}
```

Разрешённые переменные можно получить через:

```http
GET /api/v1/template-variables
```

Основные переменные:

```text
candidate.full_name
candidate.position
candidate.level
candidate.location
candidate.available_from
candidate.total_experience
candidate.role_title
candidate.position_line
candidate.level_line
candidate.location_line
candidate.available_from_line
summary
has_summary
summary_heading
skills.primary
skills.primary_text
skills.detailed
skills.detailed_text
has_skills
has_primary_skills
has_detailed_skills
skills_heading
education
has_education
education_heading
languages
has_languages
languages_heading
experience
has_experience
experience_heading
recent_projects_heading
checklist_text
has_checklist
checklist_heading
employment.period
```

Для циклов в Word-шаблоне поддерживаются поля элементов:

```jinja
{%p for item in education %}
{{ item.university }}
{{ item.program }}
{{ item.period }}
{{ item.start_year }}
{{ item.end_year }}
{%p endfor %}

{%p for project in experience %}
{{ project.role }}
{{ project.level }}
{{ project.role_title }}
{{ project.project_name }}
{{ project.project_heading }}
{{ project.period }}
{%p if project.has_stack %}
{{ project.stack_line }}
{%p endif %}
{%p if project.has_description %}
{{ project.description_heading }}
{{ project.description }}
{%p endif %}
{%p if project.has_responsibilities %}
{{ project.responsibilities_heading }}
{%p for task in project.responsibilities %}
{{ task }}
{%p endfor %}
{%p endif %}
{%p if project.has_achievements %}
{{ project.achievements_heading }}
{%p for achievement in project.achievements %}
{{ achievement }}
{%p endfor %}
{%p endif %}
{%p endfor %}
```

Для необязательных блоков рекомендуется использовать условия `docxtpl`, чтобы в готовом резюме не оставались пустые подписи:

```jinja
{%p if candidate.level_line %}
{{ candidate.level_line }}
{%p endif %}

{%p if has_checklist %}
{{ checklist_heading }}
{{ checklist_text }}
{%p endif %}

{%p if has_skills %}
{{ skills_heading }}
{{ skills.primary_text }}
{%p for skill in skills.detailed %}
- {{ skill }}
{%p endfor %}
{%p endif %}

{%p if has_education %}
{{ education_heading }}
{%p for item in education %}
{{ item.program }}{% if item.period %} ({{ item.period }}){% endif %}
{{ item.university }}
{%p endfor %}
{%p endif %}

{%p if has_experience %}
{{ experience_heading }}
Трайв Технолоджис ({{ candidate.role_title }})
{{ recent_projects_heading }}
{%p for project in experience %}
{{ project.project_heading }}
{{ project.period }}
{%p if project.has_achievements %}
{{ project.achievements_heading }}
{%p for achievement in project.achievements %}
{{ achievement }}
{%p endfor %}
{%p endif %}
{%p endfor %}
{%p endif %}
```

Backend не подставляет `None` в шаблон: отсутствующие значения передаются как пустые строки. За скрытие заголовков пустых секций отвечает сам шаблон через условия.

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
