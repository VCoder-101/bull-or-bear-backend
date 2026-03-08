from django.core.cache import cache
from django.db.models import Count, Q
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.users.models import UserProfile
from apps.bets.models import Bet

CACHE_KEY = 'leaderboard_top50'
CACHE_TTL = 300  # 5 минут


class LeaderboardView(APIView):
    """GET /api/v1/leaderboard/ — топ пользователей по балансу коинов."""
    permission_classes = [AllowAny]

    def get(self, request):
        data = cache.get(CACHE_KEY)
        if data is None:
            data = self._build()
            cache.set(CACHE_KEY, data, CACHE_TTL)
        return Response(data)

    @staticmethod
    def _build():
        profiles = (
            UserProfile.objects
            .select_related('user')
            .annotate(
                total_bets=Count(
                    'user__bets',
                    filter=~Q(user__bets__status=Bet.STATUS_ACTIVE),
                ),
                won_bets=Count(
                    'user__bets',
                    filter=Q(user__bets__status=Bet.STATUS_WON),
                ),
            )
            .order_by('-coins')[:50]
        )

        result = []
        for rank, profile in enumerate(profiles, 1):
            win_rate = (
                round(profile.won_bets / profile.total_bets * 100, 1)
                if profile.total_bets > 0 else 0.0
            )
            result.append({
                'rank': rank,
                'username': profile.user.username,
                'coins': profile.coins,
                'total_bets': profile.total_bets,
                'win_rate': win_rate,
            })
        return result
