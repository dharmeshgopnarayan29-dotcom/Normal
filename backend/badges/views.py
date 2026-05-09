from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Badge, UserBadge
from .serializers import BadgeSerializer, UserBadgeSerializer


class MyBadgesView(APIView):
    """
    GET /api/badges/mine/
    Returns the authenticated user's earned badges plus all badge definitions
    (so the frontend can render locked/unlocked states).
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user

        # All badge definitions
        all_badges = Badge.objects.all()

        # Badges earned by this user
        earned_ubs = UserBadge.objects.filter(user=user).select_related('badge')
        earned_slugs = {ub.badge.slug: ub.earned_at for ub in earned_ubs}

        # Build response — each badge carries an `earned` flag + `earned_at`
        badges_data = []
        for badge in all_badges:
            data = BadgeSerializer(badge).data
            data['earned'] = badge.slug in earned_slugs
            data['earned_at'] = earned_slugs.get(badge.slug)
            badges_data.append(data)

        # Determine highest reporter tier for convenience
        tier_slugs_ordered = ['reporter_gold', 'reporter_silver', 'reporter_bronze']
        highest_tier = None
        for slug in tier_slugs_ordered:
            if slug in earned_slugs:
                highest_tier = slug
                break

        return Response({
            'badges': badges_data,
            'highest_reporter_tier': highest_tier,
        })
