"""
Central registry of all badge definitions.
Each entry maps directly to a row in the Badge model.

type:
    'achievement' — earned once, milestone-based (Type A)
    'tier'        — progressive, upgradeable (Type B)

tier_group:  logical group name for tier badges (only one in this project: 'reporter')
tier_level:  numeric rank within a tier group (higher = better); None for achievements
"""

BADGE_DEFINITIONS = [
    # ─── Type A: Achievement Badges ───────────────────────────────────────────
    {
        'slug': 'first_reporter',
        'name': 'First Reporter',
        'emoji': '📍',
        'description': 'You took the first step. Your city noticed.',
        'type': 'achievement',
        'tier_group': None,
        'tier_level': None,
    },
    {
        'slug': 'community_voice',
        'name': 'Community Voice',
        'emoji': '🗣️',
        'description': '5 of your reports were confirmed real. Authorities are listening.',
        'type': 'achievement',
        'tier_group': None,
        'tier_level': None,
    },
    {
        'slug': 'road_warrior',
        'name': 'Road Warrior',
        'emoji': '🛣️',
        'description': '10 road issues reported. You\'re basically fixing the city.',
        'type': 'achievement',
        'tier_group': None,
        'tier_level': None,
    },
    {
        'slug': 'quick_eye',
        'name': 'Quick Eye',
        'emoji': '⚡',
        'description': 'You spotted an issue that got fixed in under 48 hours. Sharp.',
        'type': 'achievement',
        'tier_group': None,
        'tier_level': None,
    },
    {
        'slug': 'trusted_reporter',
        'name': 'Trusted Reporter',
        'emoji': '✅',
        'description': 'Zero rejected reports, 10 verified. You don\'t cry wolf.',
        'type': 'achievement',
        'tier_group': None,
        'tier_level': None,
    },
    {
        'slug': 'guardian',
        'name': 'Guardian',
        'emoji': '🛡️',
        'description': '500 karma earned. This city runs a little better because of you.',
        'type': 'achievement',
        'tier_group': None,
        'tier_level': None,
    },
    {
        'slug': 'early_bird',
        'name': 'Early Bird',
        'emoji': '🌅',
        'description': 'First to report an issue in your area. You were there before anyone else.',
        'type': 'achievement',
        'tier_group': None,
        'tier_level': None,
    },
    {
        'slug': 'photo_reporter',
        'name': 'Photographic Evidence',
        'emoji': '📸',
        'description': '10 issues submitted with photos. Proof matters.',
        'type': 'achievement',
        'tier_group': None,
        'tier_level': None,
    },
    {
        'slug': 'comeback_reporter',
        'name': 'Comeback Reporter',
        'emoji': '🔄',
        'description': 'You reopened a falsely closed issue. Accountability counts.',
        'type': 'achievement',
        'tier_group': None,
        'tier_level': None,
    },

    # ─── Type B: Tier Badges (Reporter) ───────────────────────────────────────
    {
        'slug': 'reporter_bronze',
        'name': 'Bronze Reporter',
        'emoji': '🥉',
        'description': '5 issues reported. You\'re paying attention.',
        'type': 'tier',
        'tier_group': 'reporter',
        'tier_level': 1,
    },
    {
        'slug': 'reporter_silver',
        'name': 'Silver Reporter',
        'emoji': '🥈',
        'description': '10 issues reported. Your ward is lucky to have you.',
        'type': 'tier',
        'tier_group': 'reporter',
        'tier_level': 2,
    },
    {
        'slug': 'reporter_gold',
        'name': 'Gold Reporter',
        'emoji': '🥇',
        'description': '15+ issues reported. You\'re basically an unofficial inspector.',
        'type': 'tier',
        'tier_group': 'reporter',
        'tier_level': 3,
    },
]
