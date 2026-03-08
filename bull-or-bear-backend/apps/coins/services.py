import logging
from datetime import date, datetime, time as time_type, timezone as py_tz

from django.utils import timezone

from .models import Quest, UserQuest

logger = logging.getLogger(__name__)

DAILY_BONUS_AMOUNT = 50


class DailyBonusService:

    @staticmethod
    def claim(user) -> dict:
        """
        Выдать ежедневный бонус.
        Возвращает {'awarded': True, 'amount': 50} или {'awarded': False, 'next_in_seconds': N}.
        """
        profile = user.profile
        today = date.today()

        if profile.last_daily_bonus == today:
            # Считаем сколько секунд до следующего бонуса (до полуночи UTC)
            now = timezone.now()
            midnight = datetime.combine(now.date(), time_type.max, tzinfo=py_tz.utc)
            next_in = int((midnight - now).total_seconds()) + 1
            return {'awarded': False, 'next_in_seconds': next_in}

        profile.coins += DAILY_BONUS_AMOUNT
        profile.last_daily_bonus = today
        profile.save(update_fields=['coins', 'last_daily_bonus', 'updated_at'])
        logger.info(f"Daily bonus awarded to {user.username}: +{DAILY_BONUS_AMOUNT}")
        return {'awarded': True, 'amount': DAILY_BONUS_AMOUNT, 'balance': profile.coins}


class QuestService:
    # Определения квестов: (quest_type, title, description, reward, target_value, is_daily)
    QUEST_DEFINITIONS = [
        (Quest.TYPE_FIRST_BET_DAY, 'Первая ставка дня', 'Сделай первую ставку за день', 20, 1, True),
        (Quest.TYPE_BETS_DAY_5, '5 ставок за день', 'Сделай 5 ставок за день', 100, 5, True),
        (Quest.TYPE_WINS_STREAK_3, '3 победы подряд', 'Выиграй 3 ставки подряд', 200, 3, False),
    ]

    @classmethod
    def ensure_quests_exist(cls):
        """Создать квесты если их нет (вызывается при старте или первом запросе)."""
        for quest_type, title, description, reward, target, is_daily in cls.QUEST_DEFINITIONS:
            Quest.objects.get_or_create(
                quest_type=quest_type,
                defaults={
                    'title': title,
                    'description': description,
                    'reward': reward,
                    'target_value': target,
                    'is_daily': is_daily,
                },
            )

    @classmethod
    def get_or_create_user_quest(cls, user, quest) -> UserQuest:
        uq, _ = UserQuest.objects.get_or_create(user=user, quest=quest)
        return uq

    @classmethod
    def _reset_if_needed(cls, uq: UserQuest) -> UserQuest:
        """Сбросить прогресс дневного квеста если наступил новый день."""
        if not uq.quest.is_daily:
            return uq
        today = date.today()
        if uq.last_progress_date and uq.last_progress_date < today:
            uq.progress = 0
            uq.is_completed = False
            uq.completed_at = None
            uq.last_progress_date = today
            uq.save(update_fields=['progress', 'is_completed', 'completed_at', 'last_progress_date'])
        return uq

    @classmethod
    def _award_if_complete(cls, uq: UserQuest) -> bool:
        """Наградить пользователя если квест выполнен. Возвращает True если награда выдана."""
        if uq.is_completed:
            return False
        if uq.progress >= uq.quest.target_value:
            uq.is_completed = True
            uq.completed_at = timezone.now()
            uq.save(update_fields=['is_completed', 'completed_at'])
            profile = uq.user.profile
            profile.coins += uq.quest.reward
            profile.save(update_fields=['coins', 'updated_at'])
            logger.info(f"Quest complete: {uq.user.username} — {uq.quest.title} +{uq.quest.reward}")
            return True
        return False

    @classmethod
    def on_bet_placed(cls, user) -> None:
        """Вызывается при создании любой ставки."""
        cls.ensure_quests_exist()
        today = date.today()

        for quest_type in (Quest.TYPE_FIRST_BET_DAY, Quest.TYPE_BETS_DAY_5):
            try:
                quest = Quest.objects.get(quest_type=quest_type)
                uq = cls.get_or_create_user_quest(user, quest)
                uq = cls._reset_if_needed(uq)
                if not uq.is_completed:
                    uq.progress += 1
                    uq.last_progress_date = today
                    uq.save(update_fields=['progress', 'last_progress_date'])
                    cls._award_if_complete(uq)
            except Quest.DoesNotExist:
                pass

    @classmethod
    def on_bet_won(cls, user) -> None:
        """Вызывается при победе в ставке."""
        cls.ensure_quests_exist()
        try:
            quest = Quest.objects.get(quest_type=Quest.TYPE_WINS_STREAK_3)
            uq = cls.get_or_create_user_quest(user, quest)
            if not uq.is_completed:
                uq.progress += 1
                uq.save(update_fields=['progress'])
                cls._award_if_complete(uq)
        except Quest.DoesNotExist:
            pass

    @classmethod
    def on_bet_lost_or_draw(cls, user) -> None:
        """Вызывается при проигрыше/ничье — сбрасываем серию побед."""
        cls.ensure_quests_exist()
        try:
            quest = Quest.objects.get(quest_type=Quest.TYPE_WINS_STREAK_3)
            UserQuest.objects.filter(user=user, quest=quest, is_completed=False).update(progress=0)
        except Quest.DoesNotExist:
            pass

    @classmethod
    def get_user_quests(cls, user) -> list:
        """Вернуть все квесты с прогрессом пользователя."""
        cls.ensure_quests_exist()
        quests = Quest.objects.all()
        result = []
        for quest in quests:
            uq = cls.get_or_create_user_quest(user, quest)
            uq = cls._reset_if_needed(uq)
            result.append({
                'id': quest.id,
                'quest_type': quest.quest_type,
                'title': quest.title,
                'description': quest.description,
                'reward': quest.reward,
                'target_value': quest.target_value,
                'is_daily': quest.is_daily,
                'progress': uq.progress,
                'is_completed': uq.is_completed,
            })
        return result
