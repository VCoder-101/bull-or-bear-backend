import logging

from celery import shared_task

logger = logging.getLogger(__name__)


@shared_task(name='bets.resolve_bet')
def resolve_bet_task(bet_id: int) -> None:
    """Разрешить ставку после истечения таймера."""
    from .services import BetService
    BetService.resolve_bet(bet_id)
