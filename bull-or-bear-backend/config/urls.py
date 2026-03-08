from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/', include([
        path('auth/', include('apps.users.urls')),
        path('market/', include('apps.market.urls')),
        path('bets/', include('apps.bets.urls')),
        path('coins/', include('apps.coins.urls')),
        path('leaderboard/', include('apps.leaderboard.urls')),
    ])),
]
