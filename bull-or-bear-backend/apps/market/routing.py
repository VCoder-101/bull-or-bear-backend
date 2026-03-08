from django.urls import path

from .consumers import MarketConsumer

websocket_urlpatterns = [
    path('ws/market/<str:symbol>/', MarketConsumer.as_asgi()),
]
