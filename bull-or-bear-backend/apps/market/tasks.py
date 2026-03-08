import logging

from celery import shared_task
from django.conf import settings

from .services import BinanceService

logger = logging.getLogger(__name__)


@shared_task(name='market.update_candles')
def update_candles():
    """Периодически обновлять свечи для всех отслеживаемых символов."""
    for symbol in settings.TRACKED_SYMBOLS:
        try:
            BinanceService.sync_candles(symbol, interval='1m', limit=100)
        except Exception as e:
            logger.error(f"Ошибка обновления свечей {symbol}: {e}")
    logger.info("Обновление свечей завершено")
