## Деплой: Vercel (Frontend) + Render (Backend)

Коротко: код в одном GitHub‑репо (монорепо). Бэкенд (FastAPI) деплоим на Render, фронтенд (Next.js) — на Vercel. После деплоя пропишем фронту URL бэкенда.

### 0) Подготовка: залить код в GitHub

```bash
git init
git add .
git commit -m "MVP: blog web (Next.js) + api (FastAPI)"
git branch -M main
git remote add origin https://github.com/<your-org>/<repo>.git
git push -u origin main
```

### 1) Backend → Render

Вариант A (проще, через UI):
- New → Web Service → Connect repository → выбрать ваш репозиторий
- Root Directory: `services/python/api`
- Environment: Python
- Build Command: `pip install -r requirements.txt`
- Start Command: `uvicorn services.python.api.main:app --host 0.0.0.0 --port $PORT`
- Auto Deploy: Yes
- Env Vars:
  - `CORS_ORIGINS=https://<your-vercel-domain>.vercel.app,https://<your-custom-domain>`

Вариант B (через blueprint):
- В репозитории есть `render.yaml` (см. корень). На Render: New → Blueprint → указать GitHub‑репо → Review → Apply.
- После создания сервиса задайте `CORS_ORIGINS` в переменных окружения.

После деплоя получите URL вида `https://<service>.onrender.com`. Итоговый API base: `https://<service>.onrender.com/api/v1`.

### 2) Frontend → Vercel

- New Project → Import Git Repository → выбрать репозиторий
- В Project Settings укажите Root Directory: `apps/web`
- Framework: Next.js (авто)
- Env Vars:
  - `NEXT_PUBLIC_API_BASE=https://<service>.onrender.com/api/v1`
  - `NEXT_PUBLIC_SITE_URL=https://<your-vercel-domain>.vercel.app`
  - Firebase публичные ключи (из консоли Firebase) — для авторизации на клиенте
- Deploy

Опционально: подключите свой домен в Vercel и добавьте его в `CORS_ORIGINS` на Render.

### 3) Проверка после деплоя

1. Откройте `https://<your-vercel-domain>.vercel.app/` — главная должна открываться быстро (ISR).
2. Откройте статью: `/article/welcome` — страница статьи с просмотрами, лайком, закладкой, подпиской.
3. Авторизуйтесь через Google. Проверьте:
   - Лайк/анлайк — счётчик меняется мгновенно, не даёт ставить больше одного лайка на пользователя.
   - Закладка — переключается и отображается на странице закладок.
   - Подписка на автора — переключается, счётчик подписчиков растёт/уменьшается.
4. Редактор — форматирование H2/H3, списки, цитаты, ссылки, изображения — работают точечно по выделению.

### 4) Частые вопросы

- Где задать CORS?
  На Render в переменных окружения сервиса (`CORS_ORIGINS`). Укажите все домены фронтенда через запятую.

- Где задать URL API на фронте?
  На Vercel: `NEXT_PUBLIC_API_BASE` (например, `https://<service>.onrender.com/api/v1`).

- Что с кэшем/быстродействием?
  Бэкенд отвечает с `GZip` и коротким `Cache-Control`. Фронт использует ISR (серверная генерация с перевалидацией) и SWR (клиентский кэш), а также оптимистичные апдейты UI.

- Можно ли мигрировать с in-memory?
  Да, позже вынесем данные в Firestore. API контракты уже выделены, фронт от этого не поменяется.

### 5) Обновления

Любые коммиты в `main` автоматически:
- Фронт: триггерят новый билдаут/деплой в Vercel.
- Бэк: триггерят авто‑деплой в Render (если включён Auto Deploy), либо вручную через кнопку Deploy.


