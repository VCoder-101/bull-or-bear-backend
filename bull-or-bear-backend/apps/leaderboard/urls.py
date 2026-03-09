from django.urls import path

from .views import LeaderboardView, MyRankView

urlpatterns = [
    path('',         LeaderboardView.as_view(), name='leaderboard'),
    path('my-rank/', MyRankView.as_view(),       name='leaderboard-my-rank'),
]
