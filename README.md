# Bull or Bear 🐂🐻

🌐 Проект доступен на **https://kurs-kripto.ru**

---

Веб-приложение для торговли криптовалютами на игровые коины. Пользователи наблюдают за свечными графиками в реальном времени и делают ставки — вырастет ли монета (Bull 📈) или упадёт (Bear 📉). Никаких реальных денег — только игровая механика с балансом, квестами и лидербордом.

Проект ориентирован на бэкенд: Django REST API, Celery-очередь для расчёта ставок по таймеру, Django Channels для WebSocket-стриминга цен с Binance, полноценная система заданий и рейтинговая таблица.

---

## Стек технологий

| Слой | Технология |
|------|-----------|
| Backend | Python 3.12, Django 5.1, Django REST Framework |
| Frontend | React 18, Vite 7, JavaScript (не TypeScript) |
| База данных | PostgreSQL 15+ (SQLite в режиме разработки) |
| Очереди / задачи | Celery 5 + Redis 7 |
| WebSocket | Django Channels 4 + channels-redis |
| Внешний API | Binance REST + WebSocket (публичный, без ключа) |
| Аутентификация | JWT (djangorestframework-simplejwt) |
| Графики | lightweight-charts v5 (TradingView) |
| Деплой | Docker + docker-compose + Nginx + Daphne |

---

## Структура проекта

```
bull-or-bear/
├── PLAN.md
├── docker-compose.yml
├── nginx/
│   └── nginx.conf
├── bull-or-bear-backend/          # Django-проект
│   ├── config/
│   │   ├── settings.py
│   │   ├── urls.py
│   │   ├── asgi.py
│   │   └── celery.py
│   ├── apps/
│   │   ├── users/
│   │   ├── coins/
│   │   ├── bets/
│   │   ├── market/
│   │   └── leaderboard/
│   ├── entrypoint.sh
│   ├── Dockerfile
│   ├── requirements.txt
│   └── manage.py
└── bull-or-bear-frontend/         # React-приложение
    ├── src/
    │   ├── pages/
    │   ├── components/
    │   ├── api/
    │   ├── context/
    │   ├── hooks/
    │   └── constants/
    ├── Dockerfile
    └── package.json
```

---

## Backend — подробная документация

### App: `users`

**Назначение:** кастомная модель пользователя, JWT-аутентификация, верификация аккаунта.

#### Модели

| Модель | Поля |
|--------|------|
| `User` | Наследует `AbstractUser` + `is_verified` (bool, default=False) |
| `UserProfile` | `user` (OneToOne), `coins` (int, default=1000), `last_daily_bonus` (date), `created_at`, `updated_at` |
| `VerificationCode` | `user` (FK), `code` (str, max 10), `created_at` |

**Логика:** при создании `User` сигнал автоматически создаёт `UserProfile` с балансом 1000 коинов.
**Верификация:** код "4444" (временно захардкожен, будет заменён на email-рассылку).

#### API эндпоинты

| Метод | URL | Описание | Auth |
|-------|-----|----------|------|
| POST | `/api/v1/auth/register/` | Регистрация (username, email, password) | — |
| POST | `/api/v1/auth/verify/` | Верификация кода (email, code) | — |
| POST | `/api/v1/auth/login/` | Вход → JWT (access + refresh) | — |
| POST | `/api/v1/auth/token/refresh/` | Обновление access-токена | — |
| GET | `/api/v1/auth/profile/` | Профиль пользователя + баланс | ✅ JWT |

---

### App: `coins`

**Назначение:** игровые коины, ежедневный бонус, система квестов.

#### Модели

| Модель | Поля |
|--------|------|
| `Quest` | `title`, `description`, `reward` (int), `quest_type` (choices: `first_bet_day`, `bets_day_5`, `wins_streak_3`), `target_value` (int), `is_daily` (bool), уникальный `quest_type` |
| `UserQuest` | `user` (FK), `quest` (FK), `progress` (int), `is_completed` (bool), `completed_at` (datetime), `last_progress_date` (date), уникальность по `(user, quest)` |

#### API эндпоинты

| Метод | URL | Описание | Auth |
|-------|-----|----------|------|
| POST | `/api/v1/coins/daily/` | Ежедневный бонус (+50 коинов) | ✅ JWT |
| GET | `/api/v1/coins/quests/` | Список квестов с прогрессом | ✅ JWT |

#### Квесты

| Тип | Условие | Награда |
|-----|---------|---------|
| `first_bet_day` | Первая ставка за день | +20 коинов |
| `bets_day_5` | 5 ставок за день | +100 коинов |
| `wins_streak_3` | 3 победы подряд | +200 коинов |

---

### App: `bets`

**Назначение:** создание ставок, отслеживание активных, расчёт результата по таймеру.

#### Модели

| Модель | Поля |
|--------|------|
| `Bet` | `user` (FK), `symbol` (str), `direction` (`bull`/`bear`), `amount` (int, min 10), `duration` (int, варианты: 5/10/60/600/3600 сек), `status` (`active`/`won`/`lost`/`draw`), `open_price` (decimal), `close_price` (decimal, null), `created_at`, `updated_at`, `resolved_at` (null) |

**Расчёт выплат:**
- Победа: `amount × 1.9` (комиссия площадки 10%)
- Ничья: возврат `amount`
- Проигрыш: `0`

#### API эндпоинты

| Метод | URL | Описание | Auth |
|-------|-----|----------|------|
| POST | `/api/v1/bets/create/` | Создать ставку (проверка баланса) | ✅ JWT |
| GET | `/api/v1/bets/active/` | Активные ставки пользователя | ✅ JWT |
| GET | `/api/v1/bets/history/` | История ставок (последние 50) | ✅ JWT |
| POST | `/api/v1/bets/resolve-expired/` | Ручной запуск расчёта просроченных | ✅ JWT |

#### Celery-задачи

| Задача | Описание |
|--------|----------|
| `bets.resolve_bet(bet_id)` | Запускается с countdown (duration сек) при создании ставки. Получает текущую цену с Binance, сравнивает с `open_price`, начисляет выигрыш / фиксирует проигрыш, обновляет статус ставки и баланс |

---

### App: `market`

**Назначение:** получение и хранение свечей с Binance, WebSocket-стриминг цен в реальном времени.

#### Модели

| Модель | Поля |
|--------|------|
| `Candle` | `symbol`, `interval`, `open_time` (datetime), `open`, `high`, `low`, `close`, `volume` (все decimal), `created_at`, `updated_at`. Уникальность по `(symbol, interval, open_time)` |

**Отслеживаемые криптовалюты:**
`BTCUSDT` · `ETHUSDT` · `BNBUSDT` · `SOLUSDT` · `XRPUSDT` · `DOGEUSDT` · `ADAUSDT` · `AVAXUSDT`

#### API эндпоинты

| Метод | URL | Описание | Auth |
|-------|-----|----------|------|
| GET | `/api/v1/market/symbols/` | Список доступных символов | — |
| GET | `/api/v1/market/candles/?symbol=BTCUSDT&interval=1m&limit=100` | Свечи (интервалы: 1m, 15m, 1h, 1d; лимит до 500) | — |

#### Celery-задачи

| Задача | Описание |
|--------|----------|
| `market.update_candles()` | Периодическая задача (каждую минуту). Запрашивает последние 100 свечей с Binance REST API для каждого из 8 символов и сохраняет в БД |

#### WebSocket

```
ws://localhost:8000/ws/market/{symbol}/
```

`MarketConsumer` (AsyncWebsocketConsumer) подключается к `wss://stream.binance.com/ws/<symbol>@kline_1m` и транслирует данные клиенту в формате:

```json
{
  "symbol": "BTCUSDT",
  "time": 1710000000,
  "open": "65000.00000000",
  "high": "65100.00000000",
  "low": "64900.00000000",
  "close": "65050.00000000",
  "volume": "12.34567800",
  "is_closed": false
}
```

Автоматически переподключается при обрыве соединения (пауза 3 сек).

---

### App: `leaderboard`

**Назначение:** рейтинговая таблица игроков по балансу коинов.

**Модели:** отсутствуют (агрегирует данные из `UserProfile` и `Bet`).

#### API эндпоинты

| Метод | URL | Описание | Auth |
|-------|-----|----------|------|
| GET | `/api/v1/leaderboard/` | Топ-50 игроков (кэш 5 мин) | — |
| GET | `/api/v1/leaderboard/my-rank/` | Место текущего пользователя среди всех | ✅ JWT |

**Поля ответа:** `rank`, `username`, `coins`, `total_bets`, `win_rate` (%).

---

## Frontend — структура

```
bull-or-bear-frontend/src/
├── pages/
│   ├── Home.jsx            # Главная: график + панель ставок
│   ├── ActiveBets.jsx      # Активные ставки с таймером обратного отсчёта
│   ├── Leaderboard.jsx     # Рейтинговая таблица (топ-10 + место пользователя)
│   ├── Profile.jsx         # Профиль: статистика, баланс, квесты
│   ├── Rewards.jsx         # Ежедневный бонус
│   ├── Quests.jsx          # Список квестов с прогресс-барами
│   ├── Trade.jsx           # Торговая страница
│   └── Auth/               # Register, Verify, Login
├── components/
│   ├── Layout.jsx          # Шапка с навигацией и балансом
│   ├── PriceChart.jsx      # Свечной график (lightweight-charts)
│   ├── BetPanel.jsx        # Панель создания ставки
│   ├── CoinBalance.jsx     # Отображение баланса коинов
│   └── Timer.jsx           # Таймер обратного отсчёта
├── api/
│   └── client.js           # Axios с JWT interceptor (auto refresh)
├── context/
│   └── AuthContext.jsx     # Хранение токена, user, login/logout
├── hooks/
│   └── useMarketWebSocket.js  # WebSocket хук для реалтайм цен
└── constants/
    └── coins.js            # Список символов криптовалют
```

---

## Запуск локально

### Вариант 1 — Вручную

#### Backend

```bash
cd bull-or-bear-backend

# Создать виртуальное окружение
python -m venv venv
source venv/bin/activate       # Linux/Mac
venv\Scripts\activate          # Windows

# Установить зависимости
pip install -r requirements.txt

# Применить миграции
python manage.py migrate

# Запустить Django
python manage.py runserver
# API доступен на http://localhost:8000/api/v1/
```

**Celery (для расчёта ставок и обновления свечей):**

```bash
# В отдельных терминалах (нужен Redis):
celery -A config worker -l info
celery -A config beat -l info
```

#### Frontend

```bash
cd bull-or-bear-frontend
npm install
npm run dev
# Приложение откроется на http://localhost:5173
```

### Вариант 2 — Docker Compose (production-like)

```bash
# В корне проекта
cp .env.docker .env
# Отредактируй .env под своё окружение

docker compose up --build -d
```

Сервисы:
- **django** — Django + Daphne (ASGI)
- **celery** — Celery worker
- **celery-beat** — Celery beat (периодические задачи)
- **postgres** — PostgreSQL 15
- **redis** — Redis 7
- **frontend** — React (собирается Vite, раздаётся Nginx)
- **nginx** — реверс-прокси (API, WebSocket, статика)

---

## Переменные окружения

Создайте `.env` в папке `bull-or-bear-backend/` (для ручного запуска) или в корне (для Docker):

```env
SECRET_KEY=your-secret-key-here
DEBUG=False

# PostgreSQL
DATABASE_URL=postgres://user:password@localhost:5432/bull_or_bear

# Redis
REDIS_URL=redis://localhost:6379/0

# Binance
BINANCE_BASE_URL=https://api.binance.com

# CORS / Hosts (для production)
ALLOWED_HOSTS=kurs-kripto.ru,www.kurs-kripto.ru
CORS_ALLOWED_ORIGINS=https://kurs-kripto.ru
```

> При `DEBUG=True` приложение работает на SQLite и InMemory channel layer (Redis не обязателен).
> При `DEBUG=False` требуются PostgreSQL и Redis.

---

## JWT — конфигурация

| Параметр | Значение |
|----------|---------|
| Access token lifetime | 60 минут |
| Refresh token lifetime | 7 дней |
| Header | `Authorization: Bearer <token>` |
| Хранение на клиенте | `localStorage` |
