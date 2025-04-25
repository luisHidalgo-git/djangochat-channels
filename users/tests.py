from django.test import TestCase
from django.contrib.auth import get_user_model

class UserTests(TestCase):
    def setUp(self):
        self.User = get_user_model()

    def test_create_user(self):
        """Test para verificar la creación de un usuario."""
        user = self.User.objects.create_user(
            username='testuser',
            email='testuser@example.com',
            password='password123'
        )
        self.assertEqual(user.username, 'testuser')
        self.assertEqual(user.email, 'testuser@example.com')
        self.assertTrue(user.check_password('password123'))

    def test_create_superuser(self):
        """Test para verificar la creación de un superusuario."""
        superuser = self.User.objects.create_superuser(
            username='adminuser',
            email='admin@example.com',
            password='adminpassword'
        )
        self.assertTrue(superuser.is_superuser)
        self.assertTrue(superuser.is_staff)

    def test_update_user(self):
        """Test para verificar la actualización de datos de un usuario."""
        user = self.User.objects.create_user(
            username='updateuser',
            email='updateuser@example.com',
            password='password123'
        )
        user.username = 'updateduser'
        user.save()
        self.assertEqual(user.username, 'updateduser')

    def test_authenticate_user(self):
        """Test para verificar la autenticación de un usuario."""
        self.User.objects.create_user(
            username='authuser',
            email='authuser@example.com',
            password='password123'
        )
        user = self.User.objects.get(username='authuser')
        self.assertTrue(user.check_password('password123'))