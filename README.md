# Bull or Bear 🐂🐻

Веб-приложение для торговли криптовалютой на игровые коины. Пользователи видят графики в реальном времени и делают ставки на рост (Bull 📈) или падение (Bear 📉). Никаких реальных денег — только игровая механика.

---

## Стек технологий

| Слой | Технология |
|------|-----------|
| Backend | Python 3.11+, Django 5.x, Django REST Framework |
| Frontend | React 18, Vite 7, JavaScript |
| База данных | PostgreSQL 15+ (SQLite для разработки) |
| Очереди | Celery + Redis |
| WebSocket | Django Channels + Redis |
| Внешний API | Binance REST + WebSocket (публичный) |
| Аутентификация | JWT (djangorestframework-simplejwt) |
| Графики | lightweight-charts (TradingView) |

---

## Структура проекта

```
bull-or-bear/
├── bull-or-bear-backend/          # Django-проект
│   ├── config/                    # settings.py, urls.py, asgi.py, celery.py
│   ├── apps/
│   │   ├── users/                 # Кастомный User, JWT авторизация, верификация
│   │   ├── coins/                 # Игровые коины, ежедневный бонус
│   │   ├── bets/                  # Ставки Bull/Bear, расчёт результатов
│   │   ├── market/                # Данные Binance, свечи, WebSocket потребитель
│   │   └── leaderboard/           # Рейтинг пользователей
│   ├── requirements.txt
│   └── manage.py
└── bull-or-bear-frontend/         # React-приложение
    ├── src/
    │   ├── pages/                 # Home, Trade, ActiveBets, Rewards, Quests, Leaderboard, Profile, Auth
    │   ├── components/            # Layout, PriceChart, BetPanel, CoinBalance, Timer
    │   ├── api/                   # axios-клиент с JWT interceptor
    │   ├── context/               # AuthContext
    │   ├── hooks/                 # useMarketWebSocket
    │   └── constants/             # coins.js (список криптовалют)
    └── package.json
```

---

## Функциональность

### Аутентификация
- Регистрация: логин + email + пароль
- Верификация аккаунта по коду из письма
- JWT токены (access + refresh), хранение в localStorage

### Игровые коины
- **1 000 коинов** при регистрации
- **+50 коинов** за ежедневный вход
- Бонусы за выполнение квестов

### Ставки
- Выбор криптовалюты, направления (Bull/Bear), суммы и таймера
- Таймеры: **5 / 15 / 60 минут**
- Победа: ставка × 1.9 (комиссия 10%)
- Проигрыш: потеря ставки
- Ничья (цена не изменилась): возврат ставки
- Минимальная ставка: **10 коинов**

### Рынок
- 8 криптовалют: BTC, ETH, BNB, SOL, XRP, DOGE, ADA, AVAX
- Свечные графики с таймфреймами: 1м / 15м / 1ч / 1д
- Цены в реальном времени через WebSocket (Binance)

### Лидерборд
- Топ игроков по балансу коинов
- Подиум топ-3 с медалями
- История своих ставок с фильтрами

---

## Запуск (разработка)

### Backend

```bash
cd bull-or-bear-backend

# Создать и активировать виртуальное окружение
python -m venv venv
source venv/bin/activate          # Linux/Mac
venv\Scripts\activate             # Windows

# Установить зависимости
pip install -r requirements.txt

# Применить миграции
python manage.py migrate

# Запустить сервер
python manage.py runserver
```

**Celery (для обработки ставок):**
```bash
celery -A config worker -l info
celery -A config beat -l info
```

### Frontend

```bash
cd bull-or-bear-frontend
npm install
npm run dev
```

Приложение откроется на `http://localhost:5173`.
Backend API доступен на `http://localhost:8000/api/v1/`.

---

## Переменные окружения

Создайте файл `.env` в папке `bull-or-bear-backend/`:

```env
SECRET_KEY=your-secret-key-here
DEBUG=True
DATABASE_URL=postgres://user:pass@localhost:5432/bull_or_bear
REDIS_URL=redis://localhost:6379/0
BINANCE_BASE_URL=https://api.binance.com
```

> Без Redis и PostgreSQL приложение работает в упрощённом режиме (SQLite + InMemory channel layer).

---

## API Endpoints

| Метод | URL | Описание |
|-------|-----|----------|
| POST | `/api/v1/auth/register/` | Регистрация |
| POST | `/api/v1/auth/verify/` | Верификация кода |
| POST | `/api/v1/auth/login/` | Вход (получение JWT) |
| POST | `/api/v1/auth/token/refresh/` | Обновление токена |
| GET | `/api/v1/market/candles/` | Свечи (`?symbol=BTCUSDT&interval=1m&limit=200`) |
| GET | `/api/v1/bets/` | Список ставок пользователя |
| POST | `/api/v1/bets/` | Создать ставку |
| GET | `/api/v1/bets/history/` | История ставок |
| GET | `/api/v1/leaderboard/` | Рейтинг игроков |
| GET | `/api/v1/coins/balance/` | Баланс коинов |
| POST | `/api/v1/coins/daily-bonus/` | Ежедневный бонус |
| WS | `ws://localhost:8000/ws/market/{symbol}/` | Реалтайм цены |
