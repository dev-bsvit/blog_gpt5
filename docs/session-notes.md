# Project log (MVP blog platform)

Дата: 2025‑08‑10

## Что сделано
- Структура монорепо: `apps/web`, `services/java`, `services/php`, `docs`, `firebase`, `cursor/`.
- Сгенерирован фронт `apps/web` (Next.js 15, TypeScript, Tailwind, App Router).
- Документы: `docs/project-rules.md`, `docs/seo-checklist.md`, `docs/design-brief.md`, `docs/dev-checklist.md`, `docs/openapi.yaml` (каркас).
- Firebase правила: `firebase/firestore.rules`, `firebase/storage.rules`, `firebase/firebase.json`.
- Подключён Firebase Auth (Google) на фронте: файлы `src/lib/firebaseClient.ts`, `src/components/AuthButton.tsx`, страницы `src/app/login/page.tsx`, интеграция кнопки на `src/app/page.tsx`.
- Настроено локальное окружение: создан `apps/web/.env.local` (хранит публичные ключи Firebase — не коммитить).
- Сервер разработки запущен: `npm run dev` из `apps/web`.
- Успешный вход через Google подтверждён (пользователь виден в Firebase → Authentication → Users).
- UX/Dev улучшения: `suppressHydrationWarning` в `layout.tsx`, корректировки `next/image` для предупреждений.

## Архитектурный план (высокоуровневый)
- Frontend: Next.js (SSR/ISR, SEO), TypeScript, Tailwind, shadcn/ui, TipTap.
- Auth: Firebase Auth (Google).
- DB/Storage: Firestore + Firebase Storage.
- Backend (оба по одному OpenAPI контракту):
  - Java: Spring Boot 3 + Firebase Admin.
  - PHP: Laravel 11 + kreait/firebase-php.
- Деплой: Front — Vercel; Java — Cloud Run/Render; PHP — Forge/Render.
- Аналитика: GA4 + Search Console.

## Открытые пункты/заметки
- Ранее `.env.local` был пустым → исправлено. Следить, чтобы значения не обнулялись.
- При разработке запускать команды из каталога `apps/web`.
- На клиенте убраны жёсткие проверки env, полагаться на ошибки Firebase.
- Решение: до завершения MVP оставляем хранение статей in-memory (Python FastAPI). После MVP переносим в Firestore.
- Перенос бэкенда на Python завершён; Java backend удалён из репозитория. Эндпоинты сохранены.

## Как запустить локально
```bash
cd "apps/web"
npm run dev
# открыть http://localhost:3000
```

## Следующие шаги (по плану 10 шагов)
1) Этап MVP статей закрыт: health, список, создание, просмотр, редактирование, удаление, публикация/черновики.
2) `docs/openapi.yaml` синхронизирован с реализованными эндпоинтами.
3) Далее (после MVP): комментарии, лайки/закладки, счетчики, поиск, профили авторов, деплой.

## Переменные окружения (Frontend)
Файл: `apps/web/.env.local` (пример, значения не коммитить):
```
NEXT_PUBLIC_API_BASE=...
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

## Быстрая диагностика
- Нет страницы на 3000 → убедиться, что dev запущен в `apps/web`.
- Ошибки входа Firebase → проверить включение Google, `localhost` в Authorized domains, актуальность `.env.local`.
