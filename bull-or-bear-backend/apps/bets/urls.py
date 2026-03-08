from django.urls import path

from .views import ActiveBetsView, BetHistoryView, CreateBetView, ResolveExpiredView

urlpatterns = [
    path('create/', CreateBetView.as_view(), name='bets-create'),
    path('active/', ActiveBetsView.as_view(), name='bets-active'),
    path('history/', BetHistoryView.as_view(), name='bets-history'),
    path('resolve-expired/', ResolveExpiredView.as_view(), name='bets-resolve-expired'),
]
