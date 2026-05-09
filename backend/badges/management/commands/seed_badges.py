"""
Management command: seed_badges
Usage: python manage.py seed_badges

Creates or updates all badge records defined in badge_definitions.py.
Safe to run multiple times (idempotent).
"""

from django.core.management.base import BaseCommand
from badges.models import Badge
from badges.badge_definitions import BADGE_DEFINITIONS


class Command(BaseCommand):
    help = 'Seed / sync all badge definitions into the database.'

    def handle(self, *args, **options):
        created_count = 0
        updated_count = 0

        for defn in BADGE_DEFINITIONS:
            badge, created = Badge.objects.update_or_create(
                slug=defn['slug'],
                defaults={
                    'name': defn['name'],
                    'emoji': defn['emoji'],
                    'description': defn['description'],
                    'type': defn['type'],
                    'tier_group': defn.get('tier_group'),
                    'tier_level': defn.get('tier_level'),
                },
            )
            # Use ASCII-safe output to avoid Windows console encoding issues
            label = f"[{badge.slug}] {badge.name}"
            if created:
                created_count += 1
                self.stdout.write(self.style.SUCCESS(f"  [CREATED] {label}"))
            else:
                updated_count += 1
                self.stdout.write(f"  [OK]      {label}")

        self.stdout.write(
            self.style.SUCCESS(
                f"\nDone. {created_count} created, {updated_count} already existed (updated)."
            )
        )
