from django.db import models
from django.conf import settings


class Badge(models.Model):
    BADGE_TYPE_CHOICES = (
        ('achievement', 'Achievement'),
        ('tier', 'Tier'),
    )

    slug = models.SlugField(max_length=60, unique=True)
    name = models.CharField(max_length=100)
    emoji = models.CharField(max_length=10)
    description = models.TextField()
    type = models.CharField(max_length=20, choices=BADGE_TYPE_CHOICES, default='achievement')
    # For tier badges — the logical group (e.g. 'reporter')
    tier_group = models.CharField(max_length=50, blank=True, null=True)
    # Higher = better tier. None for achievement badges.
    tier_level = models.PositiveSmallIntegerField(blank=True, null=True)

    class Meta:
        ordering = ['type', 'tier_group', 'tier_level', 'slug']

    def __str__(self):
        return f"{self.emoji} {self.name} ({self.slug})"


class UserBadge(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='user_badges',
    )
    badge = models.ForeignKey(
        Badge,
        on_delete=models.CASCADE,
        related_name='user_badges',
    )
    earned_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'badge')
        ordering = ['-earned_at']

    def __str__(self):
        return f"{self.user.username} → {self.badge.name}"
