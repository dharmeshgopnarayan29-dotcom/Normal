"""
Badge evaluation engine.

Call `evaluate_badges(user)` after any state-changing action on an Issue.
Returns a list of newly awarded badge slugs (empty list if nothing new).

Karma rules (stored on users.UserProfile):
    +10  issue submitted
    +20  issue verified
    +30  issue resolved
    -10  issue rejected
"""

import math
import logging
from datetime import timedelta
from django.utils import timezone

logger = logging.getLogger(__name__)


def _get_or_create_profile(user):
    """Lazily get/create UserProfile to avoid circular imports."""
    from users.models import UserProfile
    profile, _ = UserProfile.objects.get_or_create(user=user)
    return profile


def _award(user, slug):
    """
    Award badge with given slug to user if not already awarded.
    Returns the UserBadge instance if newly created, else None.
    """
    from badges.models import Badge, UserBadge
    try:
        badge = Badge.objects.get(slug=slug)
    except Badge.DoesNotExist:
        logger.warning(f"Badge '{slug}' not found in DB — run `manage.py seed_badges`.")
        return None

    ub, created = UserBadge.objects.get_or_create(user=user, badge=badge)
    return ub if created else None


def _already_has(user, slug):
    """Check if user already holds a badge."""
    from badges.models import UserBadge
    return UserBadge.objects.filter(user=user, badge__slug=slug).exists()


# ─── Individual condition checks ──────────────────────────────────────────────

def _check_first_reporter(user, issues_qs):
    return issues_qs.exists()


def _check_community_voice(user, issues_qs):
    return issues_qs.filter(status='verified').count() >= 5


def _check_road_warrior(user, issues_qs):
    return issues_qs.filter(category='roads').count() >= 10


def _check_quick_eye(user, issues_qs):
    """Any issue resolved within 48 hours of submission."""
    from issues.models import TimelineEvent
    cutoff = timedelta(hours=48)
    for issue in issues_qs.filter(status='resolved'):
        resolved_event = (
            TimelineEvent.objects
            .filter(issue=issue, step='resolved')
            .order_by('created_at')
            .first()
        )
        if resolved_event and (resolved_event.created_at - issue.created_at) <= cutoff:
            return True
    return False


def _check_trusted_reporter(user, issues_qs):
    """Zero rejected reports AND at least 10 verified."""
    rejected = issues_qs.filter(status='rejected').count()
    verified = issues_qs.filter(status='verified').count()
    return rejected == 0 and verified >= 10


def _check_guardian(user):
    """500+ karma."""
    profile = _get_or_create_profile(user)
    return profile.karma >= 500


def _check_early_bird(user, issues_qs):
    """
    User was first to report an issue in any 0.01° lat/lng grid cell.
    Grid cell = (floor(lat / 0.01), floor(lng / 0.01))
    """
    from issues.models import Issue

    # Get all grid cells the user has reported in
    user_issues_with_coords = issues_qs.exclude(lat=None, lng=None)

    for ui in user_issues_with_coords:
        lat_cell = math.floor(float(ui.lat) / 0.01)
        lng_cell = math.floor(float(ui.lng) / 0.01)

        # lat/lng bounds for this cell
        lat_min = lat_cell * 0.01
        lat_max = lat_min + 0.01
        lng_min = lng_cell * 0.01
        lng_max = lng_min + 0.01

        # First issue ever submitted in this cell
        first_in_cell = (
            Issue.objects
            .filter(
                lat__gte=lat_min, lat__lt=lat_max,
                lng__gte=lng_min, lng__lt=lng_max,
            )
            .order_by('created_at')
            .first()
        )

        if first_in_cell and first_in_cell.reported_by_id == user.pk:
            return True

    return False


def _check_photo_reporter(user, issues_qs):
    """10+ issues submitted with a photo."""
    return issues_qs.exclude(photo='').exclude(photo=None).count() >= 10


def _check_comeback_reporter(user, issues_qs):
    """User reopened at least one resolved issue (has a 'submitted' TimelineEvent AFTER a 'resolved' event)."""
    from issues.models import TimelineEvent
    for issue in issues_qs:
        events = list(
            TimelineEvent.objects
            .filter(issue=issue)
            .order_by('created_at')
            .values_list('step', flat=True)
        )
        # Look for pattern: ...resolved... submitted (reopen)
        try:
            resolved_idx = len(events) - 1 - events[::-1].index('resolved')
            # Any 'submitted' event after the last 'resolved'?
            after_resolved = events[resolved_idx + 1:]
            if 'submitted' in after_resolved:
                return True
        except ValueError:
            pass
    return False


# ─── Tier checks ──────────────────────────────────────────────────────────────

def _check_reporter_tier(user, issues_qs):
    """Returns the highest eligible tier slug, or None."""
    total = issues_qs.count()
    if total >= 15:
        return 'reporter_gold'
    elif total >= 10:
        return 'reporter_silver'
    elif total >= 5:
        return 'reporter_bronze'
    return None


# ─── Main entry point ─────────────────────────────────────────────────────────

def evaluate_badges(user):
    """
    Run all badge checks for `user`. Awards newly earned badges and returns
    a list of dicts for newly earned badges:
        [{'slug': ..., 'name': ..., 'emoji': ..., 'description': ...}, ...]
    """
    from issues.models import Issue

    newly_earned = []

    # All non-flagged issues reported by this user
    issues_qs = Issue.objects.filter(reported_by=user, is_flagged=False)

    # ── Achievement checks ────────────────────────────────────────────────────
    checks = [
        ('first_reporter',    lambda: _check_first_reporter(user, issues_qs)),
        ('community_voice',   lambda: _check_community_voice(user, issues_qs)),
        ('road_warrior',      lambda: _check_road_warrior(user, issues_qs)),
        ('quick_eye',         lambda: _check_quick_eye(user, issues_qs)),
        ('trusted_reporter',  lambda: _check_trusted_reporter(user, issues_qs)),
        ('guardian',          lambda: _check_guardian(user)),
        ('early_bird',        lambda: _check_early_bird(user, issues_qs)),
        ('photo_reporter',    lambda: _check_photo_reporter(user, issues_qs)),
        ('comeback_reporter', lambda: _check_comeback_reporter(user, issues_qs)),
    ]

    for slug, condition_fn in checks:
        if not _already_has(user, slug):
            try:
                if condition_fn():
                    awarded = _award(user, slug)
                    if awarded:
                        newly_earned.append({
                            'slug': awarded.badge.slug,
                            'name': awarded.badge.name,
                            'emoji': awarded.badge.emoji,
                            'description': awarded.badge.description,
                        })
            except Exception as e:
                logger.error(f"Error evaluating badge '{slug}' for user {user.pk}: {e}")

    # ── Tier badge (reporter) ─────────────────────────────────────────────────
    target_tier = _check_reporter_tier(user, issues_qs)
    tier_slugs = ['reporter_bronze', 'reporter_silver', 'reporter_gold']

    if target_tier:
        # Award all tiers up to and including the target (so history is preserved)
        target_level = tier_slugs.index(target_tier) + 1
        for i, slug in enumerate(tier_slugs[:target_level]):
            if not _already_has(user, slug):
                awarded = _award(user, slug)
                if awarded:
                    newly_earned.append({
                        'slug': awarded.badge.slug,
                        'name': awarded.badge.name,
                        'emoji': awarded.badge.emoji,
                        'description': awarded.badge.description,
                    })

    return newly_earned


# ─── Karma helpers ────────────────────────────────────────────────────────────

KARMA_MAP = {
    'verified':  20,
    'resolved':  30,
    'rejected': -10,
}


def update_karma(user, new_status):
    """
    Adjust karma based on a new issue status.
    Call this from IssueDetailView.perform_update when status changes.
    """
    delta = KARMA_MAP.get(new_status, 0)
    if delta == 0:
        return
    profile = _get_or_create_profile(user)
    profile.karma = max(0, profile.karma + delta)  # karma floor at 0
    profile.save(update_fields=['karma'])


def add_submission_karma(user):
    """Award +10 karma when a new issue is submitted."""
    profile = _get_or_create_profile(user)
    profile.karma += 10
    profile.save(update_fields=['karma'])
