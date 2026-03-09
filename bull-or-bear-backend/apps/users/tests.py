"""
Тесты для аутентификации: регистрация, верификация, вход.
"""
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from apps.users.models import User, UserProfile, VerificationCode


class RegisterViewTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.url = '/api/v1/auth/register/'

    def test_успешная_регистрация(self):
        data = {'username': 'testuser', 'email': 'test@example.com', 'password': 'securepass123'}
        response = self.client.post(self.url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(username='testuser').exists())

    def test_создаётся_профиль_с_1000_коинов(self):
        data = {'username': 'testuser', 'email': 'test@example.com', 'password': 'securepass123'}
        self.client.post(self.url, data)
        user = User.objects.get(username='testuser')
        self.assertEqual(user.profile.coins, 1000)

    def test_создаётся_код_верификации_4444(self):
        data = {'username': 'testuser', 'email': 'test@example.com', 'password': 'securepass123'}
        self.client.post(self.url, data)
        user = User.objects.get(username='testuser')
        code = VerificationCode.objects.get(user=user)
        self.assertEqual(code.code, '4444')

    def test_пользователь_не_активен_после_регистрации(self):
        data = {'username': 'testuser', 'email': 'test@example.com', 'password': 'securepass123'}
        self.client.post(self.url, data)
        user = User.objects.get(username='testuser')
        self.assertFalse(user.is_verified)

    def test_дублирующийся_email_возвращает_400(self):
        data = {'username': 'testuser', 'email': 'test@example.com', 'password': 'securepass123'}
        self.client.post(self.url, data)
        data2 = {'username': 'otheruser', 'email': 'test@example.com', 'password': 'securepass123'}
        response = self.client.post(self.url, data2)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_дублирующийся_username_возвращает_400(self):
        data = {'username': 'testuser', 'email': 'test@example.com', 'password': 'securepass123'}
        self.client.post(self.url, data)
        data2 = {'username': 'testuser', 'email': 'other@example.com', 'password': 'securepass123'}
        response = self.client.post(self.url, data2)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_короткий_пароль_возвращает_400(self):
        data = {'username': 'testuser', 'email': 'test@example.com', 'password': '123'}
        response = self.client.post(self.url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_отсутствующие_поля_возвращают_400(self):
        response = self.client.post(self.url, {'username': 'testuser'})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class VerifyViewTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.register_url = '/api/v1/auth/register/'
        self.verify_url = '/api/v1/auth/verify/'
        self.client.post(self.register_url, {
            'username': 'testuser', 'email': 'test@example.com', 'password': 'securepass123'
        })

    def test_успешная_верификация(self):
        response = self.client.post(self.verify_url, {'email': 'test@example.com', 'code': '4444'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        user = User.objects.get(username='testuser')
        self.assertTrue(user.is_verified)

    def test_код_удаляется_после_верификации(self):
        self.client.post(self.verify_url, {'email': 'test@example.com', 'code': '4444'})
        user = User.objects.get(username='testuser')
        self.assertFalse(VerificationCode.objects.filter(user=user).exists())

    def test_неверный_код_возвращает_400(self):
        response = self.client.post(self.verify_url, {'email': 'test@example.com', 'code': '0000'})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_неверный_email_возвращает_400(self):
        response = self.client.post(self.verify_url, {'email': 'wrong@example.com', 'code': '4444'})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class LoginViewTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.register_url = '/api/v1/auth/register/'
        self.verify_url = '/api/v1/auth/verify/'
        self.login_url = '/api/v1/auth/login/'
        # Регистрируем и верифицируем пользователя
        self.client.post(self.register_url, {
            'username': 'testuser', 'email': 'test@example.com', 'password': 'securepass123'
        })
        self.client.post(self.verify_url, {'email': 'test@example.com', 'code': '4444'})

    def test_успешный_вход(self):
        response = self.client.post(self.login_url, {
            'username': 'testuser', 'password': 'securepass123'
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)

    def test_неверный_пароль_возвращает_401(self):
        response = self.client.post(self.login_url, {
            'username': 'testuser', 'password': 'wrongpassword'
        })
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_несуществующий_пользователь_возвращает_401(self):
        response = self.client.post(self.login_url, {
            'username': 'nobody', 'password': 'securepass123'
        })
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_невереифицированный_пользователь_не_может_войти(self):
        # Регистрируем без верификации
        self.client.post(self.register_url, {
            'username': 'unverified', 'email': 'unverified@example.com', 'password': 'securepass123'
        })
        response = self.client.post(self.login_url, {
            'username': 'unverified', 'password': 'securepass123'
        })
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class ProfileViewTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        # Создаём и верифицируем пользователя, получаем токен
        self.client.post('/api/v1/auth/register/', {
            'username': 'testuser', 'email': 'test@example.com', 'password': 'securepass123'
        })
        self.client.post('/api/v1/auth/verify/', {'email': 'test@example.com', 'code': '4444'})
        response = self.client.post('/api/v1/auth/login/', {
            'username': 'testuser', 'password': 'securepass123'
        })
        self.token = response.data['access']

    def test_профиль_возвращает_данные_пользователя(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')
        response = self.client.get('/api/v1/auth/profile/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], 'testuser')
        self.assertEqual(response.data['coins'], 1000)

    def test_профиль_без_токена_возвращает_401(self):
        response = self.client.get('/api/v1/auth/profile/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
