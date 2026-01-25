# Localisio

**Localisio** — платформа для связи экспатов с местными специалистами, говорящими на их языке.

## Стек технологий

- **Frontend**: Next.js 14+ (App Router), TypeScript, Tailwind CSS
- **Backend**: Supabase (Auth, PostgreSQL, Storage, Realtime)
- **i18n**: next-intl (EN, RU, UK, ES)
- **Deploy**: Vercel

## Структура проекта

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   ├── auth/              # Auth pages
│   ├── dashboard/         # Protected dashboard
│   ├── admin/             # Admin panel
│   ├── p/[id]/            # Provider profiles
│   └── search/            # Search page
├── components/            # React components
│   ├── ui/               # Base UI components
│   ├── layout/           # Layout components
│   ├── auth/             # Auth forms
│   ├── providers/        # Provider-related components
│   └── messages/         # Chat components
├── config/               # Configuration files
├── lib/                  # Utilities and clients
│   ├── supabase/        # Supabase clients
│   └── validations/     # Zod schemas
├── i18n/                 # i18n configuration
├── messages/             # Translation files
└── types/                # TypeScript types

supabase/
└── migrations/           # SQL migrations
```

## Быстрый старт

### 1. Установка зависимостей

```bash
npm install
```

### 2. Настройка Supabase

#### Вариант A: Supabase Cloud (рекомендуется)

1. Создайте проект на [supabase.com](https://supabase.com)
2. Скопируйте `SUPABASE_URL` и `SUPABASE_ANON_KEY` из Settings → API
3. Скопируйте `SUPABASE_SERVICE_ROLE_KEY` из Settings → API → service_role key

#### Вариант B: Локальный Supabase

```bash
# Установите Supabase CLI
npm install -g supabase

# Запустите локально
supabase start
```

### 3. Настройка переменных окружения

Скопируйте `.env.example` в `.env.local` и заполните значения:

```bash
cp .env.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_DEV_AUTH_BYPASS=true
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Применение миграций

В Supabase Dashboard:
1. Перейдите в SQL Editor
2. Выполните файлы из `supabase/migrations/` по порядку:
   - `001_initial_schema.sql`
   - `002_rls_policies.sql`
   - `003_storage.sql`

Или через CLI:
```bash
supabase db push
```

### 5. Создание Storage Bucket

В Supabase Dashboard:
1. Storage → Create new bucket
2. Name: `provider-photos`
3. Public: Yes
4. File size limit: 10MB
5. Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`

### 6. Запуск приложения

```bash
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000)

### 7. Создание администратора

После регистрации первого пользователя, выполните в SQL Editor:

```sql
INSERT INTO admin_roles (user_id, role)
VALUES ('your-user-uuid', 'admin');
```

## Деплой на Vercel

### 1. Подключение репозитория

1. Импортируйте проект в [Vercel](https://vercel.com)
2. Подключите GitHub репозиторий

### 2. Настройка переменных окружения

В Vercel Dashboard → Settings → Environment Variables добавьте:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_DEV_AUTH_BYPASS=false` (для production)
- `NEXT_PUBLIC_APP_URL` (ваш домен)

### 3. Настройка Supabase для Production

В Supabase Dashboard:
1. Authentication → URL Configuration
2. Добавьте ваш Vercel URL в Site URL и Redirect URLs

### 4. Deploy

```bash
vercel --prod
```

## API Endpoints

### Providers
- `GET /api/providers/search` - Поиск провайдеров
- `GET /api/providers/featured` - Топ провайдеров
- `GET /api/providers/[id]` - Получить провайдера
- `PATCH /api/providers/[id]` - Обновить профиль (свой)

### Messages
- `GET /api/conversations` - Получить диалоги
- `POST /api/messages` - Отправить сообщение
- `GET /api/messages/[conversationId]` - Получить сообщения
- `POST /api/messages/[conversationId]` - Отправить в диалог

### Photos
- `GET /api/photos` - Получить фото
- `POST /api/photos` - Загрузить фото
- `DELETE /api/photos?id=` - Удалить фото
- `PATCH /api/photos/[id]/primary` - Сделать основным

### Admin
- `PATCH /api/admin/providers/[id]` - Админ-редактирование

## Роли и права

### Seeker (ищу услуги)
- Поиск провайдеров
- Просмотр профилей
- Отправка сообщений

### Provider (предоставляю услуги)
- Все возможности Seeker
- Редактирование профиля
- Загрузка фото
- Получение сообщений

### Admin
- Все возможности Provider
- Верификация провайдеров
- Управление featured и priority
- Админ-панель

## Особенности

- **Мультиязычность**: EN, RU, UK, ES
- **Гео-определение**: Vercel headers для страны
- **SEO**: SSR, JSON-LD, sitemap, robots.txt
- **Real-time**: Supabase Realtime для чата
- **Rate limiting**: Защита от спама

## Структура БД

```
profiles           - Базовые профили пользователей
provider_profiles  - Расширенные профили провайдеров
provider_photos    - Фото провайдеров (max 5)
conversations      - Диалоги между пользователями
messages           - Сообщения в диалогах
notifications      - Уведомления
admin_roles        - Роли администраторов
```

## RLS Policies

- Профили: публичное чтение, редактирование только своего
- Сообщения: доступ только участникам диалога
- Фото: публичное чтение, управление только своими
- Admin: отдельные политики для админских операций

## Разработка

```bash
# Запуск dev сервера
npm run dev

# Сборка
npm run build

# Линтинг
npm run lint

# Форматирование
npx prettier --write .
```

## Будущие улучшения

- [ ] Интеграция Stripe для платного продвижения
- [ ] Расширенная аналитика для провайдеров
- [ ] Push-уведомления
- [ ] Видео-консультации
- [ ] Отзывы и рейтинги
