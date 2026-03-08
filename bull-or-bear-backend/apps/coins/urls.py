from django.urls import path

from .views import DailyBonusView, QuestsView

urlpatterns = [
    path('daily/', DailyBonusView.as_view(), name='coins-daily'),
    path('quests/', QuestsView.as_view(), name='coins-quests'),
]
