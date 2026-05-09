from rest_framework import serializers
from .models import Badge, UserBadge


class BadgeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Badge
        fields = ('id', 'slug', 'name', 'emoji', 'description', 'type', 'tier_group', 'tier_level')


class UserBadgeSerializer(serializers.ModelSerializer):
    badge = BadgeSerializer(read_only=True)

    class Meta:
        model = UserBadge
        fields = ('id', 'badge', 'earned_at')
