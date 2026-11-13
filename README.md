# kt03 — REST API блог-платформы

Express 5 + Prisma ORM 6 + Joi. По умолчанию — SQLite, поддерживается PostgreSQL.

## Запуск

```bash
npm install
cp .env.example .env
npx prisma migrate dev     # применить миграции и сгенерировать клиент
npm start                  # или npm run dev
```

Переход на PostgreSQL: в `prisma/schema.prisma` поменять `provider = "postgresql"`, в `.env` указать
`DATABASE_URL="postgresql://..."`, удалить `prisma/migrations` и выполнить `npx prisma migrate dev --name init`.
Поиск по заголовку тогда автоматически пойдёт с `mode: 'insensitive'` (в SQLite этот режим не поддерживается,
там `contains` работает через `LIKE`, регистронезависимо для латиницы).

## Маршруты

| Метод  | URL             | Описание                          | Успех |
|--------|-----------------|-----------------------------------|-------|
| GET    | /api/users      | Список с пагинацией               | 200   |
| GET    | /api/users/:id  | Пользователь с постами            | 200   |
| POST   | /api/users      | Создать пользователя              | 201   |
| PATCH  | /api/users/:id  | Обновить пользователя             | 200   |
| DELETE | /api/users/:id  | Удалить пользователя (и его посты)| 204   |
| GET    | /api/posts      | Список с фильтрацией и пагинацией | 200   |
| GET    | /api/posts/:id  | Пост с автором и тегами           | 200   |
| POST   | /api/posts      | Создать пост                      | 201   |
| PATCH  | /api/posts/:id  | Обновить пост                     | 200   |
| DELETE | /api/posts/:id  | Удалить пост                      | 204   |

Ошибки: `400` — валидация (`{ error, details: [{ field, message }] }`), `404` — не найдено,
`409` — email уже занят, `500` — внутренняя ошибка.

### GET /api/posts

Query-параметры: `search` (поиск по заголовку), `published` (`true`/`false`), `authorId`, `page`, `limit`.

```json
{ "data": [ ... ], "meta": { "total": 3, "page": 1, "limit": 10, "pages": 1 } }
```

### POST /api/posts

```bash
curl -X POST localhost:3000/api/posts -H 'Content-Type: application/json' \
  -d '{"title":"Hello","content":"Text","published":true,"authorId":1,"tags":["node","prisma"]}'
```

Теги создаются через `connectOrCreate` по имени: существующие подключаются, новые создаются.
В `PATCH /api/posts/:id` поле `tags` заменяет набор тегов поста целиком.

### GET /api/users/:id

Возвращает пользователя с постами (`include`), посты отсортированы по `createdAt` по убыванию.
