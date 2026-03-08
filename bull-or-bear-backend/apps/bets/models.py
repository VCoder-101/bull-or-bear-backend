from django.conf import settings
from django.db import models


class Bet(models.Model):
    DIRECTION_BULL = 'bull'
    DIRECTION_BEAR = 'bear'
    DIRECTION_CHOICES = [(DIRECTION_BULL, 'Bull'), (DIRECTION_BEAR, 'Bear')]

    # Длительность ставки в секундах
    DURATION_CHOICES = [
        (5,    '5 sec'),
        (10,   '10 sec'),
        (60,   '1 min'),
        (600,  '10 min'),
        (3600, '1 hour'),
    ]

    STATUS_ACTIVE = 'active'
    STATUS_WON = 'won'
    STATUS_LOST = 'lost'
    STATUS_DRAW = 'draw'
    STATUS_CHOICES = [
        (STATUS_ACTIVE, 'Active'),
        (STATUS_WON, 'Won'),
        (STATUS_LOST, 'Lost'),
        (STATUS_DRAW, 'Draw'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='bets',
    )
    symbol = models.CharField(max_length=20)
    direction = models.CharField(max_length=4, choices=DIRECTION_CHOICES)
    amount = models.IntegerField()
    duration = models.IntegerField(choices=DURATION_CHOICES)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default=STATUS_ACTIVE)
    open_price = models.DecimalField(max_digits=20, decimal_places=8)
    close_price = models.DecimalField(max_digits=20, decimal_places=8, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    resolved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} {self.direction} {self.symbol} x{self.amount} [{self.status}]"

    @property
    def payout(self):
        """Фактическая выплата (заполняется после разрешения ставки)."""
        if self.status == self.STATUS_WON:
            return int(self.amount * 1.9)
        if self.status == self.STATUS_DRAW:
            return self.amount
        return 0
