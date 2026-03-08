import asyncio
import json
import logging

import websockets
from channels.generic.websocket import AsyncWebsocketConsumer

logger = logging.getLogger(__name__)

BINANCE_WS_URL = "wss://stream.binance.com/ws"


class MarketConsumer(AsyncWebsocketConsumer):
    """
    WebSocket-потребитель: подключается к Binance stream и транслирует
    обновления цены клиенту в реальном времени.
    Роут: ws/market/<symbol>/
    """

    async def connect(self):
        self.symbol = self.scope['url_route']['kwargs']['symbol'].upper()
        await self.accept()
        self.binance_task = asyncio.create_task(self._stream_binance())
        logger.info(f"Client connected to market stream: {self.symbol}")

    async def disconnect(self, close_code):
        if hasattr(self, 'binance_task'):
            self.binance_task.cancel()
        logger.info(f"Client disconnected from market stream: {self.symbol}")

    async def _stream_binance(self):
        """Подключиться к Binance WebSocket и пересылать свечи клиенту."""
        stream = f"{self.symbol.lower()}@kline_1m"
        url = f"{BINANCE_WS_URL}/{stream}"

        while True:
            try:
                async with websockets.connect(url) as ws:
                    logger.info(f"Connected to Binance stream: {stream}")
                    async for raw in ws:
                        data = json.loads(raw)
                        kline = data.get('k', {})
                        await self.send(json.dumps({
                            'symbol': kline.get('s'),
                            'time': kline.get('t', 0) // 1000,  # Unix seconds
                            'open': kline.get('o'),
                            'high': kline.get('h'),
                            'low': kline.get('l'),
                            'close': kline.get('c'),
                            'volume': kline.get('v'),
                            'is_closed': kline.get('x', False),
                        }))
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.warning(f"Binance stream error for {self.symbol}: {e}. Reconnecting in 3s...")
                await asyncio.sleep(3)
