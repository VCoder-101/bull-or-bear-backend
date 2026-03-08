from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from django.conf import settings

from .models import Candle
from .serializers import CandleSerializer
from .services import BinanceService


class SymbolsView(APIView):
    """GET /api/v1/market/symbols/ — список отслеживаемых символов."""
    permission_classes = [AllowAny]

    def get(self, request):
        return Response({'symbols': settings.TRACKED_SYMBOLS})


class CandlesView(APIView):
    """GET /api/v1/market/candles/?symbol=BTCUSDT&interval=1m&limit=100"""
    permission_classes = [AllowAny]

    def get(self, request):
        symbol = request.query_params.get('symbol', 'BTCUSDT').upper()
        interval = request.query_params.get('interval', '1m')
        limit = min(int(request.query_params.get('limit', 100)), 500)

        if symbol not in settings.TRACKED_SYMBOLS:
            return Response({'error': f'Symbol {symbol} not supported'}, status=400)

        candles = Candle.objects.filter(
            symbol=symbol, interval=interval
        ).order_by('-open_time')[:limit]

        # Если свечей нет в БД — загружаем напрямую с Binance
        if not candles.exists():
            BinanceService.sync_candles(symbol, interval, limit)
            candles = Candle.objects.filter(
                symbol=symbol, interval=interval
            ).order_by('-open_time')[:limit]

        # Возвращаем в порядке возрастания времени (для графика)
        candles = list(reversed(list(candles)))
        serializer = CandleSerializer(candles, many=True)
        return Response({'symbol': symbol, 'interval': interval, 'candles': serializer.data})
