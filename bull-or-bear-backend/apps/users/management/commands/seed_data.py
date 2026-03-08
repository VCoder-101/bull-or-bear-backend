"""
Management-команда для заполнения БД тестовыми данными.
Использование: python manage.py seed_data
"""
import random
from datetime import timedelta

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.bets.models import Bet
from apps.users.models import UserProfile

User = get_user_model()

SYMBOLS = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT']

# (username, начальный баланс коинов)
USERS = [
    ('user1',  5200),
    ('user2',  3800),
    ('user3',  3100),
    ('user4',  2500),
    ('user5',  2000),
    ('user6',  1600),
    ('user7',  1200),
    ('user8',   850),
    ('user9',   550),
    ('user10',  310),
]


class Command(BaseCommand):
    help = 'Создаёт 10 тестовых пользователей с историей ставок'

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.MIGRATE_HEADING('Seeding test data...'))
        created_count = 0

        for username, coins in USERS:
            user, created = User.objects.get_or_create(
                username=username,
                defaults={
                    'email': f'{username}@example.com',
                    'is_verified': True,
                },
            )
            if created:
                user.set_password('test1234')
                user.save()

            # Обновляем профиль
            profile, _ = UserProfile.objects.get_or_create(user=user)
            profile.coins = coins
            profile.save(update_fields=['coins', 'updated_at'])

            # Создаём историю ставок (15–25 штук)
            Bet.objects.filter(user=user).delete()
            num_bets = random.randint(15, 25)
            for i in range(num_bets):
                status = random.choices(
                    ['won', 'lost', 'draw'],
                    weights=[40, 50, 10],
                )[0]
                symbol = random.choice(SYMBOLS)
                direction = random.choice(['bull', 'bear'])
                amount = random.choice([50, 100, 200, 500])
                open_price = round(random.uniform(100, 70000), 2)
                close_delta = open_price * random.uniform(-0.03, 0.03)
                if status == 'won':
                    close_price = open_price + (close_delta if direction == 'bull' else -close_delta)
                elif status == 'lost':
                    close_price = open_price + (-close_delta if direction == 'bull' else close_delta)
                else:
                    close_price = open_price

                created_at = timezone.now() - timedelta(hours=random.randint(1, 720))
                Bet.objects.create(
                    user=user,
                    symbol=symbol,
                    direction=direction,
                    amount=amount,
                    duration=random.choice([5, 15, 60]),
                    status=status,
                    open_price=round(open_price, 8),
                    close_price=round(abs(close_price), 8),
                    created_at=created_at,
                    resolved_at=created_at + timedelta(minutes=random.choice([5, 15, 60])),
                )

            action = 'created' if created else 'updated'
            total_bets = Bet.objects.filter(user=user).count()
            won = Bet.objects.filter(user=user, status='won').count()
            self.stdout.write(
                self.style.SUCCESS(f"  [OK] {username} ({action}) | {coins} coins | {total_bets} bets | {won} won")
            )
            created_count += 1

        self.stdout.write(self.style.SUCCESS(f'\nDone! Users processed: {created_count}'))
        self.stdout.write('Password for all: test1234')
