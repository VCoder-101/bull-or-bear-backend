from django.contrib.auth import get_user_model
from rest_framework import serializers

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ['username', 'email', 'password']

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError('Email already registered.')
        return value

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)


class VerifySerializer(serializers.Serializer):
    email = serializers.EmailField()
    code = serializers.CharField(max_length=10)


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)


class ProfileSerializer(serializers.ModelSerializer):
    coins = serializers.IntegerField(source='profile.coins', read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'is_verified', 'coins', 'date_joined']
        read_only_fields = ['id', 'username', 'email', 'is_verified', 'coins', 'date_joined']
