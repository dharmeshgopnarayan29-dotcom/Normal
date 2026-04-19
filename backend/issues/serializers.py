from rest_framework import serializers
from .models import Issue
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


class IssueSerializer(serializers.ModelSerializer):
    reporter_name = serializers.ReadOnlyField(source='reported_by.username')

    class Meta:
        model = Issue
        fields = '__all__'
        read_only_fields = ('reported_by', 'created_at', 'updated_at')

    def validate(self, data):
        address = data.get('address', '').strip() if data.get('address') else ''
        lat = data.get('lat')
        lng = data.get('lng')

        has_coords = lat is not None and lng is not None
        has_address = bool(address)

        # At least one location source must be provided
        if not has_coords and not has_address:
            raise serializers.ValidationError(
                "Please provide an address, use your current location, or select a location on the map."
            )

        # Address provided but no coordinates → geocode
        if has_address and not has_coords:
            resolved_lat, resolved_lng = geocode_address(address)
            if resolved_lat is None or resolved_lng is None:
                raise serializers.ValidationError({
                    'address': "We couldn't find this address. Please refine it or select on the map."
                })
            data['lat'] = resolved_lat
            data['lng'] = resolved_lng

        # Coordinates provided but no address → reverse geocode
        if has_coords and not has_address:
            resolved_address = reverse_geocode(float(lat), float(lng))
            if resolved_address:
                data['address'] = resolved_address

        return data
