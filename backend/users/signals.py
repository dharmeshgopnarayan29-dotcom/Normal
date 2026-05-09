from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import CustomUser, UserProfile


@receiver(post_save, sender=CustomUser)
def create_user_profile(sender, instance, created, **kwargs):
    """Auto-create UserProfile whenever a new CustomUser is saved."""
    if created:
        UserProfile.objects.get_or_create(user=instance)
