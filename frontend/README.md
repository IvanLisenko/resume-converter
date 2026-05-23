# Frontend конвертера резюме

Frontend-приложение для работы рекрутера с конвертером резюме. Интерфейс позволяет войти в систему, загрузить `.docx` резюме ТРАЙВ, проверить извлечённые данные, выбрать партнёра и скачать сгенерированное резюме в партнёрском формате.

## Технологии

- React
- TypeScript
- Vite
- Axios

## Локальный запуск через Docker

Запуск выполняется из корня репозитория:

```bash
docker compose up --build
```

Frontend будет доступен по адресу:

```text
http://localhost:5173
```

В dev-контуре Vite проксирует запросы `/api` в backend-контейнер:

```text
http://backend:8000
```

## Production-запуск через Docker

Production-сборка выполняется через корневой compose-файл:

```bash
docker compose --env-file backend/.env.production -f docker-compose.prod.yml build frontend
docker compose --env-file backend/.env.production -f docker-compose.prod.yml up -d
```

Frontend будет доступен по адресу:

```text
http://localhost:3000
```

В production-контейнере приложение отдаётся через nginx. Запросы `/api` проксируются из nginx в backend:

```text
http://backend:8000
```

## Локальный запуск без Docker

```bash
npm install
npm run dev
```

По умолчанию Vite проксирует `/api` на локальный backend:

```text
http://localhost:8000
```

Если backend запущен по другому адресу, можно переопределить proxy:

```bash
VITE_API_PROXY_TARGET=http://localhost:8000 npm run dev
```

## Проверки

```bash
npm run lint
npm run build
```
