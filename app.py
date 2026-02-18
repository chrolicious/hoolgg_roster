"""
Hool.gg Roster - WoW Character Tracker
Flask backend with Blizzard API integration
Part of the Hool.gg gaming tools ecosystem
"""

import json
import os
import sys
import tempfile
import time
from datetime import datetime, timezone
from flask import Flask, render_template, jsonify, request
import requests

# Handle PyInstaller bundles
if getattr(sys, 'frozen', False):
    base_path = sys._MEIPASS
else:
    base_path = os.path.dirname(__file__)

app = Flask(__name__,
    template_folder=os.path.join(base_path, 'templates'),
    static_folder=os.path.join(base_path, 'static'))

_data_dir = os.environ.get('HOOL_DATA_DIR', os.path.dirname(__file__))
os.makedirs(_data_dir, exist_ok=True)
DATA_FILE = os.path.join(_data_dir, 'data.json')

# Blizzard API slot mapping
SLOT_MAP = {
    'HEAD': 'head',
    'NECK': 'neck',
    'SHOULDER': 'shoulder',
    'BACK': 'back',
    'CHEST': 'chest',
    'WRIST': 'wrist',
    'HANDS': 'hands',
    'WAIST': 'waist',
    'LEGS': 'legs',
    'FEET': 'feet',
    'FINGER_1': 'ring1',
    'FINGER_2': 'ring2',
    'TRINKET_1': 'trinket1',
    'TRINKET_2': 'trinket2',
    'MAIN_HAND': 'main_hand',
    'OFF_HAND': 'off_hand',
}

# Weekly ilvl targets
WEEKLY_TARGETS = {
    0: 215,  # Pre-Season baseline
    1: 235, 2: 235,
    3: 250, 4: 250,
    5: 265, 6: 265, 7: 265, 8: 265,
    9: 280, 10: 280, 11: 280, 12: 280,
}

# Shared public API key — works out of the box for all users.
# Rate-limited to Blizzard's standard tier. Users can override in Settings.
DEFAULT_CLIENT_ID = 'df5ff56a63e5473197b78704bc50e25d'
DEFAULT_CLIENT_SECRET = 'zlZpz6ArhOtH8ZRuDh8Yf43t6YwMpuPm'

# Week-specific tasks based on Midnight progression
WEEKLY_TASKS = {
    0: {
        'name': 'Early Access + Pre-Season (Feb 26 - Mar 16)',
        'weekly': [
            {'id': 'level_chars', 'label': 'Level all characters to max (90)', 'done': False},
            {'id': 'darkmoon', 'label': 'Use Darkmoon Faire for 10% XP/Renown bonus', 'done': False},
            {'id': 'unlock_delves', 'label': 'Unlock Delves to Tier 8+ (Tier 11 if available)', 'done': False},
            {'id': 'm0_tour', 'label': 'Complete M0 dungeon tour for gear (don\'t upgrade)', 'done': False},
            {'id': 'craft_prep', 'label': 'Craft 246 ilvl gear in 3-5 slots (60x Veteran Crests each)', 'done': False},
            {'id': 'world_quests', 'label': 'Complete world quests for gear', 'done': False},
        ],
        'daily': [
            {'id': 'renown_dmf', 'label': 'Farm Renown (with DMF bonus)', 'done': False},
            {'id': 'delve_farming', 'label': 'Farm Delves for gear and crests', 'done': False},
            {'id': 'prey_quest', 'label': 'Complete Prey if rewards are useful', 'done': False},
        ]
    },
    1: {
        'name': 'Season 1 Week 1 - Heroic Week (Mar 17)',
        'weekly': [
            {'id': 'lfr_tier', 'label': 'Do LFR for tier pieces (unlock catalyst charges)', 'done': False},
            {'id': 'm0_tour', 'label': 'Complete M0 tour (items drop at 1/6 Champion 246)', 'done': False},
            {'id': 'world_boss', 'label': 'Kill world boss (2/6 Champion 250)', 'done': False},
            {'id': 'crafting', 'label': 'Craft 246 ilvl pieces (3-5 slots) + fill remaining with 233', 'done': False},
            {'id': 'delves_farm', 'label': 'Farm high-level Delves with coffer keys', 'done': False},
            {'id': 'normal_clear', 'label': 'Clear Normal raid', 'done': False},
            {'id': 'heroic_clear', 'label': 'Clear Heroic raid', 'done': False},
        ],
        'daily': [
            {'id': 'prey', 'label': 'Complete Prey if useful', 'done': False},
            {'id': 'world_quests', 'label': 'Complete world quests', 'done': False},
        ]
    },
    2: {
        'name': 'Season 1 Week 2 - Mythic Week + M+ Opens (Mar 24)',
        'weekly': [
            {'id': 'lfr_tier', 'label': 'Do LFR for tier pieces', 'done': False},
            {'id': 'world_boss', 'label': 'Kill world boss (2/6 Champion)', 'done': False},
            {'id': 'delves', 'label': 'Farm high-level Delves with coffer keys (optional)', 'done': False},
            {'id': 'farm_mplus', 'label': 'Farm +10s (3/6h 266) for vault slots and crests', 'done': False},
            {'id': 'normal_clear', 'label': 'Full clear Normal raid', 'done': False},
            {'id': 'heroic_clear', 'label': 'Full clear Heroic raid', 'done': False},
            {'id': 'mythic_prog', 'label': 'Begin mythic progression', 'done': False},
        ],
        'daily': [
            {'id': 'prey', 'label': 'Complete Prey if useful', 'done': False},
        ]
    },
    3: {
        'name': 'Season 1 Week 3 - Final Raid Opens (Mar 31)',
        'weekly': [
            {'id': 'vault_open', 'label': 'Open vault for 272+ myth item, upgrade AFTER crafting', 'done': False},
            {'id': 'craft_weapon', 'label': 'Craft 2H mythic weapon at 5/6 285 (60 Myth Crests)', 'done': False},
            {'id': 'lfr_tier', 'label': 'Do LFR for tier if no 4p yet', 'done': False},
            {'id': 'farm_m12', 'label': 'Farm +12s for vault slots and crests', 'done': False},
            {'id': 'raid_reclear', 'label': 'Reclear all raids', 'done': False},
            {'id': 'spend_heroic', 'label': 'Spend heroic crests (after reclear): upgrade 10 items to 4/6 for 300 total', 'done': False},
            {'id': 'upgrade_myth', 'label': 'Upgrade 1/6 272 myth to 4/6 282 (60 crests)', 'done': False},
        ],
        'daily': []
    },
    4: {
        'name': 'Season 1 Week 4 - Progression (Apr 7)',
        'weekly': [
            {'id': 'vault', 'label': 'Open vault for 272+ myth item', 'done': False},
            {'id': 'farm_m12', 'label': 'Farm +12s for vault slots and crests', 'done': False},
            {'id': 'heroic_crests', 'label': 'Upgrade 2x 3/6→4/6 (60c) + 1x 4/6→5/6 (40c) = 100 heroic crests', 'done': False},
            {'id': 'myth_upgrades', 'label': 'Upgrade your mythic pieces: 1/6→4/6 (60c) + 2/6→4/6 (50c) + 4/6→5/6 (50c)', 'done': False},
        ],
        'daily': []
    },
    5: {
        'name': 'Season 1 Week 5 - Progression (Apr 14)',
        'weekly': [
            {'id': 'vault', 'label': 'Open vault for 272+ myth item', 'done': False},
            {'id': 'farm_m12', 'label': 'Farm +12s for vault slots and crests', 'done': False},
            {'id': 'craft_second', 'label': 'Craft second item at 5/6 285 mythic (60 crests)', 'done': False},
            {'id': 'heroic_crests', 'label': 'Upgrade 2x 4/6→5/6 items with 80 heroic crests', 'done': False},
            {'id': 'myth_upgrade', 'label': 'Upgrade 1/6 272→4/6 282 mythic (60 crests)', 'done': False},
        ],
        'daily': []
    },
    6: {
        'name': 'Season 1 Week 6 - Progression (Apr 21)',
        'weekly': [
            {'id': 'vault', 'label': 'Open vault for 272+ myth item', 'done': False},
            {'id': 'farm_m12', 'label': 'Farm +12s for vault slots and crests', 'done': False},
            {'id': 'heroic_crests', 'label': 'Upgrade 3x 4/6→5/6 items with 120 heroic crests', 'done': False},
            {'id': 'myth_upgrade', 'label': 'Upgrade 1/6→4/6 (30c) + 3/6→4/6 (30c) mythic = 60 crests', 'done': False},
        ],
        'daily': []
    },
    7: {
        'name': 'Season 1 Week 7 - Progression (Apr 28)',
        'weekly': [
            {'id': 'vault', 'label': 'Open vault for 272+ myth item', 'done': False},
            {'id': 'farm_m12', 'label': 'Farm +12s for vault slots and crests', 'done': False},
            {'id': 'craft_third', 'label': 'Craft third item at 5/6 285 mythic (60 crests)', 'done': False},
            {'id': 'heroic_crests', 'label': 'Upgrade 2x 4/6→5/6 items with 80 heroic crests', 'done': False},
            {'id': 'myth_upgrade', 'label': 'Upgrade 1/6→3/6 279 mythic (30 crests)', 'done': False},
        ],
        'daily': []
    },
    8: {
        'name': 'Season 1 Week 8 - Done with Heroic (May 5)',
        'weekly': [
            {'id': 'vault', 'label': 'Open vault for 272+ myth item', 'done': False},
            {'id': 'farm_m12', 'label': 'Farm +12s for vault slots and crests', 'done': False},
            {'id': 'heroic_final', 'label': 'Upgrade 2x 5/6→6/6 items with 100 heroic crests (DONE with heroic)', 'done': False},
            {'id': 'myth_upgrades', 'label': 'Mythic: 1/6→2/6 (10c) + 3x 2/6→3/6 (60c) + 1x 3/6→4/6 (30c) = 100 crests', 'done': False},
        ],
        'daily': []
    },
    9: {
        'name': 'Season 1 Week 9+ - Final Optimization (May 12+)',
        'weekly': [
            {'id': 'vault', 'label': 'Open vault and optimize picks', 'done': False},
            {'id': 'farm_m12', 'label': 'Farm +12s and optimally use crests', 'done': False},
            {'id': 'craft_remaining', 'label': 'Craft remaining slots at 5/6 mythic (60c each)', 'done': False},
            {'id': 'push_282', 'label': 'Get every item to at least 4/6 282 mythic', 'done': False},
            {'id': 'upgrade_286', 'label': 'Start upgrading to 5/6 285 and 6/6 289', 'done': False},
        ],
        'daily': []
    },
}

# Weeks 10-12 follow same progression pattern as week 9


def get_weekly_tasks(week):
    """Get tasks for a specific week."""
    return WEEKLY_TASKS.get(week, WEEKLY_TASKS.get(0, {
        'name': 'Unknown Week',
        'weekly': [],
        'daily': []
    }))


def init_profession_progress(professions):
    """Initialize profession progress structure."""
    progress = {}
    for prof in professions:
        if prof:  # Skip empty profession slots
            progress[prof] = {
                'weekly_quest': False,
                'patron_orders': False,
                'treatise': False,
                'knowledge_points': 0,
                'concentration': 1000
            }
    return progress


def init_default_data():
    """Create default data structure for new installations."""
    return {
        "meta": {
            "current_week": 0,
            "last_updated": datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z')
        },
        "blizzard_config": {
            "use_shared_credentials": True,
            "client_id": "",
            "client_secret": "",
            "region": "us",
            "access_token": "",
            "token_expires": None
        },
        "characters": []
    }

def load_data():
    """Load data from JSON file, creating default if it doesn't exist."""
    # Initialize with default data if file doesn't exist
    if not os.path.exists(DATA_FILE):
        default_data = init_default_data()
        save_data(default_data)
        return default_data

    with open(DATA_FILE, 'r') as f:
        data = json.load(f)

    current_week = str(data['meta'].get('current_week', 0))

    # Migrate/validate data structure
    for char in data.get('characters', []):
        # Ensure crests structure exists
        if 'crests' not in char:
            char['crests'] = {
                'weathered': {'collected_this_week': 0, 'total_collected': 0, 'weekly_history': {}},
                'carved': {'collected_this_week': 0, 'total_collected': 0, 'weekly_history': {}},
                'runed': {'collected_this_week': 0, 'total_collected': 0, 'weekly_history': {}},
                'gilded': {'collected_this_week': 0, 'total_collected': 0, 'weekly_history': {}}
            }

        # Migrate existing data to add weekly_history and populate collected_this_week from history
        for crest_type, crest_data in char['crests'].items():
            if 'weekly_history' not in crest_data:
                crest_data['weekly_history'] = {}

            # Populate collected_this_week from weekly_history for current week
            if current_week in crest_data['weekly_history']:
                crest_data['collected_this_week'] = crest_data['weekly_history'][current_week]
            else:
                crest_data['collected_this_week'] = 0

            # Recalculate total from history to fix any inconsistencies
            if crest_data['weekly_history']:
                crest_data['total_collected'] = sum(crest_data['weekly_history'].values())

        # Ensure profession_progress exists
        if 'profession_progress' not in char:
            char['profession_progress'] = init_profession_progress(char.get('professions', []))

        # Ensure gear slots have all required fields
        for slot_name, slot_data in char.get('gear', {}).items():
            if 'item_id' not in slot_data:
                slot_data['item_id'] = 0
            if 'quality' not in slot_data:
                slot_data['quality'] = 'COMMON'
            if 'sockets' not in slot_data:
                slot_data['sockets'] = 0
            if 'enchanted' not in slot_data:
                slot_data['enchanted'] = False

        # Ensure task structures exist
        if 'weekly_tasks' not in char:
            char['weekly_tasks'] = {}
        if 'daily_tasks' not in char:
            char['daily_tasks'] = {}

        # Migrate weekly_tasks keys from int to str to prevent JSON serialization errors
        if char['weekly_tasks']:
            new_weekly_tasks = {}
            for week_key, tasks in char['weekly_tasks'].items():
                new_weekly_tasks[str(week_key)] = tasks
            char['weekly_tasks'] = new_weekly_tasks

        # Ensure avatar and stats exist
        if 'avatar_url' not in char:
            char['avatar_url'] = None
        if 'stats' not in char:
            char['stats'] = {}

        # Ensure class and level exist
        if 'class' not in char:
            char['class'] = ''
        if 'level' not in char:
            char['level'] = 0

        # Ensure order field exists
        if 'order' not in char:
            char['order'] = char['id']  # Default to ID order

        # Ensure new fields for dashboard redesign
        if 'weekly_progress' not in char:
            char['weekly_progress'] = {}
        if 'bis_list' not in char:
            char['bis_list'] = []
        if 'talent_builds' not in char:
            char['talent_builds'] = []

    # Sort characters by order field
    data['characters'].sort(key=lambda c: c.get('order', c['id']))

    return data


def save_data(data):
    """Atomic save to JSON file using temp file + rename."""
    data['meta']['last_updated'] = datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z')

    # Write to temp file first
    fd, temp_path = tempfile.mkstemp(dir=os.path.dirname(DATA_FILE), suffix='.tmp')
    try:
        with os.fdopen(fd, 'w') as f:
            json.dump(data, f, indent=2)
        # Atomic rename
        os.replace(temp_path, DATA_FILE)
    except:
        os.unlink(temp_path)
        raise


def get_character(data, char_id):
    """Find character by ID."""
    for char in data['characters']:
        if char['id'] == char_id:
            return char
    return None


def calculate_avg_ilvl(gear):
    """Calculate average item level from gear slots."""
    total = 0
    for slot_name, slot_data in gear.items():
        if isinstance(slot_data, dict):
            ilvl = slot_data.get('ilvl', 0)
            if isinstance(ilvl, (int, float)):
                total += ilvl
    return round(total / 16, 1)


def get_weekly_target(week):
    """Get ilvl target for given week."""
    return WEEKLY_TARGETS.get(week, 280)


def get_weekly_crest_cap(week):
    """Get cumulative crest cap for given week (90 per week)."""
    return 90 * week


# Blizzard API Integration

def get_blizzard_token(config):
    """Get OAuth token from Blizzard API. Uses shared or custom credentials based on config."""
    use_shared = config.get('use_shared_credentials', True)

    if use_shared:
        # Use shared credentials (not exposed in UI)
        client_id = DEFAULT_CLIENT_ID
        client_secret = DEFAULT_CLIENT_SECRET
    else:
        # Use custom user-provided credentials
        client_id = config.get('client_id')
        client_secret = config.get('client_secret')

    if not client_id or not client_secret:
        return None

    # Check if token is still valid
    if config.get('access_token') and config.get('token_expires'):
        if time.time() < config['token_expires']:
            return config['access_token']

    # Request new token
    region = config.get('region', 'us')
    token_url = f'https://{region}.battle.net/oauth/token'

    try:
        response = requests.post(
            token_url,
            data={'grant_type': 'client_credentials'},
            auth=(client_id, client_secret),
            timeout=10
        )
        response.raise_for_status()
        token_data = response.json()

        config['access_token'] = token_data['access_token']
        config['token_expires'] = time.time() + token_data.get('expires_in', 86400) - 300

        return config['access_token']
    except Exception as e:
        print(f"Token fetch error: {e}")
        return None


def fetch_item_media(config, item_id):
    """Fetch item icon from Blizzard API."""
    token = get_blizzard_token(config)
    if not token:
        return None

    region = config.get('region', 'us')
    namespace = f'static-{region}'

    url = f'https://{region}.api.blizzard.com/data/wow/media/item/{item_id}'

    try:
        response = requests.get(
            url,
            params={'namespace': namespace, 'locale': 'en_US'},
            headers={'Authorization': f'Bearer {token}'},
            timeout=10
        )
        response.raise_for_status()
        data = response.json()

        # Extract icon URL from assets
        for asset in data.get('assets', []):
            if asset.get('key') == 'icon':
                return asset.get('value')

        return None
    except:
        return None


def fetch_character_profile(config, realm, character_name):
    """Fetch basic character profile (class, race, etc) from Blizzard API."""
    token = get_blizzard_token(config)
    if not token:
        return None, "No valid API token"

    region = config.get('region', 'us')
    namespace = f'profile-{region}'

    realm_slug = realm.lower().replace(' ', '-').replace("'", "")
    char_slug = character_name.lower()

    url = f'https://{region}.api.blizzard.com/profile/wow/character/{realm_slug}/{char_slug}'

    try:
        response = requests.get(
            url,
            params={'namespace': namespace, 'locale': 'en_US'},
            headers={'Authorization': f'Bearer {token}'},
            timeout=15
        )
        response.raise_for_status()
        data = response.json()

        # Extract class name
        char_class = data.get('character_class', {}).get('name', '')
        level = data.get('level', 0)

        return {'class': char_class, 'level': level}, None
    except requests.exceptions.HTTPError as e:
        return None, f"API error: {e.response.status_code}"
    except Exception as e:
        return None, f"Request failed: {str(e)}"


def fetch_character_media(config, realm, character_name):
    """Fetch character media (avatar, render) from Blizzard API."""
    token = get_blizzard_token(config)
    if not token:
        return None, "No valid API token"

    region = config.get('region', 'us')
    namespace = f'profile-{region}'

    realm_slug = realm.lower().replace(' ', '-').replace("'", "")
    char_slug = character_name.lower()

    url = f'https://{region}.api.blizzard.com/profile/wow/character/{realm_slug}/{char_slug}/character-media'

    try:
        response = requests.get(
            url,
            params={'namespace': namespace, 'locale': 'en_US'},
            headers={'Authorization': f'Bearer {token}'},
            timeout=15
        )
        response.raise_for_status()
        data = response.json()

        # Extract avatar URL
        avatar_url = None
        for asset in data.get('assets', []):
            if asset.get('key') == 'avatar':
                avatar_url = asset.get('value')
                break

        return avatar_url, None
    except requests.exceptions.HTTPError as e:
        return None, f"API error: {e.response.status_code}"
    except Exception as e:
        return None, f"Request failed: {str(e)}"


def fetch_character_stats(config, realm, character_name):
    """Fetch character stats from Blizzard API."""
    token = get_blizzard_token(config)
    if not token:
        return None, "No valid API token"

    region = config.get('region', 'us')
    namespace = f'profile-{region}'

    realm_slug = realm.lower().replace(' ', '-').replace("'", "")
    char_slug = character_name.lower()

    url = f'https://{region}.api.blizzard.com/profile/wow/character/{realm_slug}/{char_slug}/statistics'

    try:
        response = requests.get(
            url,
            params={'namespace': namespace, 'locale': 'en_US'},
            headers={'Authorization': f'Bearer {token}'},
            timeout=15
        )
        response.raise_for_status()
        return response.json(), None
    except requests.exceptions.HTTPError as e:
        return None, f"API error: {e.response.status_code}"
    except Exception as e:
        return None, f"Request failed: {str(e)}"


def fetch_character_equipment(config, realm, character_name):
    """Fetch character equipment from Blizzard API."""
    token = get_blizzard_token(config)
    if not token:
        return None, "No valid API token"

    region = config.get('region', 'us')
    namespace = f'profile-{region}'

    # Normalize realm and character name
    realm_slug = realm.lower().replace(' ', '-').replace("'", "")
    char_slug = character_name.lower()

    url = f'https://{region}.api.blizzard.com/profile/wow/character/{realm_slug}/{char_slug}/equipment'

    try:
        response = requests.get(
            url,
            params={'namespace': namespace, 'locale': 'en_US'},
            headers={'Authorization': f'Bearer {token}'},
            timeout=15
        )
        response.raise_for_status()
        return response.json(), None
    except requests.exceptions.HTTPError as e:
        return None, f"API error: {e.response.status_code}"
    except Exception as e:
        return None, f"Request failed: {str(e)}"


def parse_character_stats(stats_data):
    """Parse character stats from Blizzard API response."""
    if not stats_data:
        return {}

    stats = {}

    # Primary stats
    for stat in ['strength', 'agility', 'intellect', 'stamina']:
        stat_obj = stats_data.get(stat, {})
        if isinstance(stat_obj, dict):
            stats[stat] = stat_obj.get('effective', 0)
        else:
            stats[stat] = 0

    # Secondary stats - try multiple field name variations
    # Critical Strike
    crit_obj = stats_data.get('melee_crit', stats_data.get('spell_crit', stats_data.get('ranged_crit', {})))
    if isinstance(crit_obj, dict):
        stats['crit_rating'] = crit_obj.get('rating', 0)
        stats['crit_rating_pct'] = crit_obj.get('value', 0)
    else:
        stats['crit_rating'] = 0
        stats['crit_rating_pct'] = 0

    # Haste
    haste_obj = stats_data.get('melee_haste', stats_data.get('spell_haste', stats_data.get('ranged_haste', {})))
    if isinstance(haste_obj, dict):
        stats['haste_rating'] = haste_obj.get('rating', 0)
        stats['haste_rating_pct'] = haste_obj.get('value', 0)
    else:
        stats['haste_rating'] = 0
        stats['haste_rating_pct'] = 0

    # Mastery
    mastery_obj = stats_data.get('mastery', {})
    if isinstance(mastery_obj, dict):
        stats['mastery_rating'] = mastery_obj.get('rating', 0)
        stats['mastery_rating_pct'] = mastery_obj.get('value', 0)
    else:
        stats['mastery_rating'] = 0
        stats['mastery_rating_pct'] = 0

    # Versatility - has different structure (flat values instead of nested)
    vers_rating = stats_data.get('versatility', 0)
    vers_pct = stats_data.get('versatility_damage_done_bonus', 0)

    if isinstance(vers_rating, (int, float)):
        stats['versatility'] = vers_rating
    else:
        stats['versatility'] = 0

    if isinstance(vers_pct, (int, float)):
        stats['versatility_pct'] = vers_pct
    else:
        stats['versatility_pct'] = 0

    # Armor
    armor_obj = stats_data.get('armor', {})
    if isinstance(armor_obj, dict):
        stats['armor'] = armor_obj.get('effective', 0)
    else:
        stats['armor'] = 0

    return stats


def parse_equipment_response(api_data, existing_gear):
    """Parse Blizzard API equipment response into our gear format."""
    if not api_data or 'equipped_items' not in api_data:
        return existing_gear, None

    equipped_avg_ilvl = None

    # Equipment endpoint doesn't include avg ilvl, we calculate manually
    # (Character profile endpoint would have it, but requires extra API call)

    # Clear off_hand first - will be set by either actual OH item or 2H weapon
    existing_gear['off_hand']['ilvl'] = 0
    existing_gear['off_hand']['item_name'] = ''
    existing_gear['off_hand']['item_id'] = 0

    for item in api_data['equipped_items']:
        slot_type = item.get('slot', {}).get('type', '')
        local_slot = SLOT_MAP.get(slot_type)

        if local_slot and local_slot in existing_gear:
            # Extract ilvl - Blizzard API returns {"value": 250, "display_string": "..."}
            ilvl_data = item.get('level', 0)

            # Ensure we only store an integer
            if isinstance(ilvl_data, dict):
                ilvl = ilvl_data.get('value', 0)
            elif isinstance(ilvl_data, (int, float)):
                ilvl = int(ilvl_data)
            else:
                ilvl = 0

            # Extract item details
            item_id = item.get('item', {}).get('id', 0)
            quality = item.get('quality', {}).get('type', 'COMMON')
            sockets = len(item.get('sockets', []))
            enchantments = item.get('enchantments', [])

            # Get media/icon information
            media_obj = item.get('media', {})
            icon_id = media_obj.get('id', 0) if isinstance(media_obj, dict) else 0

            existing_gear[local_slot]['ilvl'] = ilvl
            existing_gear[local_slot]['item_name'] = item.get('name', '')
            existing_gear[local_slot]['item_id'] = item_id
            existing_gear[local_slot]['quality'] = quality
            existing_gear[local_slot]['sockets'] = sockets
            existing_gear[local_slot]['enchanted'] = len(enchantments) > 0
            existing_gear[local_slot]['icon_id'] = icon_id

            # Check if this is a two-handed weapon
            if local_slot == 'main_hand':
                inventory_type = item.get('inventory_type', {})

                if isinstance(inventory_type, dict):
                    inv_type_name = inventory_type.get('type', '')
                else:
                    inv_type_name = str(inventory_type)

                # Handle 2H weapons - they count as both MH and OH for ilvl calculation
                if 'TWOHWEAPON' in inv_type_name or 'TWO_HAND' in inv_type_name or 'TWOHAND' in inv_type_name or 'RANGED' in inv_type_name:
                    # For 2H weapons, duplicate ilvl to off_hand slot
                    existing_gear['off_hand']['ilvl'] = ilvl
                    existing_gear['off_hand']['item_name'] = f"(2H: {item.get('name', '')})"
                    existing_gear['off_hand']['item_id'] = item_id
                    existing_gear['off_hand']['quality'] = quality

    return existing_gear, equipped_avg_ilvl


# Routes

@app.route('/')
def index():
    """Serve the main SPA."""
    return render_template('index.html')


@app.route('/api/data')
def get_data():
    """Return full application data."""
    try:
        data = load_data()
        # Add computed fields
        for char in data['characters']:
            char['avg_ilvl'] = calculate_avg_ilvl(char['gear'])

        current_week = data['meta'].get('current_week', 0)
        data['weekly_target'] = get_weekly_target(current_week)
        data['weekly_crest_cap'] = get_weekly_crest_cap(current_week)
        data['weekly_tasks'] = get_weekly_tasks(current_week)

        return jsonify(data)
    except Exception as e:
        print(f"Error in get_data: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@app.route('/api/meta', methods=['POST'])
def update_meta():
    """Update meta information (week number, etc)."""
    data = load_data()
    updates = request.json

    old_week = data['meta']['current_week']

    if 'current_week' in updates:
        new_week = int(updates['current_week'])
        if 0 <= new_week <= 12:
            data['meta']['current_week'] = new_week

            # Update displayed week values and reset daily tasks when changing weeks
            if new_week != old_week:
                new_week_str = str(new_week)
                for char in data['characters']:
                    # Update collected_this_week to show the new week's value from history
                    for crest_type, crest_data in char['crests'].items():
                        if 'weekly_history' not in crest_data:
                            crest_data['weekly_history'] = {}
                        # Show the value for the new week (0 if not yet tracked)
                        crest_data['collected_this_week'] = crest_data['weekly_history'].get(new_week_str, 0)

                    # Reset daily tasks only
                    char['daily_tasks'] = {}

                    # Initialize weekly_progress for new week if missing
                    if 'weekly_progress' not in char:
                        char['weekly_progress'] = {}
                    if new_week_str not in char['weekly_progress']:
                        char['weekly_progress'][new_week_str] = {
                            'raid_bosses': {'lfr': 0, 'normal': 0, 'heroic': 0, 'mythic': 0},
                            'm_plus_dungeons': [],
                            'highest_delve': 0,
                            'world_vault': [None, None, None]
                        }

                    # Note: Weekly tasks persist and show completion history

    save_data(data)
    return jsonify({'success': True, 'meta': data['meta']})


@app.route('/api/character/<int:char_id>/gear', methods=['POST'])
def update_gear(char_id):
    """Update gear slot (manual override)."""
    data = load_data()
    char = get_character(data, char_id)

    if not char:
        return jsonify({'error': 'Character not found'}), 404

    updates = request.json
    slot = updates.get('slot')

    if slot and slot in char['gear']:
        if 'ilvl' in updates:
            char['gear'][slot]['ilvl'] = int(updates['ilvl'])
        if 'track' in updates:
            char['gear'][slot]['track'] = updates['track']
        if 'item_name' in updates:
            char['gear'][slot]['item_name'] = updates['item_name']

        char['avg_ilvl'] = calculate_avg_ilvl(char['gear'])

    save_data(data)
    return jsonify({'success': True, 'character': char})


@app.route('/api/character/<int:char_id>/crests', methods=['POST'])
def update_crests(char_id):
    """Update crest values - stores weekly history and calculates total automatically."""
    data = load_data()
    char = get_character(data, char_id)

    if not char:
        return jsonify({'error': 'Character not found'}), 404

    updates = request.json
    crest_type = updates.get('crest_type')
    current_week = str(data['meta']['current_week'])  # Convert to string for dict key

    if crest_type and crest_type in char['crests']:
        # Initialize weekly_history if it doesn't exist
        if 'weekly_history' not in char['crests'][crest_type]:
            char['crests'][crest_type]['weekly_history'] = {}

        if 'collected_this_week' in updates:
            new_weekly = max(0, int(updates['collected_this_week']))  # No cap - allow catchup

            # Store in weekly history
            char['crests'][crest_type]['weekly_history'][current_week] = new_weekly

            # Update current week display
            char['crests'][crest_type]['collected_this_week'] = new_weekly

            # Calculate total from all weeks in history
            total = sum(char['crests'][crest_type]['weekly_history'].values())
            char['crests'][crest_type]['total_collected'] = total

    save_data(data)
    return jsonify({'success': True, 'character': char})


@app.route('/api/character/<int:char_id>/profession', methods=['POST'])
def update_profession(char_id):
    """Update profession progress."""
    data = load_data()
    char = get_character(data, char_id)

    if not char:
        return jsonify({'error': 'Character not found'}), 404

    updates = request.json
    profession = updates.get('profession')

    if profession and profession in char['profession_progress']:
        prof = char['profession_progress'][profession]
        if 'weekly_quest' in updates:
            prof['weekly_quest'] = bool(updates['weekly_quest'])
        if 'patron_orders' in updates:
            prof['patron_orders'] = bool(updates['patron_orders'])
        if 'treatise' in updates:
            prof['treatise'] = bool(updates['treatise'])
        if 'knowledge_points' in updates:
            prof['knowledge_points'] = max(0, int(updates['knowledge_points']))
        if 'concentration' in updates:
            prof['concentration'] = max(0, min(1000, int(updates['concentration'])))

    save_data(data)
    return jsonify({'success': True, 'character': char})


@app.route('/api/character/<int:char_id>/tasks', methods=['POST'])
def update_tasks(char_id):
    """Update weekly/daily task completion."""
    data = load_data()
    char = get_character(data, char_id)

    if not char:
        return jsonify({'error': 'Character not found'}), 404

    updates = request.json
    task_type = updates.get('task_type')  # 'weekly' or 'daily'
    task_id = updates.get('task_id')
    done = updates.get('done', False)

    # Initialize tasks if not present
    if 'weekly_tasks' not in char:
        char['weekly_tasks'] = {}
    if 'daily_tasks' not in char:
        char['daily_tasks'] = {}

    current_week = str(data['meta']['current_week'])  # Convert to string for dict key

    # Store completion state
    if task_type == 'weekly':
        if current_week not in char['weekly_tasks']:
            char['weekly_tasks'][current_week] = {}
        char['weekly_tasks'][current_week][task_id] = done
    elif task_type == 'daily':
        char['daily_tasks'][task_id] = done

    save_data(data)
    return jsonify({'success': True})


@app.route('/api/character/<int:char_id>/config', methods=['POST'])
def update_character_config(char_id):
    """Update character configuration (realm, name)."""
    data = load_data()
    char = get_character(data, char_id)

    if not char:
        return jsonify({'error': 'Character not found'}), 404

    updates = request.json

    if 'name' in updates:
        char['name'] = updates['name']
    if 'realm' in updates:
        char['realm'] = updates['realm']
    if 'character_name' in updates:
        char['character_name'] = updates['character_name']

    save_data(data)
    return jsonify({'success': True, 'character': char})


@app.route('/api/blizzard/config', methods=['POST'])
def update_blizzard_config():
    """Save Blizzard API credentials."""
    data = load_data()
    updates = request.json

    if 'use_shared_credentials' in updates:
        data['blizzard_config']['use_shared_credentials'] = updates['use_shared_credentials']
    if 'client_id' in updates:
        data['blizzard_config']['client_id'] = updates['client_id']
    if 'client_secret' in updates:
        data['blizzard_config']['client_secret'] = updates['client_secret']
    if 'region' in updates:
        data['blizzard_config']['region'] = updates['region']

    # Clear cached token when credentials change
    data['blizzard_config']['access_token'] = ''
    data['blizzard_config']['token_expires'] = None

    save_data(data)
    return jsonify({'success': True})


@app.route('/api/character/<int:char_id>/sync', methods=['POST'])
def sync_character(char_id):
    """Sync character gear, avatar, and stats from Blizzard API."""
    try:
        data = load_data()
        char = get_character(data, char_id)

        if not char:
            return jsonify({'error': 'Character not found'}), 404

        if not char.get('realm') or not char.get('character_name'):
            return jsonify({'error': 'Character realm and name not configured'}), 400

        config = data['blizzard_config']

        # Fetch equipment
        api_data, error = fetch_character_equipment(config, char['realm'], char['character_name'])

        if error:
            if '429' in str(error):
                return jsonify({'error': 'Rate limit reached. Consider adding your own API key in Settings for higher limits.'}), 429
            return jsonify({'error': error}), 400

        # Parse and update gear (preserves Track values)
        char['gear'], api_avg_ilvl = parse_equipment_response(api_data, char['gear'])

        # Use API's calculated ilvl if available, otherwise calculate manually
        if api_avg_ilvl is not None:
            char['avg_ilvl'] = round(api_avg_ilvl, 1)
        else:
            char['avg_ilvl'] = calculate_avg_ilvl(char['gear'])

        # Fetch character profile (class, level)
        profile_data, _ = fetch_character_profile(config, char['realm'], char['character_name'])
        if profile_data:
            char['class'] = profile_data.get('class', '')
            char['level'] = profile_data.get('level', 0)

        # Fetch character media (avatar)
        avatar_url, _ = fetch_character_media(config, char['realm'], char['character_name'])
        if avatar_url:
            char['avatar_url'] = avatar_url

        # Fetch character stats
        stats_data, _ = fetch_character_stats(config, char['realm'], char['character_name'])
        if stats_data:
            char['stats'] = parse_character_stats(stats_data)

        char['last_gear_sync'] = datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z')

        # BiS auto-check: mark matching items as obtained
        synced_item_ids = set()
        for slot_data in char['gear'].values():
            iid = slot_data.get('item_id')
            if iid:
                synced_item_ids.add(int(iid))
        for bis_item in char.get('bis_list', []):
            if bis_item.get('item_id') and int(bis_item['item_id']) in synced_item_ids:
                bis_item['obtained'] = True
                bis_item['synced'] = True

        # Save updated token if refreshed
        save_data(data)

        return jsonify({'success': True, 'character': char})
    except Exception as e:
        return jsonify({'error': f'Sync failed: {str(e)}'}), 500


@app.route('/api/sync-all', methods=['POST'])
def sync_all_characters():
    """Sync all characters from Blizzard API."""
    data = load_data()
    config = data['blizzard_config']

    results = []
    for char in data['characters']:
        try:
            if char.get('realm') and char.get('character_name'):
                # Fetch equipment
                api_data, error = fetch_character_equipment(config, char['realm'], char['character_name'])

                if error:
                    if '429' in str(error):
                        results.append({'id': char['id'], 'name': char['name'], 'success': False, 'error': 'Rate limit reached. Consider adding your own API key in Settings for higher limits.'})
                    else:
                        results.append({'id': char['id'], 'name': char['name'], 'success': False, 'error': error})
                else:
                    char['gear'], api_avg_ilvl = parse_equipment_response(api_data, char['gear'])

                    # Use API's calculated ilvl if available, otherwise calculate manually
                    if api_avg_ilvl is not None:
                        char['avg_ilvl'] = round(api_avg_ilvl, 1)
                    else:
                        char['avg_ilvl'] = calculate_avg_ilvl(char['gear'])

                    # Fetch profile (class, level)
                    profile_data, _ = fetch_character_profile(config, char['realm'], char['character_name'])
                    if profile_data:
                        char['class'] = profile_data.get('class', '')
                        char['level'] = profile_data.get('level', 0)

                    # Fetch avatar
                    avatar_url, _ = fetch_character_media(config, char['realm'], char['character_name'])
                    if avatar_url:
                        char['avatar_url'] = avatar_url

                    # Fetch stats
                    stats_data, _ = fetch_character_stats(config, char['realm'], char['character_name'])
                    if stats_data:
                        char['stats'] = parse_character_stats(stats_data)

                    char['last_gear_sync'] = datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z')

                    # BiS auto-check: mark matching items as obtained
                    synced_item_ids = set()
                    for slot_data in char['gear'].values():
                        iid = slot_data.get('item_id')
                        if iid:
                            synced_item_ids.add(int(iid))
                    for bis_item in char.get('bis_list', []):
                        if bis_item.get('item_id') and int(bis_item['item_id']) in synced_item_ids:
                            bis_item['obtained'] = True
                            bis_item['synced'] = True

                    results.append({'id': char['id'], 'name': char['name'], 'success': True})
            else:
                results.append({'id': char['id'], 'name': char['name'], 'success': False, 'error': 'Not configured'})
        except Exception as e:
            results.append({'id': char['id'], 'name': char['name'], 'success': False, 'error': f'Sync error: {str(e)}'})

    save_data(data)
    return jsonify({'success': True, 'results': results})


@app.route('/api/reset-daily', methods=['POST'])
def reset_daily():
    """Reset daily tasks for all characters."""
    data = load_data()

    for char in data['characters']:
        char['daily_tasks'] = {}

    save_data(data)
    return jsonify({'success': True})


@app.route('/api/characters', methods=['POST'])
def add_character():
    """Add a new character."""
    data = load_data()
    req_data = request.json

    # Get next available ID
    max_id = max([char['id'] for char in data['characters']], default=0)
    new_id = max_id + 1

    professions = req_data.get('professions', [])

    # Create new character with complete structure
    new_char = {
        'id': new_id,
        'name': req_data.get('name', f'Character {new_id}'),
        'realm': req_data.get('realm', ''),
        'character_name': req_data.get('character_name', ''),
        'professions': professions,
        'gear': {
            slot: {
                'ilvl': 0,
                'track': 'Adventurer',
                'item_name': '',
                'item_id': 0,
                'quality': 'COMMON',
                'sockets': 0,
                'enchanted': False
            }
            for slot in ['head', 'neck', 'shoulder', 'back', 'chest', 'wrist',
                        'hands', 'waist', 'legs', 'feet', 'ring1', 'ring2',
                        'trinket1', 'trinket2', 'main_hand', 'off_hand']
        },
        'avg_ilvl': 0,
        'crests': {
            'weathered': {'collected_this_week': 0, 'total_collected': 0, 'weekly_history': {}},
            'carved': {'collected_this_week': 0, 'total_collected': 0, 'weekly_history': {}},
            'runed': {'collected_this_week': 0, 'total_collected': 0, 'weekly_history': {}},
            'gilded': {'collected_this_week': 0, 'total_collected': 0, 'weekly_history': {}}
        },
        'profession_progress': init_profession_progress(professions),
        'weekly_tasks': {},
        'daily_tasks': {},
        'last_gear_sync': None,
        'avatar_url': None,
        'stats': {},
        'class': '',
        'level': 0,
        'order': new_id,  # Default order matches ID
        'weekly_progress': {},
        'bis_list': [],
        'talent_builds': []
    }

    data['characters'].append(new_char)
    save_data(data)

    return jsonify({'success': True, 'character': new_char})


@app.route('/api/characters/<int:char_id>', methods=['DELETE'])
def delete_character(char_id):
    """Delete a character."""
    data = load_data()

    # Find and remove character
    data['characters'] = [char for char in data['characters'] if char['id'] != char_id]

    save_data(data)
    return jsonify({'success': True})


@app.route('/api/characters/reorder', methods=['POST'])
def reorder_characters():
    """Update character display order."""
    data = load_data()
    new_order = request.json.get('order', [])

    # Create a mapping of character ID to new order index
    order_map = {char_id: idx for idx, char_id in enumerate(new_order)}

    # Update each character's order field
    for char in data['characters']:
        if char['id'] in order_map:
            char['order'] = order_map[char['id']]

    save_data(data)
    return jsonify({'success': True})


@app.route('/api/characters/<int:char_id>/professions', methods=['PUT'])
def update_character_professions(char_id):
    """Update professions for a character."""
    data = load_data()
    req_data = request.json

    char = get_character(data, char_id)
    if not char:
        return jsonify({'success': False, 'error': 'Character not found'}), 404

    new_professions = req_data.get('professions', [])
    old_professions = char.get('professions', [])

    # Update professions list
    char['professions'] = new_professions

    # Update profession_progress: keep existing progress, add new professions
    if 'profession_progress' not in char:
        char['profession_progress'] = {}

    # Add new professions
    for prof in new_professions:
        if prof and prof not in char['profession_progress']:
            char['profession_progress'][prof] = {
                'weekly_quest': False,
                'patron_orders': False,
                'treatise': False,
                'knowledge_points': 0,
                'concentration': 1000
            }

    # Remove old professions that are no longer selected
    for prof in list(char['profession_progress'].keys()):
        if prof not in new_professions:
            del char['profession_progress'][prof]

    save_data(data)

    return jsonify({'success': True, 'character': char})


@app.route('/api/item/<int:item_id>/icon', methods=['GET'])
def get_item_icon(item_id):
    """Get item icon URL from Blizzard API."""
    try:
        data = load_data()
        config = data['blizzard_config']

        icon_url = fetch_item_media(config, item_id)

        if icon_url:
            return jsonify({'success': True, 'icon_url': icon_url})
        else:
            return jsonify({'success': False, 'error': 'Icon not found'}), 404
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/character/<int:char_id>/weekly-progress', methods=['POST'])
def update_weekly_progress(char_id):
    """Update weekly progress (raid, M+, delve, world vault)."""
    data = load_data()
    char = get_character(data, char_id)
    if not char:
        return jsonify({'error': 'Character not found'}), 404

    current_week = str(data['meta'].get('current_week', 0))
    if 'weekly_progress' not in char:
        char['weekly_progress'] = {}
    if current_week not in char['weekly_progress']:
        char['weekly_progress'][current_week] = {
            'raid_bosses': {'lfr': 0, 'normal': 0, 'heroic': 0, 'mythic': 0},
            'm_plus_dungeons': [],
            'highest_delve': 0,
            'world_vault': [None, None, None]
        }

    updates = request.json
    wp = char['weekly_progress'][current_week]

    if 'raid_bosses' in updates:
        for diff in ['lfr', 'normal', 'heroic', 'mythic']:
            if diff in updates['raid_bosses']:
                wp['raid_bosses'][diff] = max(0, int(updates['raid_bosses'][diff]))
    if 'm_plus_dungeons' in updates:
        wp['m_plus_dungeons'] = updates['m_plus_dungeons'][:8]
    if 'highest_delve' in updates:
        wp['highest_delve'] = max(0, int(updates['highest_delve']))
    if 'world_vault' in updates:
        wp['world_vault'] = updates['world_vault'][:3]

    save_data(data)
    return jsonify({'success': True, 'weekly_progress': char['weekly_progress']})


@app.route('/api/character/<int:char_id>/bis', methods=['POST'])
def add_bis_item(char_id):
    """Add a BiS item to a character."""
    data = load_data()
    char = get_character(data, char_id)
    if not char:
        return jsonify({'error': 'Character not found'}), 404

    if 'bis_list' not in char:
        char['bis_list'] = []

    req_data = request.json
    slot = req_data.get('slot', '')
    item_name = req_data.get('item_name', '')

    if not slot or not item_name:
        return jsonify({'error': 'Slot and item name are required'}), 400

    max_id = max([item['id'] for item in char['bis_list']], default=0)
    new_item = {
        'id': max_id + 1,
        'slot': slot,
        'item_name': item_name,
        'item_id': int(req_data['item_id']) if req_data.get('item_id') else None,
        'target_ilvl': int(req_data['target_ilvl']) if req_data.get('target_ilvl') else None,
        'obtained': False,
        'synced': False
    }

    char['bis_list'].append(new_item)
    save_data(data)
    return jsonify({'success': True, 'item': new_item})


@app.route('/api/character/<int:char_id>/bis/<int:bis_id>', methods=['PUT'])
def update_bis_item(char_id, bis_id):
    """Update a BiS item (toggle obtained, edit fields)."""
    data = load_data()
    char = get_character(data, char_id)
    if not char:
        return jsonify({'error': 'Character not found'}), 404

    bis_item = next((item for item in char.get('bis_list', []) if item['id'] == bis_id), None)
    if not bis_item:
        return jsonify({'error': 'BiS item not found'}), 404

    updates = request.json
    if 'obtained' in updates:
        bis_item['obtained'] = bool(updates['obtained'])
        if not updates['obtained']:
            bis_item['synced'] = False
    if 'item_name' in updates:
        bis_item['item_name'] = updates['item_name']
    if 'item_id' in updates:
        bis_item['item_id'] = int(updates['item_id']) if updates['item_id'] else None
    if 'target_ilvl' in updates:
        bis_item['target_ilvl'] = int(updates['target_ilvl']) if updates['target_ilvl'] else None

    save_data(data)
    return jsonify({'success': True, 'item': bis_item})


@app.route('/api/character/<int:char_id>/bis/<int:bis_id>', methods=['DELETE'])
def delete_bis_item(char_id, bis_id):
    """Delete a BiS item."""
    data = load_data()
    char = get_character(data, char_id)
    if not char:
        return jsonify({'error': 'Character not found'}), 404

    char['bis_list'] = [item for item in char.get('bis_list', []) if item['id'] != bis_id]
    save_data(data)
    return jsonify({'success': True})


@app.route('/api/character/<int:char_id>/talents', methods=['POST'])
def add_talent_build(char_id):
    """Add a talent build to a character."""
    data = load_data()
    char = get_character(data, char_id)
    if not char:
        return jsonify({'error': 'Character not found'}), 404

    if 'talent_builds' not in char:
        char['talent_builds'] = []

    req_data = request.json
    category = req_data.get('category', '')
    name = req_data.get('name', '')

    if not category or not name:
        return jsonify({'error': 'Category and name are required'}), 400

    max_id = max([build['id'] for build in char['talent_builds']], default=0)
    new_build = {
        'id': max_id + 1,
        'category': category,
        'name': name,
        'description': req_data.get('description', ''),
        'talent_string': req_data.get('talent_string', '')
    }

    char['talent_builds'].append(new_build)
    save_data(data)
    return jsonify({'success': True, 'build': new_build})


@app.route('/api/character/<int:char_id>/talents/<int:talent_id>', methods=['PUT'])
def update_talent_build(char_id, talent_id):
    """Update a talent build."""
    data = load_data()
    char = get_character(data, char_id)
    if not char:
        return jsonify({'error': 'Character not found'}), 404

    build = next((b for b in char.get('talent_builds', []) if b['id'] == talent_id), None)
    if not build:
        return jsonify({'error': 'Talent build not found'}), 404

    updates = request.json
    if 'name' in updates:
        build['name'] = updates['name']
    if 'description' in updates:
        build['description'] = updates['description']
    if 'talent_string' in updates:
        build['talent_string'] = updates['talent_string']
    if 'category' in updates:
        build['category'] = updates['category']

    save_data(data)
    return jsonify({'success': True, 'build': build})


@app.route('/api/character/<int:char_id>/talents/<int:talent_id>', methods=['DELETE'])
def delete_talent_build(char_id, talent_id):
    """Delete a talent build."""
    data = load_data()
    char = get_character(data, char_id)
    if not char:
        return jsonify({'error': 'Character not found'}), 404

    char['talent_builds'] = [b for b in char.get('talent_builds', []) if b['id'] != talent_id]
    save_data(data)
    return jsonify({'success': True})


@app.route('/api/debug/character/<int:char_id>/stats', methods=['GET'])
def debug_character_stats(char_id):
    """Debug endpoint to see raw stats API response."""
    try:
        data = load_data()
        char = get_character(data, char_id)

        if not char:
            return jsonify({'error': 'Character not found'}), 404

        if not char.get('realm') or not char.get('character_name'):
            return jsonify({'error': 'Character not configured'}), 400

        config = data['blizzard_config']
        stats_data, error = fetch_character_stats(config, char['realm'], char['character_name'])

        if error:
            return jsonify({'error': error}), 400

        # Return raw API response for debugging
        return jsonify({
            'character': char['name'],
            'raw_stats_response': stats_data,
            'parsed_stats': parse_character_stats(stats_data)
        })
    except Exception as e:
        return jsonify({'error': f'Debug failed: {str(e)}'}), 500


if __name__ == '__main__':
    app.run(debug=True, port=5000)
