import logging
from datetime import datetime, timezone

import requests
from django.conf import settings

from .models import Candle

logger = logging.getLogger(__name__)


class BinanceService:
    BASE_URL = settings.BINANCE_BASE_URL

    @classmethod
    def get_candles(cls, symbol: str, interval: str = '1m', limit: int = 100) -> list:
        """Получить исторические свечи с Binance REST API."""
        url = f"{cls.BASE_URL}/api/v3/klines"
        params = {'symbol': symbol, 'interval': interval, 'limit': limit}

        try:
            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()
            return response.json()
        except requests.RequestException as e:
            logger.error(f"Binance API error for {symbol}: {e}")
            return []

    @classmethod
    def get_current_price(cls, symbol: str) -> float | None:
        """Получить текущую цену символа."""
        url = f"{cls.BASE_URL}/api/v3/ticker/price"
        try:
            response = requests.get(url, params={'symbol': symbol}, timeout=10)
            response.raise_for_status()
            return float(response.json()['price'])
        except requests.RequestException as e:
            logger.error(f"Binance price error for {symbol}: {e}")
            return None

    @classmethod
    def sync_candles(cls, symbol: str, interval: str = '1m', limit: int = 100) -> int:
        """Загрузить свечи с Binance и сохранить/обновить в БД. Возвращает кол-во сохранённых."""
        raw = cls.get_candles(symbol, interval, limit)
        if not raw:
            return 0

        saved = 0
        for item in raw:
            open_time = datetime.fromtimestamp(item[0] / 1000, tz=timezone.utc)
            _, created = Candle.objects.update_or_create(
                symbol=symbol,
                interval=interval,
                open_time=open_time,
                defaults={
                    'open': item[1],
                    'high': item[2],
                    'low': item[3],
                    'close': item[4],
                    'volume': item[5],
                },
            )
            if created:
                saved += 1

        logger.info(f"Synced {symbol} {interval}: {saved} new candles out of {len(raw)}")
        return saved
