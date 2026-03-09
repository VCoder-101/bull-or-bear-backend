"""
Management command: создаёт 50 реалистичных пользователей, симулирует ставки и заполняет лидерборд.
Запуск: python manage.py seed_users
"""
import random
from datetime import date, timedelta

from django.core.cache import cache
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from apps.bets.models import Bet
from apps.coins.services import QuestService
from apps.users.models import User, UserProfile

SYMBOLS = [
    'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT',
    'XRPUSDT', 'DOGEUSDT', 'ADAUSDT', 'AVAXUSDT',
]

DURATIONS = [5, 10, 60, 600, 3600]

# 50 реалистичных русских ников/имён
USERNAMES = [
    # Простые имена с суффиксами
    'sasha_bull', 'dimakrypto', 'maksimko', 'vanya_coin', 'artyom95',
    'nikitos', 'mishka_trader', 'andruha_bet', 'kirill_k', 'roma_bear',
    # Женские
    'katya_crypto', 'nastya_bet', 'vika_trade', 'masha_coin', 'yulia_k',
    # Крипто-тематика
    'crypto_pasha', 'bull_hunter', 'medved_pro', 'btc_kolya', 'eth_vova',
    # Игровые ники
    'dark_wolf_rus', 'night_fox13', 'sn1per_rus', 'phantom_den', 'shadow_grig',
    # Имена + цифры (популярный паттерн)
    'alexey_2001', 'pavel228', 'sergey_pro', 'ruslan_fx', 'timur_coin',
    # Прозвища
    'tolik_trader', 'zheka_bull', 'borya_bear', 'fedya_bets', 'styopa_fx',
    # Ещё ники
    'crypto_stepan', 'lyosha_trade', 'vitya_moon', 'kolya_lambo', 'petya_rekt',
    # Смешанные
    'ivan_hodl', 'oleg_pump', 'anton_dump', 'vlad_bull', 'dan_crypto',
    # Последние 5
    'arkasha_fx', 'grisha_moon', 'kostya_bet', 'senya_coin', 'zhenya_trade',
]


def _simulate_price(base: float, direction: str, won: bool) -> float:
    """Генерирует цену закрытия в нужном направлении."""
    change = random.uniform(0.001, 0.05)
    if won:
        return base * (1 + change) if direction == 'bull' else base * (1 - change)
    else:
        return base * (1 - change) if direction == 'bull' else base * (1 + change)


BASE_PRICES = {
    'BTCUSDT': 65000.0,
    'ETHUSDT': 3200.0,
    'BNBUSDT': 580.0,
    'SOLUSDT': 170.0,
    'XRPUSDT': 0.62,
    'DOGEUSDT': 0.18,
    'ADAUSDT': 0.45,
    'AVAXUSDT': 38.0,
}


class Command(BaseCommand):
    help = 'Создаёт 50 тестовых пользователей и симулирует ставки для лидерборда'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Удалить существующих сид-пользователей перед созданием',
        )

    def handle(self, *args, **options):
        if options['clear']:
            deleted, _ = User.objects.filter(username__in=USERNAMES).delete()
            self.stdout.write(f'Удалено {deleted} пользователей')

        QuestService.ensure_quests_exist()
        self.stdout.write('Создаю пользователей...')

        created_users = []
        with transaction.atomic():
            for username in USERNAMES:
                if User.objects.filter(username=username).exists():
                    user = User.objects.get(username=username)
                    self.stdout.write(f'  уже существует: {username}')
                else:
                    user = User.objects.create_user(
                        username=username,
                        email=f'{username}@example.com',
                        password='testpass123',
                        is_verified=True,
                    )
                    # Стартовый баланс — случайный (кто-то богаче, кто-то нет)
                    coins = random.randint(500, 5000)
                    UserProfile.objects.filter(user=user).update(coins=coins)
                    self.stdout.write(f'  создан: {username} ({coins} coins)')

                created_users.append(user)

        self.stdout.write(f'\nГенерирую ставки для {len(created_users)} пользователей...')

        total_bets = 0
        with transaction.atomic():
            for user in created_users:
                profile = user.profile
                # Каждый делает от 5 до 30 ставок
                num_bets = random.randint(5, 30)

                for _ in range(num_bets):
                    if profile.coins < 10:
                        # Пополняем если совсем нет коинов
                        profile.coins = 500
                        profile.save(update_fields=['coins', 'updated_at'])

                    symbol = random.choice(SYMBOLS)
                    direction = random.choice(['bull', 'bear'])
                    amount = random.choice([10, 25, 50, 100, 200, 500])
                    amount = min(amount, profile.coins)
                    if amount < 10:
                        continue

                    duration = random.choice(DURATIONS)
                    open_price = BASE_PRICES[symbol] * random.uniform(0.95, 1.05)

                    # Симулируем результат: 45% победа, 45% проигрыш, 10% ничья
                    outcome = random.choices(
                        ['won', 'lost', 'draw'],
                        weights=[45, 45, 10]
                    )[0]

                    close_price = _simulate_price(open_price, direction, outcome == 'won')
                    if outcome == 'draw':
                        close_price = open_price

                    # Списываем ставку
                    profile.coins -= amount
                    profile.save(update_fields=['coins', 'updated_at'])

                    # Создаём уже разрешённую ставку
                    resolved_at = timezone.now() - timedelta(
                        minutes=random.randint(10, 10000)
                    )
                    bet = Bet.objects.create(
                        user=user,
                        symbol=symbol,
                        direction=direction,
                        amount=amount,
                        duration=duration,
                        status=outcome,
                        open_price=open_price,
                        close_price=close_price,
                        resolved_at=resolved_at,
                    )

                    # Начисляем выигрыш
                    if outcome == 'won':
                        profile.coins += int(amount * 1.9)
                    elif outcome == 'draw':
                        profile.coins += amount
                    profile.save(update_fields=['coins', 'updated_at'])

                    total_bets += 1

        self.stdout.write(f'Создано {total_bets} ставок')

        # Сбрасываем кэш лидерборда
        cache.delete('leaderboard_top50')
        self.stdout.write('Кэш лидерборда сброшен')

        # Итоговый топ-10
        self.stdout.write('\n=== ТОП-10 ЛИДЕРБОРД ===')
        top = (
            UserProfile.objects
            .select_related('user')
            .filter(user__username__in=USERNAMES)
            .order_by('-coins')[:10]
        )
        for i, p in enumerate(top, 1):
            bets_count = Bet.objects.filter(
                user=p.user, status__in=['won', 'lost', 'draw']
            ).count()
            won_count = Bet.objects.filter(user=p.user, status='won').count()
            winrate = round(won_count / bets_count * 100, 1) if bets_count else 0
            self.stdout.write(
                f'  {i:2}. {p.user.username:<20} {p.coins:>6} coins  '
                f'{bets_count} ставок  {winrate}% побед'
            )

        self.stdout.write(self.style.SUCCESS('\nГотово!'))
