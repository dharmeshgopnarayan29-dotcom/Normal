from rest_framework import serializers
from .models import Issue, Comment, Upvote, Flag, TimelineEvent
import urllib.request
import urllib.parse
import json
import logging

logger = logging.getLogger(__name__)

NOMINATIM_HEADERS = {
    'User-Agent': 'CivicFix/1.0 (civicfix-app)'
}


def geocode_address(address):
    """Convert an address string to (lat, lng) using Nominatim."""
    try:
        params = urllib.parse.urlencode({'q': address, 'format': 'json', 'limit': '1'})
        req = urllib.request.Request(
            f'https://nominatim.openstreetmap.org/search?{params}',
            headers=NOMINATIM_HEADERS,
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            results = json.loads(resp.read().decode())
            if results:
                return float(results[0]['lat']), float(results[0]['lon'])
    except Exception as e:
        logger.warning(f'Geocoding failed for "{address}": {e}')
    return None, None


def reverse_geocode(lat, lng):
    """Convert (lat, lng) to a readable address using Nominatim."""
    try:
        params = urllib.parse.urlencode({'lat': lat, 'lon': lng, 'format': 'json'})
        req = urllib.request.Request(
            f'https://nominatim.openstreetmap.org/reverse?{params}',
            headers=NOMINATIM_HEADERS,
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode())
            return data.get('display_name', '')
    except Exception as e:
        logger.warning(f'Reverse geocoding failed for ({lat}, {lng}): {e}')
    return ''


class TimelineEventSerializer(serializers.ModelSerializer):
    performed_by_name = serializers.ReadOnlyField(source='performed_by.username')

    class Meta:
        model = TimelineEvent
        fields = ('id', 'issue', 'step', 'performed_by', 'performed_by_name', 'note', 'department', 'created_at')
        read_only_fields = ('issue', 'performed_by', 'created_at')


class CommentSerializer(serializers.ModelSerializer):
    username = serializers.ReadOnlyField(source='user.username')

    class Meta:
        model = Comment
        fields = ('id', 'issue', 'user', 'username', 'text', 'created_at')
        read_only_fields = ('user', 'issue', 'created_at')


class IssueSerializer(serializers.ModelSerializer):
    reporter_name = serializers.ReadOnlyField(source='reported_by.username')
    upvote_count = serializers.SerializerMethodField()
    comment_count = serializers.SerializerMethodField()
    flag_count = serializers.SerializerMethodField()
    has_upvoted = serializers.SerializerMethodField()
    has_flagged = serializers.SerializerMethodField()
    timeline = serializers.SerializerMethodField()

    class Meta:
        model = Issue
        fields = '__all__'
        read_only_fields = ('reported_by', 'created_at', 'updated_at', 'is_flagged')

    def get_upvote_count(self, obj):
        return obj.upvotes.count()

    def get_comment_count(self, obj):
        return obj.comments.count()

    def get_flag_count(self, obj):
        return obj.flags.count()

    def get_has_upvoted(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.upvotes.filter(user=request.user).exists()
        return False

    def get_has_flagged(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.flags.filter(user=request.user).exists()
        return False

    def get_timeline(self, obj):
        events = obj.timeline_events.all()
        if events.exists():
            return TimelineEventSerializer(events, many=True).data

        # Backwards compatibility: generate a "submitted" event from created_at
        return [{
            'id': None,
            'issue': obj.id,
            'step': 'submitted',
            'performed_by': obj.reported_by_id,
            'performed_by_name': obj.reported_by.username if obj.reported_by else 'Unknown',
            'note': '',
            'department': '',
            'created_at': obj.created_at.isoformat() if obj.created_at else None,
        }]

    def validate(self, data):
        address = data.get('address', '').strip() if data.get('address') else ''
        lat = data.get('lat')
        lng = data.get('lng')

        # For partial updates (PATCH), we only validate location if it's being provided
        # or if the existing instance also doesn't have it.
        has_coords = lat is not None and lng is not None
        has_address = bool(address)

        # Check existing instance if it's an update
        if self.instance:
            if not has_coords:
                has_coords = self.instance.lat is not None and self.instance.lng is not None
            if not has_address:
                has_address = bool(self.instance.address)

        if not has_coords and not has_address:
            raise serializers.ValidationError(
                "Please provide an address, use your current location, or select a location on the map."
            )

        # Address provided but no coordinates → geocode
        if has_address and not has_coords:
            resolved_lat, resolved_lng = geocode_address(address)
            if resolved_lat is not None and resolved_lng is not None:
                data['lat'] = resolved_lat
                data['lng'] = resolved_lng
            # Note: If Nominatim geocoding fails (e.g. rate limit on Render),
            # we gracefully accept the address without coordinates instead of blocking submission.

        # Coordinates provided but no address → reverse geocode
        if has_coords and not has_address:
            resolved_address = reverse_geocode(float(lat), float(lng))
            if resolved_address:
                data['address'] = resolved_address

        return data
