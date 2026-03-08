from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Bet
from .serializers import BetSerializer, CreateBetSerializer
from .services import BetService


class ResolveExpiredView(APIView):
    """POST /api/v1/bets/resolve-expired/ — разрешить истёкшие ставки (fallback без Celery)."""

    def post(self, request):
        resolved = BetService.resolve_expired_for_user(request.user)
        return Response({'resolved': resolved})


class CreateBetView(APIView):
    """POST /api/v1/bets/create/ — создать ставку."""

    def post(self, request):
        serializer = CreateBetSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            bet = BetService.create_bet(
                user=request.user,
                symbol=serializer.validated_data['symbol'].upper(),
                direction=serializer.validated_data['direction'],
                amount=serializer.validated_data['amount'],
                duration=serializer.validated_data['duration'],
            )
        except ValueError as e:
            return Response({'error': str(e)}, status=400)

        return Response(BetSerializer(bet).data, status=201)


class ActiveBetsView(APIView):
    """GET /api/v1/bets/active/ — активные ставки пользователя."""

    def get(self, request):
        bets = Bet.objects.filter(user=request.user, status=Bet.STATUS_ACTIVE)
        return Response(BetSerializer(bets, many=True).data)


class BetHistoryView(APIView):
    """GET /api/v1/bets/history/ — история завершённых ставок."""

    def get(self, request):
        bets = Bet.objects.filter(
            user=request.user,
            status__in=[Bet.STATUS_WON, Bet.STATUS_LOST, Bet.STATUS_DRAW],
        )[:50]
        return Response(BetSerializer(bets, many=True).data)
