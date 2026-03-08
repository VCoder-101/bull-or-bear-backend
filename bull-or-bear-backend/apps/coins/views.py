from rest_framework.response import Response
from rest_framework.views import APIView

from .services import DailyBonusService, QuestService


class DailyBonusView(APIView):
    """POST /api/v1/coins/daily/ — получить ежедневный бонус."""

    def post(self, request):
        result = DailyBonusService.claim(request.user)
        if result['awarded']:
            return Response(result, status=200)
        return Response(result, status=400)


class QuestsView(APIView):
    """GET /api/v1/coins/quests/ — список квестов с прогрессом."""

    def get(self, request):
        quests = QuestService.get_user_quests(request.user)
        return Response(quests)
