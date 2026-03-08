from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken

from .models import VerificationCode

User = get_user_model()

# Hardcoded for Phase 1 — will be replaced with random code + email delivery later
VERIFICATION_CODE = '4444'


class AuthService:

    @staticmethod
    def register(username: str, email: str, password: str) -> User:
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            is_verified=False,
        )
        VerificationCode.objects.create(user=user, code=VERIFICATION_CODE)
        return user

    @staticmethod
    def verify(email: str, code: str) -> User:
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise ValueError('User with this email not found.')

        if user.is_verified:
            raise ValueError('Account already verified.')

        if not VerificationCode.objects.filter(user=user, code=code).exists():
            raise ValueError('Invalid verification code.')

        user.is_verified = True
        user.save(update_fields=['is_verified'])
        VerificationCode.objects.filter(user=user).delete()
        return user

    @staticmethod
    def get_tokens_for_user(user) -> dict:
        refresh = RefreshToken.for_user(user)
        return {
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        }
