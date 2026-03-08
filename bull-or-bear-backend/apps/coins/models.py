from django.conf import settings
from django.db import models


class Quest(models.Model):
    TYPE_FIRST_BET_DAY = 'first_bet_day'
    TYPE_BETS_DAY_5 = 'bets_day_5'
    TYPE_WINS_STREAK_3 = 'wins_streak_3'
    TYPE_CHOICES = [
        (TYPE_FIRST_BET_DAY, 'Первая ставка дня'),
        (TYPE_BETS_DAY_5, '5 ставок за день'),
        (TYPE_WINS_STREAK_3, '3 победы подряд'),
    ]

    title = models.CharField(max_length=100)
    description = models.TextField()
    reward = models.IntegerField()
    quest_type = models.CharField(max_length=30, choices=TYPE_CHOICES, unique=True)
    target_value = models.IntegerField(default=1)
    is_daily = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.title} (+{self.reward})"


class UserQuest(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='quests',
    )
    quest = models.ForeignKey(Quest, on_delete=models.CASCADE, related_name='user_quests')
    progress = models.IntegerField(default=0)
    is_completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)
    last_progress_date = models.DateField(null=True, blank=True)

    class Meta:
        unique_together = ('user', 'quest')

    def __str__(self):
        return f"{self.user.username} — {self.quest.title} ({self.progress}/{self.quest.target_value})"
