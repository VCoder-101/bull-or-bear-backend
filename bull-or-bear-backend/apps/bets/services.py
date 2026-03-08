import logging

from django.conf import settings
from django.utils import timezone

from apps.market.services import BinanceService
from .models import Bet

logger = logging.getLogger(__name__)

MIN_BET = 10


class BetService:

    @staticmethod
    def create_bet(user, symbol: str, direction: str, amount: int, duration: int) -> Bet:
        """
        Создать ставку: проверить баланс, списать коины, запустить таймер.
        Raises ValueError при невалидных данных.
        """
        if symbol not in settings.TRACKED_SYMBOLS:
            raise ValueError(f"Символ {symbol} не поддерживается")

        if direction not in (Bet.DIRECTION_BULL, Bet.DIRECTION_BEAR):
            raise ValueError("Направление должно быть 'bull' или 'bear'")

        valid_durations = [d for d, _ in Bet.DURATION_CHOICES]
        if duration not in valid_durations:
            raise ValueError(f"Таймер должен быть одним из: {valid_durations}")

        if amount < MIN_BET:
            raise ValueError(f"Минимальная ставка {MIN_BET} коинов")

        profile = user.profile
        if profile.coins < amount:
            raise ValueError("Недостаточно коинов")

        open_price = BinanceService.get_current_price(symbol)
        if open_price is None:
            raise ValueError("Не удалось получить текущую цену")

        # Списываем коины до создания ставки
        profile.coins -= amount
        profile.save(update_fields=['coins', 'updated_at'])

        bet = Bet.objects.create(
            user=user,
            symbol=symbol,
            direction=direction,
            amount=amount,
            duration=duration,
            open_price=open_price,
        )

        # Запускаем Celery-задачу с задержкой равной длительности ставки
        from .tasks import resolve_bet_task
        try:
            resolve_bet_task.apply_async(args=[bet.id], countdown=duration)
        except Exception as e:
            logger.warning(f"Celery недоступен, ставка {bet.id} не будет разрешена автоматически: {e}")

        # Обновляем прогресс квестов
        from apps.coins.services import QuestService
        QuestService.on_bet_placed(user)

        logger.info(f"Ставка создана: {bet}")
        return bet

    @staticmethod
    def resolve_expired_for_user(user) -> int:
        """
        Разрешить все истёкшие активные ставки пользователя.
        Вызывается с фронтенда когда таймер дошёл до нуля (fallback без Celery).
        Возвращает количество разрешённых ставок.
        """
        from datetime import timedelta
        now = timezone.now()
        active_bets = Bet.objects.filter(user=user, status=Bet.STATUS_ACTIVE)
        resolved = 0
        for bet in active_bets:
            if now >= bet.created_at + timedelta(seconds=bet.duration):
                BetService.resolve_bet(bet.id)
                resolved += 1
        return resolved

    @staticmethod
    def resolve_bet(bet_id: int) -> None:
        """Разрешить ставку по истечении таймера."""
        try:
            bet = Bet.objects.select_related('user__profile').get(
                id=bet_id, status=Bet.STATUS_ACTIVE
            )
        except Bet.DoesNotExist:
            logger.warning(f"Ставка {bet_id} не найдена или уже разрешена")
            return

        close_price = BinanceService.get_current_price(bet.symbol)
        if close_price is None:
            logger.error(f"Не удалось получить цену для ставки {bet_id}")
            return

        open_price = float(bet.open_price)
        profile = bet.user.profile

        if close_price == open_price:
            status = Bet.STATUS_DRAW
            profile.coins += bet.amount
        elif bet.direction == Bet.DIRECTION_BULL:
            status = Bet.STATUS_WON if close_price > open_price else Bet.STATUS_LOST
        else:
            status = Bet.STATUS_WON if close_price < open_price else Bet.STATUS_LOST

        if status == Bet.STATUS_WON:
            profile.coins += int(bet.amount * 1.9)

        bet.status = status
        bet.close_price = close_price
        bet.resolved_at = timezone.now()
        bet.save(update_fields=['status', 'close_price', 'resolved_at', 'updated_at'])
        profile.save(update_fields=['coins', 'updated_at'])

        # Обновляем квесты на победы/серию
        from apps.coins.services import QuestService
        if status == Bet.STATUS_WON:
            QuestService.on_bet_won(bet.user)
        else:
            QuestService.on_bet_lost_or_draw(bet.user)

        logger.info(f"Ставка {bet_id} разрешена: {status}, close={close_price}")
