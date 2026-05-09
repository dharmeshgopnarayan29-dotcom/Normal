from django.contrib.auth.models import AbstractUser
from django.db import models


class CustomUser(AbstractUser):
    ROLE_CHOICES = (
        ('citizen', 'Citizen'),
        ('admin', 'Admin'),
    )
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='citizen')

    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = ['email']

    def __str__(self):
        return f"{self.email} ({self.role})"


class UserProfile(models.Model):
    """Extended profile data for CustomUser — stores karma and future fields."""
    user = models.OneToOneField(
        CustomUser,
        on_delete=models.CASCADE,
        related_name='profile',
    )
    karma = models.IntegerField(default=0)

    def __str__(self):
        return f"Profile({self.user.username}, karma={self.karma})"
