from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import LoginView, ProfileView, RegisterView, VerifyView

urlpatterns = [
    path('register/', RegisterView.as_view()),
    path('verify/', VerifyView.as_view()),
    path('login/', LoginView.as_view()),
    path('token/refresh/', TokenRefreshView.as_view()),
    path('profile/', ProfileView.as_view()),
]
