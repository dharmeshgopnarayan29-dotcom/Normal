from django.contrib import admin
from .models import Badge, UserBadge


@admin.register(Badge)
class BadgeAdmin(admin.ModelAdmin):
    list_display = ('emoji', 'name', 'slug', 'type', 'tier_group', 'tier_level')
    list_filter = ('type', 'tier_group')
    search_fields = ('name', 'slug')
    ordering = ('type', 'tier_group', 'tier_level', 'slug')


@admin.register(UserBadge)
class UserBadgeAdmin(admin.ModelAdmin):
    list_display = ('user', 'badge', 'earned_at')
    list_filter = ('badge__type', 'badge__tier_group')
    search_fields = ('user__username', 'badge__slug')
    ordering = ('-earned_at',)
    autocomplete_fields = ['badge']
