from django.urls import path

from .views import CandlesView, SymbolsView

urlpatterns = [
    path('symbols/', SymbolsView.as_view(), name='market-symbols'),
    path('candles/', CandlesView.as_view(), name='market-candles'),
]
