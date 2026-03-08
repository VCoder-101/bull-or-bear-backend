from django.contrib.auth import authenticate
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import LoginSerializer, ProfileSerializer, RegisterSerializer, VerifySerializer
from .services import AuthService


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        AuthService.register(**serializer.validated_data)
        return Response(
            {'detail': 'Registration successful. Use code 4444 to verify your account.'},
            status=status.HTTP_201_CREATED,
        )


class VerifyView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = VerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            AuthService.verify(
                email=serializer.validated_data['email'],
                code=serializer.validated_data['code'],
            )
        except ValueError as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response({'detail': 'Account verified successfully.'})


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = authenticate(
            request,
            username=serializer.validated_data['username'],
            password=serializer.validated_data['password'],
        )
        if not user:
            return Response(
                {'detail': 'Invalid credentials.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        if not user.is_verified:
            return Response(
                {'detail': 'Account not verified. Please verify your email first.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        tokens = AuthService.get_tokens_for_user(user)
        return Response(tokens)


class ProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = ProfileSerializer(request.user)
        return Response(serializer.data)
