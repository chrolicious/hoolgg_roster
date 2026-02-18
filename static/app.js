// Warband HQ - Frontend Logic

let appData = null;
let saveTimeout = null;
let dashboardState = { currentView: 'overview', selectedCharId: null };
let draggedCard = null;

// WoW Class Colors
const CLASS_COLORS = {
    'Death Knight': '#C41F3B',
    'Demon Hunter': '#A330C9',
    'Druid': '#FF7D0A',
    'Evoker': '#33937F',
    'Hunter': '#ABD473',
    'Mage': '#69CCF0',
    'Monk': '#00FF96',
    'Paladin': '#F58CBA',
    'Priest': '#FFFFFF',
    'Rogue': '#FFF569',
    'Shaman': '#0070DE',
    'Warlock': '#9482C9',
    'Warrior': '#C79C6E'
};

function getClassColor(className) {
    return CLASS_COLORS[className] || 'var(--hool-primary-blue)';
}

// Shared Blizzard API Credentials (not exposed in UI)
const SHARED_BLIZZARD_CREDENTIALS = {
    client_id: 'df5ff56a63e5473197b78704bc50e25d',
    client_secret: 'zlZpz6ArhOtH8ZRuDh8Yf43t6YwMpuPm'
};

// Crest Icons - Using reliable fallback icons
const CREST_ICONS = {
    weathered: [
        'https://wow.zamimg.com/images/wow/icons/medium/inv_misc_stonetablet_11.jpg',
        'https://wow.zamimg.com/images/wow/icons/large/inv_misc_stonetablet_11.jpg',
        'https://wow.zamimg.com/images/wow/icons/medium/inv_stone_weightstone_03.jpg'
    ],
    carved: [
        'https://wow.zamimg.com/images/wow/icons/medium/inv_misc_gem_azuredraenite_02.jpg',
        'https://wow.zamimg.com/images/wow/icons/large/inv_misc_gem_azuredraenite_02.jpg',
        'https://wow.zamimg.com/images/wow/icons/medium/inv_jewelcrafting_gem_22.jpg'
    ],
    runed: [
        'https://wow.zamimg.com/images/wow/icons/medium/inv_misc_rune_10.jpg',
        'https://wow.zamimg.com/images/wow/icons/large/inv_misc_rune_10.jpg',
        'https://wow.zamimg.com/images/wow/icons/medium/spell_arcane_teleportironforge.jpg'
    ],
    gilded: [
        'https://wow.zamimg.com/images/wow/icons/medium/inv_misc_gem_goldendraenite_02.jpg',
        'https://wow.zamimg.com/images/wow/icons/large/inv_misc_gem_goldendraenite_02.jpg',
        'https://wow.zamimg.com/images/wow/icons/medium/inv_jewelcrafting_70_gem01_cut_yellow.jpg'
    ]
};

function getCrestIcon(crestType) {
    const urls = CREST_ICONS[crestType];
    return urls ? urls[0] : '';
}

function handleCrestIconError(img, crestType) {
    const urls = CREST_ICONS[crestType];
    if (!urls) return;

    const currentUrl = img.src;
    const currentIndex = urls.indexOf(currentUrl);

    if (currentIndex < urls.length - 1) {
        img.src = urls[currentIndex + 1];
    } else {
        img.style.display = 'none';
    }
}

// Initialize window controls (Electron only)
function initWindowControls() {
    // Check if running in Electron
    if (window.electron) {
        const windowControls = document.getElementById('windowControls');
        if (windowControls) {
            windowControls.style.display = 'flex';

            // Wire up buttons
            document.getElementById('minimizeBtn').addEventListener('click', () => {
                window.electron.minimizeWindow();
            });

            document.getElementById('maximizeBtn').addEventListener('click', () => {
                window.electron.maximizeWindow();
            });

            document.getElementById('closeBtn').addEventListener('click', () => {
                window.electron.closeWindow();
            });
        }
    }
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    initWindowControls();
    loadData().then(() => {
        // Start tour on first visit
        if (!localStorage.getItem('tourCompleted')) {
            setTimeout(startTour, 1000); // Delay to let UI settle
        }
    });
    setupTabs();
    setupEventListeners();
});

// Load data from API
async function loadData() {
    try {
        const response = await fetch('/api/data');
        appData = await response.json();
        renderAll();
        loadItemIcons();
    } catch (error) {
        console.error('Failed to load data:', error);
        showSaveIndicator('Error loading data', 'error');
    }
}

// Load item icons dynamically from Blizzard API with caching
async function loadItemIcons() {
    const iconElements = document.querySelectorAll('.gear-item-icon[data-item-id]');
    const iconCache = JSON.parse(localStorage.getItem('itemIconCache') || '{}');
    let cacheUpdated = false;

    for (const img of iconElements) {
        const itemId = img.dataset.itemId;
        if (!itemId || itemId === '0') continue;

        // Check cache first
        if (iconCache[itemId]) {
            img.src = iconCache[itemId];
            img.style.display = 'block';
            continue;
        }

        // Fetch from API if not cached
        try {
            const response = await fetch(`/api/item/${itemId}/icon`);
            const result = await response.json();

            if (result.success && result.icon_url) {
                img.src = result.icon_url;
                img.style.display = 'block';
                iconCache[itemId] = result.icon_url;
                cacheUpdated = true;
            } else {
                // Try Wowhead fallback
                const fallbackUrl = `https://wow.zamimg.com/images/wow/icons/medium/${itemId}.jpg`;
                img.src = fallbackUrl;
                iconCache[itemId] = fallbackUrl;
                cacheUpdated = true;
            }
        } catch (error) {
            // Try Wowhead fallback on error
            const fallbackUrl = `https://wow.zamimg.com/images/wow/icons/medium/${itemId}.jpg`;
            img.src = fallbackUrl;
            iconCache[itemId] = fallbackUrl;
            cacheUpdated = true;
        }
    }

    // Save updated cache to localStorage
    if (cacheUpdated) {
        localStorage.setItem('itemIconCache', JSON.stringify(iconCache));
    }
}

// Setup tab switching
function setupTabs() {
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.dataset.tab;
            switchTab(tabName);
        });
    });
}

function switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    // Update views
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById(tabName).classList.add('active');

    // Render gear guide when tab is active
    if (tabName === 'gear-guide') renderGearGuide();
}

// Setup global event listeners
function setupEventListeners() {

    // Sync all button (handled in renderDashboard since it's dynamic)

    // Shared credentials toggle
    document.getElementById('useSharedCredentials').addEventListener('change', toggleCredentialsMode);

    // Save API config
    document.getElementById('saveApiConfig').addEventListener('click', saveApiConfig);

    // Reset daily
    document.getElementById('resetDailyBtn').addEventListener('click', resetDaily);

    // Restart tour
    document.getElementById('restartTourBtn')?.addEventListener('click', () => {
        // Switch to dashboard tab first
        const dashboardTab = document.querySelector('.tab[data-tab="dashboard"]');
        if (dashboardTab) {
            dashboardTab.click();
        }
        // Start tour after a short delay
        setTimeout(() => {
            if (typeof startTour === 'function') {
                startTour();
            }
        }, 500);
    });
}

// Render all views
function renderAll() {
    renderDashboard();
    renderSettings();
}

// Gear Guide
function renderGearGuide() {
    const container = document.getElementById('gearGuideContent');
    if (!container) return;

    // Track colors
    const TRACK_COLORS = {
        'Adventurer': '#9CA3AF',
        'Veteran':    '#4ADE80',
        'Champion':   '#60A5FA',
        'Hero':       '#C084FC',
        'Mythic':     '#FCD34D'
    };

    // Full ilvl per rank per track
    const TRACKS = [
        {
            name: 'Adventurer',
            crests: 'Weathered Dawncrests',
            ranks: [
                { rank: '1/6', ilvl: 210 }, { rank: '2/6', ilvl: 213 },
                { rank: '3/6', ilvl: 216 }, { rank: '4/6', ilvl: 220 },
                { rank: '5/6', ilvl: 223 }, { rank: '6/6', ilvl: 226 }
            ],
            sources: [
                { content: 'World Quests', detail: 'Varies by zone' },
                { content: 'Low-level Delves', detail: 'Tier 1–4' },
            ]
        },
        {
            name: 'Veteran',
            crests: 'Carved Dawncrests',
            ranks: [
                { rank: '1/6', ilvl: 226 }, { rank: '2/6', ilvl: 229 },
                { rank: '3/6', ilvl: 233 }, { rank: '4/6', ilvl: 236 },
                { rank: '5/6', ilvl: 239 }, { rank: '6/6', ilvl: 242 }
            ],
            sources: [
                { content: 'M0 Dungeons (Pre-Season)', detail: 'Drops at 3/6 Veteran (233)' },
                { content: 'Delves (Tier 5–8)', detail: 'Veteran gear' },
                { content: 'Crafting (Carved Crests)', detail: '5/6 Veteran for 60 crests' },
            ]
        },
        {
            name: 'Champion',
            crests: 'Runed Dawncrests',
            ranks: [
                { rank: '1/6', ilvl: 242 }, { rank: '2/6', ilvl: 246 },
                { rank: '3/6', ilvl: 249 }, { rank: '4/6', ilvl: 252 },
                { rank: '5/6', ilvl: 255 }, { rank: '6/6', ilvl: 259 }
            ],
            note: '6/6 Champion ≈ 2/6 Hero — weaker than previous seasons',
            sources: [
                { content: 'M0 Dungeons (Season Week 1+)', detail: '1/6 Champion (242)' },
                { content: 'World Boss', detail: '2/6 Champion (246)' },
                { content: 'Normal Raid', detail: 'Champion track' },
                { content: 'Crafting (Runed Crests)', detail: '5/6 Champion for 60 crests' },
            ]
        },
        {
            name: 'Hero',
            crests: 'Gilded Dawncrests',
            ranks: [
                { rank: '1/6', ilvl: 259 }, { rank: '2/6', ilvl: 262 },
                { rank: '3/6', ilvl: 266 }, { rank: '4/6', ilvl: 269 },
                { rank: '5/6', ilvl: 272 }, { rank: '6/6', ilvl: 276 }
            ],
            note: 'Do NOT spend Hero crests until after full raid reclear on Week 3',
            sources: [
                { content: 'Heroic Raid', detail: 'Hero track drops' },
                { content: 'M+8', detail: '2/6 Hero' },
                { content: 'M+10', detail: '3/6 Hero (266)' },
                { content: 'Bountiful Delves (coffer key)', detail: 'Hero item weekly' },
                { content: 'Prey Quest', detail: '1 Hero item per week (alt: Delves)' },
                { content: 'Great Vault (M+)', detail: 'Hero/Myth depending on key' },
                { content: 'Crafting (Gilded Crests)', detail: '5/6 Hero for 60 crests' },
            ]
        },
        {
            name: 'Mythic',
            crests: 'Gilded Dawncrests (Myth)',
            ranks: [
                { rank: '1/6', ilvl: 272 }, { rank: '2/6', ilvl: 276 },
                { rank: '3/6', ilvl: 279 }, { rank: '4/6', ilvl: 282 },
                { rank: '5/6', ilvl: 285 }, { rank: '6/6', ilvl: 289 }
            ],
            note: 'Crafting at 5/6 costs 60 Myth crests — far better value than fully upgrading raid drops',
            sources: [
                { content: 'Mythic Raid', detail: 'Mythic track drops' },
                { content: 'Great Vault (Raid)', detail: '1/6 Mythic (272) — upgrade after crafting' },
                { content: 'Crafting (Myth Crests)', detail: '5/6 Mythic (285) for 60 crests — craft weapons first' },
            ]
        }
    ];

    // Upgrade cost table (same for all tracks)
    const UPGRADE_COSTS = [
        { step: '1/6 → 2/6', crests: 10, total: 10 },
        { step: '2/6 → 3/6', crests: 20, total: 30 },
        { step: '3/6 → 4/6', crests: 30, total: 60 },
        { step: '4/6 → 5/6', crests: 40, total: 100 },
        { step: '5/6 → 6/6', crests: 50, total: 150 },
    ];

    container.innerHTML = `
        <div class="gear-guide-tracks-grid">
            ${TRACKS.map(track => {
                const color = TRACK_COLORS[track.name];
                return `
                <div class="gear-guide-track-card">
                    <div class="gear-guide-card-header">
                        <span class="gear-guide-card-badge" style="background: ${color}22; color: ${color}; border-color: ${color}44">${track.name}</span>
                    </div>
                    ${track.note ? `<div class="gear-guide-card-note">${track.note}</div>` : ''}
                    <div class="gear-guide-card-crests">
                        <span class="gear-guide-crests-label">${track.crests}</span>
                    </div>
                    <div class="gear-guide-card-ilvls">
                        ${track.ranks.map(r => `
                            <div class="gear-guide-rank-compact" style="color: ${color}">
                                <span class="ilvl-num">${r.ilvl}</span>
                                <span class="rank-label">${r.rank}</span>
                            </div>
                        `).join('')}
                    </div>
                    <div class="gear-guide-card-sources">
                        ${track.sources.slice(0, 3).map(s => `
                            <div class="gear-guide-source-compact">
                                <span class="source-name">${s.content}</span>
                                <span class="source-detail">${s.detail}</span>
                            </div>
                        `).join('')}
                        ${track.sources.length > 3 ? `<div class="source-more">+${track.sources.length - 3} more</div>` : ''}
                    </div>
                </div>`;
            }).join('')}
        </div>

        <div class="gear-guide-section">
            <div class="gear-guide-section-header">
                <h4>Upgrade Costs & Weekly Cap</h4>
                <span class="gear-guide-section-hint">Weekly cap: <strong>100 crests</strong> · Crafting: <strong>60 crests at 5/6</strong></span>
            </div>
            <div class="gear-guide-upgrade-table-wrap">
                <table class="gear-guide-upgrade-table">
                    <thead>
                        <tr>
                            <th>Upgrade</th>
                            <th>Crests</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${UPGRADE_COSTS.map(u => `
                            <tr>
                                <td>${u.step}</td>
                                <td>${u.crests}</td>
                                <td>${u.total} / 150</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

// Week names for timeline
const WEEK_NAMES = [
    'Pre-Season', 'Heroic Week', 'Mythic+ Opens', 'Final Raid Opens',
    'Steady Progression', 'Week 5', 'Week 6', 'Week 7',
    'Week 8', 'Week 9 Optimization', 'Week 10', 'Week 11 Refinement', 'Week 12 Completion'
];

// Vault ilvl lookup tables (by week number)
const RAID_DIFF_ILVL = {
    lfr:    [215,220,222,225,227,230,232,235,238,240,245,250,255],
    normal: [220,230,232,235,238,240,242,245,248,250,255,260,265],
    heroic: [225,240,243,245,248,250,253,255,258,260,265,270,275],
    mythic: [230,250,253,255,258,260,263,265,268,270,275,278,280]
};
const MPLUS_KEY_ILVL = [220,222,224,226,228,230,232,234,236,238,240,242,244,246,248,250,252,254,256,258,260];

function calculateVaultSlots(weeklyProgress, currentWeek) {
    const wp = weeklyProgress || {};
    const weekStr = String(currentWeek);
    const data = wp[weekStr] || { raid_bosses: {lfr:0,normal:0,heroic:0,mythic:0}, m_plus_dungeons: [], highest_delve: 0, world_vault: [null,null,null] };

    // Raid: flatten kills by difficulty (highest first)
    const raidKills = [];
    for (const diff of ['mythic','heroic','normal','lfr']) {
        const count = data.raid_bosses[diff] || 0;
        const ilvl = RAID_DIFF_ILVL[diff] ? (RAID_DIFF_ILVL[diff][Math.min(currentWeek, 12)] || 230) : 230;
        for (let i = 0; i < count; i++) raidKills.push({ label: diff.charAt(0).toUpperCase() + diff.slice(1), ilvl });
    }
    const raidSlots = [
        raidKills.length >= 1 ? raidKills[0] : null,
        raidKills.length >= 4 ? raidKills[3] : null,
        raidKills.length >= 7 ? raidKills[6] : null
    ];

    // Dungeon: sort M+ by key level desc
    const mplus = (data.m_plus_dungeons || []).slice().sort((a, b) => (b.key_level || 0) - (a.key_level || 0));
    const dunSlots = [
        mplus.length >= 1 ? { label: `+${mplus[0].key_level}`, ilvl: MPLUS_KEY_ILVL[Math.min(mplus[0].key_level || 0, MPLUS_KEY_ILVL.length - 1)] } : null,
        mplus.length >= 4 ? { label: `+${mplus[3].key_level}`, ilvl: MPLUS_KEY_ILVL[Math.min(mplus[3].key_level || 0, MPLUS_KEY_ILVL.length - 1)] } : null,
        mplus.length >= 7 ? { label: `+${mplus[6].key_level}`, ilvl: MPLUS_KEY_ILVL[Math.min(mplus[6].key_level || 0, MPLUS_KEY_ILVL.length - 1)] } : null
    ];

    // World vault: pass through manual entries
    const worldSlots = (data.world_vault || [null, null, null]).map(v => v ? { label: 'World', ilvl: v } : null);

    return { raid: raidSlots, dungeon: dunSlots, world: worldSlots };
}

function renderVaultGrid(vault) {
    const tracks = [
        { key: 'raid', label: 'Raid' },
        { key: 'dungeon', label: 'Dungeon' },
        { key: 'world', label: 'World' }
    ];
    return tracks.map(track => {
        const slots = vault[track.key] || [null, null, null];
        return `<div class="vault-row">
            <div class="vault-track-label">${track.label}</div>
            ${slots.map(slot => slot
                ? `<div class="vault-slot vault-slot-filled" title="${slot.label} (${slot.ilvl} ilvl)">${slot.ilvl}</div>`
                : `<div class="vault-slot vault-slot-empty">—</div>`
            ).join('')}
        </div>`;
    }).join('');
}

function navigateToDetail(charId) {
    dashboardState.currentView = 'detail';
    dashboardState.selectedCharId = charId;
    renderDashboard();
}

function navigateToOverview() {
    dashboardState.currentView = 'overview';
    dashboardState.selectedCharId = null;
    renderDashboard();
}

// Reset timing helpers
function getResetInfo() {
    const region = appData.blizzard_config?.region || 'us';
    const resetDay = (region === 'us') ? 2 : 3; // Tue=2, Wed=3
    const resetDayName = (region === 'us') ? 'Tuesday' : 'Wednesday';
    const today = new Date().getDay();
    let daysUntilReset = (resetDay - today + 7) % 7;
    if (daysUntilReset === 0) daysUntilReset = 7; // same day = next week
    return { daysUntilReset, resetDayName };
}

function getDailyPaceSuggestion(remaining, daysUntilReset) {
    if (remaining === 0) return 'done';
    if (daysUntilReset <= 0) return String(remaining);
    const low = Math.floor(remaining / daysUntilReset);
    const high = Math.ceil(remaining / daysUntilReset);
    return low === high ? String(low) : `${low}-${high}`;
}

// Dashboard — routes between overview and detail
function renderDashboard() {
    const container = document.getElementById('dashboard');
    if (!container) return;

    if (dashboardState.currentView === 'detail' && dashboardState.selectedCharId != null) {
        const char = appData.characters.find(c => c.id === dashboardState.selectedCharId);
        if (char) {
            renderDetailView(container, char);
        } else {
            navigateToOverview();
        }
    } else {
        renderOverviewGrid(container);
    }
}

function renderOverviewGrid(container) {
    container.innerHTML = `
        <div class="dashboard-breadcrumb">
            <span class="breadcrumb-item active">Dashboard</span>
        </div>
        <div class="dashboard-grid" id="dashboardGrid"></div>
    `;
    const grid = document.getElementById('dashboardGrid');

    if (appData.characters.length === 0) {
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-state';
        emptyState.innerHTML = `
            <div class="empty-state-icon"><img src="/static/cool-doge.gif" alt="Cool Doge" /></div>
            <h3>No Characters Added Yet</h3>
            <p>Get started by adding your WoW characters!</p>
            <button class="btn-primary" onclick="addCharacter()">Add Character</button>
        `;
        grid.appendChild(emptyState);
        return;
    }

    appData.characters.forEach(char => {
        grid.appendChild(createCompactCard(char));
    });

    // Add Character card (always last, not draggable)
    const addCard = document.createElement('div');
    addCard.className = 'add-character-card';
    addCard.innerHTML = `
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="16"/>
            <line x1="8" y1="12" x2="16" y2="12"/>
        </svg>
        <span>Add Character</span>
    `;
    addCard.addEventListener('click', () => addCharacter());
    grid.appendChild(addCard);

    // Setup drag-and-drop on character cards only
    grid.querySelectorAll('.character-card-compact').forEach(card => setupDragAndDrop(card));
}

function createCompactCard(char) {
    const card = document.createElement('div');
    card.className = 'character-card-compact';
    card.draggable = true;
    card.dataset.charId = char.id;

    const delta = char.avg_ilvl - appData.weekly_target;
    const deltaClass = delta >= 0 ? 'positive' : 'negative';
    const deltaSign = delta >= 0 ? '+' : '';
    const avatarUrl = char.avatar_url || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="48" height="48"%3E%3Crect fill="%232a2a2a"/%3E%3C/svg%3E';
    const classColor = getClassColor(char.class);

    // Task counts
    const currentWeek = String(appData.meta.current_week);
    const weeklyTasks = appData.weekly_tasks?.weekly || [];
    const weeklyCompleted = weeklyTasks.filter(t => {
        const charWeekly = char.weekly_tasks[currentWeek] || {};
        return charWeekly[t.id];
    }).length;

    // Vault
    const vault = calculateVaultSlots(char.weekly_progress, appData.meta.current_week);

    // Crest summary
    const crestTypes = ['weathered', 'carved', 'runed', 'gilded'];
    const crestHtml = crestTypes.map(type => {
        const crest = char.crests[type] || { collected_this_week: 0 };
        const isCapped = crest.collected_this_week >= 90;
        return `<span class="compact-crest ${isCapped ? 'capped' : ''}">${crest.collected_this_week}<span class="compact-crest-max">/90</span></span>`;
    }).join('');

    // Profession summary
    const profSummary = char.professions.filter(p => p).map(p => {
        const prog = char.profession_progress?.[p] || {};
        const done = prog.weekly_quest && prog.patron_orders && prog.treatise;
        return `<span class="compact-prof">${p} ${done ? '✓' : '○'}</span>`;
    }).join(' | ');

    const pct = weeklyTasks.length > 0
        ? Math.round((weeklyCompleted / weeklyTasks.length) * 100) : 0;
    const { daysUntilReset, resetDayName } = getResetInfo();
    const remaining = weeklyTasks.length - weeklyCompleted;
    const pace = getDailyPaceSuggestion(remaining, daysUntilReset);
    const paceText = pace === 'done'
        ? '✓ All done this week!'
        : `${pace}/day to finish by ${resetDayName}`;

    card.innerHTML = `
        <div class="compact-header">
            <img src="${avatarUrl}" alt="${char.character_name || char.name}" class="compact-avatar">
            <div class="compact-info">
                <div class="compact-name" style="color: ${classColor}">${char.character_name || char.name}</div>
                <div class="compact-ilvl">${char.avg_ilvl} <span class="ilvl-delta ${deltaClass}">${deltaSign}${delta.toFixed(1)}</span></div>
            </div>
            <button class="sync-btn-compact" data-char-id="${char.id}" title="Sync from Blizzard API">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
                </svg>
            </button>
        </div>
        <div class="compact-weekly-progress">
            <div class="compact-progress-header">
                <span class="compact-progress-label">Weekly ${weeklyCompleted}/${weeklyTasks.length}</span>
                <span class="compact-progress-pct">${pct}%</span>
            </div>
            <div class="compact-progress-bar">
                <div class="compact-progress-fill" style="width:${pct}%"></div>
            </div>
            <div class="compact-pace-hint">${paceText} · ${daysUntilReset}d left</div>
        </div>
        <div class="vault-grid">${renderVaultGrid(vault)}</div>
        <div class="compact-crest-summary">${crestHtml}</div>
        ${profSummary ? `<div class="compact-profession-summary">${profSummary}</div>` : ''}
    `;

    // Click to navigate to detail (but not if clicking sync button)
    card.addEventListener('click', (e) => {
        if (!e.target.closest('.sync-btn-compact')) {
            navigateToDetail(char.id);
        }
    });

    // Sync button
    card.querySelector('.sync-btn-compact').addEventListener('click', (e) => {
        e.stopPropagation();
        syncCharacter(char.id, e.currentTarget);
    });

    return card;
}

// Character Detail View
function renderDetailView(container, char) {
    const currentWeek = appData.meta.current_week;
    const delta = char.avg_ilvl - appData.weekly_target;
    const deltaClass = delta >= 0 ? 'positive' : 'negative';
    const deltaSign = delta >= 0 ? '+' : '';
    const avatarUrl = char.avatar_url || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="80" height="80"%3E%3Crect fill="%232a2a2a"/%3E%3C/svg%3E';
    const classColor = getClassColor(char.class);

    container.innerHTML = `
        <div class="dashboard-breadcrumb">
            <span class="breadcrumb-item" onclick="navigateToOverview()" style="cursor:pointer;">Dashboard</span>
            <span class="breadcrumb-separator">/</span>
            <span class="breadcrumb-item active">${char.character_name || char.name}</span>
        </div>
        <div class="detail-view">
            <!-- Header -->
            <div class="detail-header">
                <img src="${avatarUrl}" alt="${char.character_name || char.name}" class="detail-avatar">
                <div class="detail-header-info">
                    <h2 style="color: ${classColor}; margin:0;">${char.character_name || char.name}</h2>
                    <div class="detail-ilvl">${char.avg_ilvl} ilvl <span class="ilvl-delta ${deltaClass}">${deltaSign}${delta.toFixed(1)}</span></div>
                    <div class="detail-last-sync">${char.last_gear_sync ? 'Last sync: ' + formatTimestamp(char.last_gear_sync) : 'Not synced'}</div>
                </div>
                <div class="detail-header-actions">
                    <button class="sync-btn-detail" id="detailSyncBtn" data-char-id="${char.id}">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/></svg>
                        Sync
                    </button>
                    <button class="detail-delete-btn" onclick="deleteCharacter(${char.id})">Delete</button>
                </div>
            </div>

            <!-- Timeline -->
            <div class="detail-section" id="detailTimeline"></div>

            <!-- Tasks -->
            <div class="detail-section" id="detailTasks"></div>

            <!-- Vault & Crests (side by side) -->
            <div class="detail-row">
                <div class="detail-section">
                    <h3>Great Vault</h3>
                    <div class="vault-grid" id="detailVault"></div>
                </div>
                <div class="detail-section" id="detailCrests"></div>
            </div>

            <!-- Equipment -->
            <div class="detail-section">
                <h3>Equipment</h3>
                <div id="detailGear"></div>
            </div>

            <!-- BiS Tracker -->
            <div class="detail-section" id="detailBis"></div>

            <!-- Professions -->
            <div class="detail-section" id="detailProfessions"></div>

            <!-- Talent Builds -->
            <div class="detail-section" id="detailTalents"></div>

            <!-- Weekly Progress -->
            <div class="detail-section" id="detailWeeklyProgress"></div>
        </div>
    `;

    // Wire sync button
    document.getElementById('detailSyncBtn').addEventListener('click', (e) => {
        syncCharacter(char.id, e.currentTarget);
    });

    // Render sub-sections
    renderDetailTimeline(char, currentWeek);
    renderDetailTasks(char);
    renderDetailVault(char, currentWeek);
    renderDetailGear(char);
    renderBisTracker(char);
    renderDetailCrests(char);
    renderDetailProfessions(char);
    renderTalentBuilds(char);
    renderWeeklyProgress(char, currentWeek);

    // Load icons for gear
    setTimeout(() => loadItemIcons(), 100);
}

function renderDetailTimeline(char, currentWeek) {
    const container = document.getElementById('detailTimeline');
    let nodesHtml = '';
    for (let i = 0; i <= 12; i++) {
        let cls = '';
        if (i === currentWeek) cls = 'current';
        else if (i < currentWeek) cls = 'past';
        else cls = 'future';
        nodesHtml += `<div class="timeline-node ${cls}" data-week="${i}" title="${WEEK_NAMES[i]}">${i}</div>`;
    }

    const weekTasks = appData.weekly_tasks || {};
    const weekName = weekTasks.name || WEEK_NAMES[currentWeek] || ('Week ' + currentWeek);
    const target = appData.weekly_target || 0;
    const delta = char.avg_ilvl - target;
    const deltaClass = delta >= 0 ? 'positive' : 'negative';
    const deltaSign = delta >= 0 ? '+' : '';
    const milestones = weekTasks.weekly || [];

    container.innerHTML = `
        <h3>Season Timeline</h3>
        <div class="timeline-bar">${nodesHtml}</div>
        <div class="timeline-detail-panel">
            <div class="timeline-week-header">
                <strong>${weekName}</strong>
                <span class="timeline-week-position">Week ${currentWeek} of 12</span>
            </div>
            <div class="timeline-targets">
                Target: <strong>${target} ilvl</strong> · Your avg: <strong>${char.avg_ilvl} ilvl</strong>
                <span class="ilvl-delta ${deltaClass}">${deltaSign}${delta.toFixed(1)}</span>
            </div>
            ${milestones.length ? `<ul class="timeline-milestones">${milestones.map(m => `<li>${m.label}</li>`).join('')}</ul>` : ''}
        </div>
    `;

    // Wire timeline node clicks
    container.querySelectorAll('.timeline-node').forEach(node => {
        node.addEventListener('click', async () => {
            const newWeek = parseInt(node.dataset.week);
            await saveData('/api/meta', { current_week: newWeek });
            await loadData();
        });
    });
}

function renderDetailVault(char, currentWeek) {
    const vault = calculateVaultSlots(char.weekly_progress, currentWeek);
    document.getElementById('detailVault').innerHTML = renderVaultGrid(vault);
}

function renderDetailGear(char) {
    document.getElementById('detailGear').innerHTML = renderGearGrid(char.gear);
}

function renderBisTracker(char) {
    const container = document.getElementById('detailBis');
    const bisList = char.bis_list || [];

    let listHtml = bisList.map(item => `
        <div class="bis-item" data-bis-id="${item.id}">
            <label class="bis-checkbox-label">
                <input type="checkbox" class="bis-obtained" ${item.obtained ? 'checked' : ''}>
            </label>
            <span class="bis-slot-badge">${capitalize(item.slot)}</span>
            <span class="bis-item-name">${item.item_name}</span>
            ${item.target_ilvl ? `<span class="bis-target-ilvl">${item.target_ilvl}</span>` : ''}
            ${item.synced ? `<span class="bis-synced">synced</span>` : ''}
            <button class="bis-delete-btn" data-bis-id="${item.id}">✕</button>
        </div>
    `).join('');

    const slots = ['head','neck','shoulder','back','chest','wrist','hands','waist','legs','feet','ring1','ring2','trinket1','trinket2','main_hand','off_hand'];

    container.innerHTML = `
        <h3>BiS Tracker</h3>
        <div class="bis-list">${listHtml || '<p class="text-muted" style="font-size:var(--font-size-sm);">No BiS items added yet.</p>'}</div>
        <div class="bis-add-form">
            <h4 style="margin:8px 0 4px; font-size:var(--font-size-sm);">Add BiS Item</h4>
            <select id="bisSlot">${slots.map(s => `<option value="${s}">${capitalize(s.replace('_',' '))}</option>`).join('')}</select>
            <input type="text" id="bisItemName" placeholder="Item name">
            <input type="text" id="bisItemId" placeholder="Item ID (optional)">
            <input type="text" id="bisTargetIlvl" placeholder="Target ilvl">
            <button class="btn-primary bis-add-btn">Add</button>
        </div>
    `;

    // Wire BiS events
    container.querySelectorAll('.bis-obtained').forEach(cb => {
        cb.addEventListener('change', async (e) => {
            const bisItem = e.target.closest('.bis-item');
            const bisId = parseInt(bisItem.dataset.bisId);
            await saveData(`/api/character/${char.id}/bis/${bisId}`, { obtained: e.target.checked }, 'PUT');
            await loadData();
        });
    });

    container.querySelectorAll('.bis-delete-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const bisId = parseInt(e.currentTarget.dataset.bisId);
            try {
                await fetch(`/api/character/${char.id}/bis/${bisId}`, { method: 'DELETE' });
                await loadData();
            } catch(err) { showSaveIndicator('Delete failed', 'error'); }
        });
    });

    container.querySelector('.bis-add-btn').addEventListener('click', async () => {
        const slot = document.getElementById('bisSlot').value;
        const name = document.getElementById('bisItemName').value.trim();
        const itemId = document.getElementById('bisItemId').value.trim();
        const targetIlvl = document.getElementById('bisTargetIlvl').value.trim();

        if (!name) { showSaveIndicator('Item name required', 'error'); return; }

        try {
            const response = await fetch(`/api/character/${char.id}/bis`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ slot, item_name: name, item_id: itemId || null, target_ilvl: targetIlvl || null })
            });
            const result = await response.json();
            if (result.success) { showSaveIndicator('BiS item added', 'saved'); await loadData(); }
            else { showSaveIndicator(result.error || 'Failed', 'error'); }
        } catch(err) { showSaveIndicator('Failed to add BiS item', 'error'); }
    });
}

function renderTalentBuilds(char) {
    const container = document.getElementById('detailTalents');
    const builds = char.talent_builds || [];
    const categoryColors = { raid: '#ef4444', dungeon: '#3b82f6', delve: '#22c55e', pvp: '#a855f7' };

    let listHtml = builds.map(build => `
        <div class="talent-card" data-talent-id="${build.id}">
            <div class="talent-card-header">
                <span class="talent-category-badge" style="background:${categoryColors[build.category] || '#666'}40; color:${categoryColors[build.category] || '#666'};">${capitalize(build.category)}</span>
                <strong class="talent-name">${build.name}</strong>
                <button class="talent-delete-btn" data-talent-id="${build.id}">✕</button>
            </div>
            ${build.description ? `<div class="talent-description">${build.description}</div>` : ''}
            ${build.talent_string ? `<div class="talent-string-row">
                <span class="talent-string-preview">${build.talent_string.substring(0, 60)}${build.talent_string.length > 60 ? '…' : ''}</span>
                <button class="talent-copy-btn" data-talent-string="${escapeHtml(build.talent_string)}">Copy</button>
            </div>` : ''}
        </div>
    `).join('');

    container.innerHTML = `
        <h3>Talent Builds</h3>
        <div class="talent-list">${listHtml || '<p class="text-muted" style="font-size:var(--font-size-sm);">No talent builds saved yet.</p>'}</div>
        <details class="talent-add-form">
            <summary style="cursor:pointer; font-size:var(--font-size-sm); color:var(--hool-primary-blue);">+ Add Talent Build</summary>
            <div style="margin-top:8px; display:flex; flex-direction:column; gap:6px;">
                <select id="talentCategory">
                    <option value="raid">Raid</option>
                    <option value="dungeon">Dungeon</option>
                    <option value="delve">Delve</option>
                    <option value="pvp">PvP</option>
                </select>
                <input type="text" id="talentName" placeholder="Build name">
                <textarea id="talentDescription" placeholder="Description" rows="2" style="font-family:inherit; font-size:var(--font-size-sm); background:var(--bg-card); border:1px solid var(--border-color); color:var(--text-primary); border-radius:6px; padding:6px 10px; resize:vertical;"></textarea>
                <textarea id="talentString" placeholder="Paste talent string from game" rows="2" style="font-family:inherit; font-size:var(--font-size-sm); background:var(--bg-card); border:1px solid var(--border-color); color:var(--text-primary); border-radius:6px; padding:6px 10px; resize:vertical;"></textarea>
                <button class="btn-primary talent-save-btn">Save Build</button>
            </div>
        </details>
    `;

    // Wire events
    container.querySelectorAll('.talent-delete-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const talentId = parseInt(btn.dataset.talentId);
            try {
                await fetch(`/api/character/${char.id}/talents/${talentId}`, { method: 'DELETE' });
                await loadData();
            } catch(err) { showSaveIndicator('Delete failed', 'error'); }
        });
    });

    container.querySelectorAll('.talent-copy-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const str = btn.dataset.talentString;
            navigator.clipboard.writeText(str).then(() => showSaveIndicator('Copied!', 'saved')).catch(() => {
                // Fallback
                const ta = document.createElement('textarea');
                ta.value = str;
                document.body.appendChild(ta);
                ta.select();
                document.execCommand('copy');
                document.body.removeChild(ta);
                showSaveIndicator('Copied!', 'saved');
            });
        });
    });

    container.querySelector('.talent-save-btn').addEventListener('click', async () => {
        const category = document.getElementById('talentCategory').value;
        const name = document.getElementById('talentName').value.trim();
        const description = document.getElementById('talentDescription').value.trim();
        const talentString = document.getElementById('talentString').value.trim();

        if (!name) { showSaveIndicator('Build name required', 'error'); return; }

        try {
            const response = await fetch(`/api/character/${char.id}/talents`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ category, name, description, talent_string: talentString })
            });
            const result = await response.json();
            if (result.success) { showSaveIndicator('Talent build saved', 'saved'); await loadData(); }
            else { showSaveIndicator(result.error || 'Failed', 'error'); }
        } catch(err) { showSaveIndicator('Failed to save talent build', 'error'); }
    });
}

function escapeHtml(str) {
    return str.replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function renderDetailTasks(char) {
    const container = document.getElementById('detailTasks');
    container.innerHTML = `
        <h3>Tasks</h3>
        <div class="detail-tasks-weekly">
            <h4 style="margin:0 0 8px;">Weekly Tasks</h4>
            ${renderWeeklyTasksForCharacter(char)}
        </div>
        <div class="detail-tasks-suggestions" style="margin-top:16px;">
            <h4 style="margin:0 0 8px;">Daily Suggestions</h4>
            ${renderDailySuggestions(char)}
        </div>
    `;
    setupChecklistEvents(container, char.id);
}

function renderDetailCrests(char) {
    const container = document.getElementById('detailCrests');
    const crestTypes = ['weathered', 'carved', 'runed', 'gilded'];

    let html = crestTypes.map(type => {
        const crest = char.crests[type] || { collected_this_week: 0, total_collected: 0 };
        const isCapped = crest.collected_this_week >= 90;
        return `<div class="detail-crest-row">
            <img src="${getCrestIcon(type)}" alt="${type}" class="detail-crest-icon" onerror="handleCrestIconError(this, '${type}')" style="width:24px;height:24px;">
            <span class="detail-crest-name">${capitalize(type)}</span>
            <input type="number" min="0" value="${crest.collected_this_week}" class="detail-crest-input" data-char-id="${char.id}" data-crest-type="${type}" style="width:60px;">
            <span class="detail-crest-label">/90</span>
            ${isCapped ? '<span class="cap-badge">CAP</span>' : ''}
            <span class="detail-crest-total" style="margin-left:auto;">Total: ${crest.total_collected}</span>
        </div>`;
    }).join('');

    container.innerHTML = `<h3>Crests</h3><div class="detail-crest-list">${html}</div>`;

    container.querySelectorAll('.detail-crest-input').forEach(input => {
        input.addEventListener('change', async (e) => {
            const charId = parseInt(e.target.dataset.charId);
            const crestType = e.target.dataset.crestType;
            const value = parseInt(e.target.value) || 0;
            await saveData(`/api/character/${charId}/crests`, { crest_type: crestType, collected_this_week: value });
            await loadData();
        });
    });
}

function renderDetailProfessions(char) {
    const container = document.getElementById('detailProfessions');
    const allProfessions = ['Alchemy','Blacksmithing','Enchanting','Engineering','Herbalism','Inscription','Jewelcrafting','Leatherworking','Mining','Skinning','Tailoring'];

    let html = '';
    for (let i = 0; i < 2; i++) {
        const profName = char.professions[i] || '';
        const prog = profName ? (char.profession_progress?.[profName] || { weekly_quest: false, patron_orders: false, treatise: false, knowledge_points: 0, concentration: 1000 }) : null;

        html += `<div class="detail-prof-row">
            <select class="detail-prof-dropdown" data-char-id="${char.id}" data-prof-index="${i}">
                <option value="">— Select Profession —</option>
                ${allProfessions.map(p => `<option value="${p}" ${profName === p ? 'selected' : ''}>${p}</option>`).join('')}
            </select>
            ${prog ? `
                <div class="detail-prof-checks">
                    <label title="Weekly profession quest reward">
                        <input type="checkbox" data-char-id="${char.id}" data-profession="${profName}" data-field="weekly_quest" ${prog.weekly_quest ? 'checked' : ''}>
                        <span>Weekly Quest</span>
                    </label>
                    <label title="Patron orders (reset Wed, separate from weekly reset)">
                        <input type="checkbox" data-char-id="${char.id}" data-profession="${profName}" data-field="patron_orders" ${prog.patron_orders ? 'checked' : ''}>
                        <span>Patron Orders</span>
                    </label>
                    <label title="Treatise acquired">
                        <input type="checkbox" data-char-id="${char.id}" data-profession="${profName}" data-field="treatise" ${prog.treatise ? 'checked' : ''}>
                        <span>Treatise</span>
                    </label>
                </div>
                <div class="detail-prof-inputs">
                    <input type="number" class="detail-prof-input" min="0" value="${prog.knowledge_points}" data-char-id="${char.id}" data-profession="${profName}" data-field="knowledge_points" title="Profession level">
                    <span class="detail-prof-label">Level</span>
                    <input type="number" class="detail-prof-input" min="0" max="1000" value="${prog.concentration}" data-char-id="${char.id}" data-profession="${profName}" data-field="concentration" title="Concentration (spent on crafts)">
                    <span class="detail-prof-label">Conc</span>
                </div>
            ` : ''}
        </div>`;
    }

    container.innerHTML = `
        <h3>Professions</h3>
        <div class="detail-prof-list">
            ${html}
        </div>
    `;

    // Wire profession dropdowns
    container.querySelectorAll('.detail-prof-dropdown').forEach(select => {
        select.addEventListener('change', async (e) => {
            const charId = parseInt(e.target.dataset.charId);
            const profIndex = parseInt(e.target.dataset.profIndex);
            const char2 = appData.characters.find(c => c.id === charId);
            if (!char2) return;
            const newProfessions = [...char2.professions];
            while (newProfessions.length < 2) newProfessions.push('');
            newProfessions[profIndex] = e.target.value;
            try {
                const response = await fetch(`/api/characters/${charId}/professions`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ professions: newProfessions })
                });
                const result = await response.json();
                if (result.success) { showSaveIndicator('Profession updated', 'saved'); await loadData(); }
                else { showSaveIndicator('Failed to update profession', 'error'); }
            } catch(err) { showSaveIndicator('Failed to update profession', 'error'); }
        });
    });

    // Wire profession checkboxes and number inputs
    container.querySelectorAll('input[type="checkbox"], .detail-prof-input').forEach(input => {
        input.addEventListener('change', async (e) => {
            const charId = parseInt(e.target.dataset.charId);
            const profession = e.target.dataset.profession;
            const field = e.target.dataset.field;
            const value = e.target.type === 'checkbox' ? e.target.checked : (parseInt(e.target.value) || 0);
            await saveData(`/api/character/${charId}/profession`, { profession, [field]: value });
        });
    });
}

function renderWeeklyProgress(char, currentWeek) {
    const container = document.getElementById('detailWeeklyProgress');
    const weekStr = String(currentWeek);
    const wp = (char.weekly_progress || {})[weekStr] || { raid_bosses: {lfr:0,normal:0,heroic:0,mythic:0}, m_plus_dungeons: [], highest_delve: 0, world_vault: [null,null,null] };

    let mplusHtml = '';
    for (let i = 0; i < 8; i++) {
        const dungeon = wp.m_plus_dungeons[i] || { name: '', key_level: 0 };
        mplusHtml += `<div class="mplus-input-row">
            <input type="text" class="mplus-name-input" data-index="${i}" value="${dungeon.name || ''}" placeholder="Dungeon name">
            <input type="number" class="mplus-key-input" data-index="${i}" min="0" value="${dungeon.key_level || ''}" placeholder="+">
        </div>`;
    }

    container.innerHTML = `
        <h3>Weekly Progress</h3>
        <div class="weekly-progress-section">
            <h4 style="margin:0 0 6px; font-size:var(--font-size-sm);">Raid Bosses Killed</h4>
            <div class="raid-input-grid">
                <label style="font-size:var(--font-size-sm);">LFR</label>
                <input type="number" id="wpRaidLfr" min="0" value="${wp.raid_bosses.lfr || 0}" class="wp-raid-input" data-diff="lfr">
                <label style="font-size:var(--font-size-sm);">Normal</label>
                <input type="number" id="wpRaidNormal" min="0" value="${wp.raid_bosses.normal || 0}" class="wp-raid-input" data-diff="normal">
                <label style="font-size:var(--font-size-sm);">Heroic</label>
                <input type="number" id="wpRaidHeroic" min="0" value="${wp.raid_bosses.heroic || 0}" class="wp-raid-input" data-diff="heroic">
                <label style="font-size:var(--font-size-sm);">Mythic</label>
                <input type="number" id="wpRaidMythic" min="0" value="${wp.raid_bosses.mythic || 0}" class="wp-raid-input" data-diff="mythic">
            </div>

            <h4 style="margin:12px 0 6px; font-size:var(--font-size-sm);">M+ Dungeons (up to 8)</h4>
            <div class="mplus-input-list">${mplusHtml}</div>

            <h4 style="margin:12px 0 6px; font-size:var(--font-size-sm);">Highest Delve</h4>
            <input type="number" id="wpDelve" min="0" value="${wp.highest_delve || 0}" placeholder="Tier" style="width:80px;">

            <h4 style="margin:12px 0 6px; font-size:var(--font-size-sm);">World Vault (manual ilvl)</h4>
            <div class="world-vault-input-row">
                <input type="number" id="wpWorld1" value="${wp.world_vault[0] || ''}" placeholder="ilvl" class="wp-world-input" data-index="0">
                <input type="number" id="wpWorld2" value="${wp.world_vault[1] || ''}" placeholder="ilvl" class="wp-world-input" data-index="1">
                <input type="number" id="wpWorld3" value="${wp.world_vault[2] || ''}" placeholder="ilvl" class="wp-world-input" data-index="2">
            </div>
            <button class="btn-primary wp-save-btn" style="margin-top:12px;" data-char-id="${char.id}">Save Progress</button>
        </div>
    `;

    // Wire save button
    container.querySelector('.wp-save-btn').addEventListener('click', async () => {
        const raidBosses = {
            lfr: parseInt(document.getElementById('wpRaidLfr').value) || 0,
            normal: parseInt(document.getElementById('wpRaidNormal').value) || 0,
            heroic: parseInt(document.getElementById('wpRaidHeroic').value) || 0,
            mythic: parseInt(document.getElementById('wpRaidMythic').value) || 0
        };

        const mplusDungeons = [];
        for (let i = 0; i < 8; i++) {
            const name = document.querySelector(`.mplus-name-input[data-index="${i}"]`)?.value.trim() || '';
            const keyLevel = parseInt(document.querySelector(`.mplus-key-input[data-index="${i}"]`)?.value) || 0;
            if (name || keyLevel) mplusDungeons.push({ name, key_level: keyLevel });
        }

        const highestDelve = parseInt(document.getElementById('wpDelve').value) || 0;
        const worldVault = [
            document.getElementById('wpWorld1').value ? parseInt(document.getElementById('wpWorld1').value) : null,
            document.getElementById('wpWorld2').value ? parseInt(document.getElementById('wpWorld2').value) : null,
            document.getElementById('wpWorld3').value ? parseInt(document.getElementById('wpWorld3').value) : null
        ];

        try {
            const response = await fetch(`/api/character/${char.id}/weekly-progress`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ raid_bosses: raidBosses, m_plus_dungeons: mplusDungeons, highest_delve: highestDelve, world_vault: worldVault })
            });
            const result = await response.json();
            if (result.success) { showSaveIndicator('Progress saved', 'saved'); await loadData(); }
            else { showSaveIndicator(result.error || 'Failed', 'error'); }
        } catch(err) { showSaveIndicator('Failed to save progress', 'error'); }
    });
}

// Collapse State Persistence
function saveCollapseState(sectionId, isExpanded) {
    const state = JSON.parse(localStorage.getItem('collapseState') || '{}');
    state[sectionId] = isExpanded;
    localStorage.setItem('collapseState', JSON.stringify(state));
}

function getCollapseState(sectionId) {
    const state = JSON.parse(localStorage.getItem('collapseState') || '{}');
    return state[sectionId] || false;
}

function renderWeeklyTasksForCharacter(char) {
    if (!appData.weekly_tasks || !appData.weekly_tasks.weekly) {
        return '<p class="text-muted">No weekly tasks</p>';
    }

    const weeklyTasks = appData.weekly_tasks.weekly;
    const currentWeek = String(appData.meta.current_week);  // Convert to string for dict key
    const charTasks = (char.weekly_tasks && char.weekly_tasks[currentWeek]) || {};

    return weeklyTasks.map(task => `
        <div class="checkbox-item">
            <input type="checkbox"
                   data-char-id="${char.id}"
                   data-task-type="weekly"
                   data-task-id="${task.id}"
                   ${charTasks[task.id] ? 'checked' : ''}>
            <label>${task.label}</label>
        </div>
    `).join('');
}

function renderCharacterStats(char) {
    if (!char.stats) {
        return '<p class="text-muted">Sync to view stats</p>';
    }

    const statColors = {
        strength: '#C41F3B',
        agility: '#00FF96',
        intellect: '#0070DD',
        stamina: '#FFCC00',
        crit_rating: '#FF8000',
        haste_rating: '#FFFF00',
        mastery_rating: '#9D5FB9',
        versatility: '#71D5FF',
        armor: '#C0C0C0'
    };

    const stats = char.stats;
    const primaryStat = Math.max(stats.strength || 0, stats.agility || 0, stats.intellect || 0);
    let primaryName = 'Primary';
    let primaryColor = statColors.strength;

    if (stats.strength >= primaryStat && stats.strength > 0) {
        primaryName = 'Strength';
        primaryColor = statColors.strength;
    } else if (stats.agility >= primaryStat && stats.agility > 0) {
        primaryName = 'Agility';
        primaryColor = statColors.agility;
    } else if (stats.intellect >= primaryStat && stats.intellect > 0) {
        primaryName = 'Intellect';
        primaryColor = statColors.intellect;
    }

    return `
        <div class="stats-grid-compact">
            <div class="stat-item-compact">
                <span class="stat-label" style="color: ${primaryColor}">${primaryName}</span>
                <span class="stat-value">${primaryStat}</span>
            </div>
            <div class="stat-item-compact">
                <span class="stat-label" style="color: ${statColors.stamina}">Stam</span>
                <span class="stat-value">${stats.stamina || 0}</span>
            </div>
            <div class="stat-item-compact">
                <span class="stat-label" style="color: ${statColors.crit_rating}">Crit</span>
                <span class="stat-value">${(stats.crit_rating_pct || 0).toFixed(1)}%</span>
            </div>
            <div class="stat-item-compact">
                <span class="stat-label" style="color: ${statColors.haste_rating}">Haste</span>
                <span class="stat-value">${(stats.haste_rating_pct || 0).toFixed(1)}%</span>
            </div>
            <div class="stat-item-compact">
                <span class="stat-label" style="color: ${statColors.mastery_rating}">Mast</span>
                <span class="stat-value">${(stats.mastery_rating_pct || 0).toFixed(1)}%</span>
            </div>
            <div class="stat-item-compact">
                <span class="stat-label" style="color: ${statColors.versatility}">Vers</span>
                <span class="stat-value">${(stats.versatility_pct || 0).toFixed(1)}%</span>
            </div>
        </div>
    `;
}

function renderGearGrid(gear) {
    const qualityColors = {
        POOR: '#9d9d9d',
        COMMON: '#ffffff',
        UNCOMMON: '#1eff00',
        RARE: '#0070dd',
        EPIC: '#a335ee',
        LEGENDARY: '#ff8000',
        ARTIFACT: '#e6cc80',
        HEIRLOOM: '#00ccff'
    };

    const slotOrder = [
        'head', 'neck', 'shoulder', 'back',
        'chest', 'wrist', 'hands', 'waist',
        'legs', 'feet', 'ring1', 'ring2',
        'trinket1', 'trinket2', 'main_hand', 'off_hand'
    ];

    const slotNames = {
        head: 'Head', neck: 'Neck', shoulder: 'Shoulder', back: 'Back',
        chest: 'Chest', wrist: 'Wrist', hands: 'Hands', waist: 'Waist',
        legs: 'Legs', feet: 'Feet', ring1: 'Ring 1', ring2: 'Ring 2',
        trinket1: 'Trinket 1', trinket2: 'Trinket 2',
        main_hand: 'Main Hand', off_hand: 'Off Hand'
    };

    let html = '<div class="gear-slots">';

    slotOrder.forEach(slotKey => {
        const slot = gear[slotKey];
        const quality = slot.quality || 'COMMON';
        const color = qualityColors[quality] || qualityColors.COMMON;
        const itemId = slot.item_id || 0;
        const ilvl = slot.ilvl || 0;
        const itemName = slot.item_name || 'Empty';
        const wowheadUrl = itemId > 0 ? `https://www.wowhead.com/item=${itemId}` : '#';
        const socketIcon = slot.sockets > 0 ? '💎' : '';
        const enchantIcon = slot.enchanted ? '✨' : '';

        html += `
            <div class="gear-slot-item ${ilvl === 0 ? 'empty' : ''}" title="${itemName}">
                <div class="gear-slot-name">${slotNames[slotKey]}</div>
                ${itemId > 0 ? `
                    <a href="${wowheadUrl}" target="_blank" rel="noopener" class="gear-item-link" style="color: ${color}">
                        <div class="gear-item-header">
                            <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='36' height='36'%3E%3Crect fill='%23333'/%3E%3C/svg%3E"
                                 alt="${itemName}"
                                 class="gear-item-icon"
                                 data-item-id="${itemId}"
                                 style="display: block;"
                                 onerror="this.style.display='none'" />
                            <div class="gear-item-ilvl">${ilvl}</div>
                        </div>
                        <div class="gear-item-name">${itemName}</div>
                        <div class="gear-item-icons">${socketIcon}${enchantIcon}</div>
                    </a>
                ` : `
                    <div class="gear-item-empty">Empty</div>
                `}
            </div>
        `;
    });

    html += '</div>';
    return html;
}

function renderCrestSummary(char) {
    const crestTypes = ['weathered', 'carved', 'runed', 'gilded'];
    let html = '';

    crestTypes.forEach(type => {
        const crest = char.crests[type];
        const isCapped = crest.collected_this_week >= 90;
        const badge = isCapped ? '<span class="cap-badge">CAP</span>' : '';
        const iconUrl = getCrestIcon(type);

        html += `
            <div class="crest-row">
                <span class="crest-name-with-icon">
                    <img src="${iconUrl}" alt="${type}" class="crest-icon" onerror="handleCrestIconError(this, '${type}')" />
                    ${capitalize(type)}
                </span>
                <span>${crest.collected_this_week}/90 ${badge}</span>
            </div>
        `;
    });

    return html;
}

function renderDailySuggestions(char) {
    const weeklyTasks = appData.weekly_tasks?.weekly || [];
    const currentWeek = String(appData.meta.current_week);
    const charTasks = char.weekly_tasks?.[currentWeek] || {};
    const remaining = weeklyTasks.filter(t => !charTasks[t.id]);
    const { daysUntilReset, resetDayName } = getResetInfo();

    if (remaining.length === 0) {
        return `<p class="suggestion-done">All weekly tasks complete — nothing left to do this week!</p>`;
    }

    const perDay = Math.ceil(remaining.length / daysUntilReset);
    const todaysSuggestions = remaining.slice(0, perDay);

    return `
        <p class="suggestion-hint">
            ${remaining.length} task${remaining.length !== 1 ? 's' : ''} left ·
            ${daysUntilReset} day${daysUntilReset !== 1 ? 's' : ''} until ${resetDayName} reset
        </p>
        <p class="suggestion-subhint">Suggested for today:</p>
        ${todaysSuggestions.map(t => `
            <div class="suggestion-item">
                <span class="suggestion-dot">•</span>
                <span>${t.label}</span>
            </div>
        `).join('')}
        ${remaining.length > perDay ? `
            <p class="suggestion-more">+${remaining.length - perDay} more spread over the next ${daysUntilReset - 1} day${daysUntilReset - 1 !== 1 ? 's' : ''}</p>
        ` : ''}
    `;
}

function renderDailyChecklist(char) {
    if (!appData.weekly_tasks || !appData.weekly_tasks.daily) {
        return '<p class="text-muted">No tasks for this week</p>';
    }

    const dailyTasks = appData.weekly_tasks.daily;
    const charTasks = char.daily_tasks || {};

    return dailyTasks.map(task => `
        <div class="checkbox-item">
            <input type="checkbox"
                   data-char-id="${char.id}"
                   data-task-type="daily"
                   data-task-id="${task.id}"
                   ${charTasks[task.id] ? 'checked' : ''}>
            <label>${task.label}</label>
        </div>
    `).join('');
}

function setupChecklistEvents(card, charId) {
    card.querySelectorAll('.checkbox-item input').forEach(checkbox => {
        checkbox.addEventListener('change', async (e) => {
            const taskType = e.target.dataset.taskType;
            const taskId = e.target.dataset.taskId;
            const done = e.target.checked;

            const updates = {
                task_type: taskType,
                task_id: taskId,
                done: done
            };

            await saveData(`/api/character/${charId}/tasks`, updates);
        });
    });
}

// Drag and Drop
function setupDragAndDrop(card) {
    card.addEventListener('dragstart', (e) => {
        draggedCard = card;
        card.style.opacity = '0.5';
        e.dataTransfer.effectAllowed = 'move';
    });

    card.addEventListener('dragend', (e) => {
        card.style.opacity = '1';
        draggedCard = null;
        // Remove all drag-over classes
        document.querySelectorAll('.character-card-compact').forEach(c => {
            c.classList.remove('drag-over');
        });
    });

    card.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';

        if (draggedCard && draggedCard !== card) {
            card.classList.add('drag-over');
        }
    });

    card.addEventListener('dragleave', (e) => {
        card.classList.remove('drag-over');
    });

    card.addEventListener('drop', async (e) => {
        e.preventDefault();
        card.classList.remove('drag-over');

        if (draggedCard && draggedCard !== card) {
            const grid = document.getElementById('dashboardGrid');
            const cards = Array.from(grid.children);
            const draggedIndex = cards.indexOf(draggedCard);
            const targetIndex = cards.indexOf(card);

            // Reorder in DOM
            if (draggedIndex < targetIndex) {
                card.after(draggedCard);
            } else {
                card.before(draggedCard);
            }

            // Save new order to backend
            await saveCharacterOrder();
        }
    });
}

async function saveCharacterOrder() {
    const grid = document.getElementById('dashboardGrid');
    const cards = Array.from(grid.querySelectorAll('.character-card-compact'));
    const newOrder = cards.map(card => parseInt(card.dataset.charId));

    try {
        const response = await fetch('/api/characters/reorder', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ order: newOrder })
        });

        const result = await response.json();
        if (result.success) {
            showSaveIndicator('Order saved', 'saved');
        } else {
            showSaveIndicator('Failed to save order', 'error');
        }
    } catch (error) {
        showSaveIndicator('Failed to save order', 'error');
    }
}

// Settings
function renderSettings() {
    // Load API config
    const useSharedCheckbox = document.getElementById('useSharedCredentials');
    const customSection = document.getElementById('customCredentialsSection');
    const useShared = appData.blizzard_config.use_shared_credentials !== false; // default to true

    useSharedCheckbox.checked = useShared;
    customSection.style.display = useShared ? 'none' : 'block';

    // Only show custom credentials if not using shared
    if (!useShared) {
        document.getElementById('clientId').value = appData.blizzard_config.client_id || '';
        document.getElementById('clientSecret').value = appData.blizzard_config.client_secret || '';
    } else {
        document.getElementById('clientId').value = '';
        document.getElementById('clientSecret').value = '';
    }

    document.getElementById('region').value = appData.blizzard_config.region || 'us';
}

// Add Character
async function addCharacter() {
    console.log('addCharacter function called');

    // Show modal
    const modal = document.getElementById('characterModal');
    const nameInput = document.getElementById('modalCharacterName');
    const realmInput = document.getElementById('modalRealm');
    const addBtn = document.getElementById('modalAddBtn');
    const cancelBtn = document.getElementById('modalCancelBtn');
    const overlay = modal.querySelector('.modal-overlay');

    // Clear previous values
    nameInput.value = '';
    realmInput.value = '';

    // Show the modal
    modal.style.display = 'flex';
    nameInput.focus();

    // Handle Add button
    const handleAdd = async () => {
        const characterName = nameInput.value.trim();
        const realm = realmInput.value.trim();

        if (!characterName) {
            alert('Please enter a character name');
            return;
        }

        // Close modal
        modal.style.display = 'none';

        try {
            const response = await fetch('/api/characters', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: characterName,
                    realm: realm || '',
                    character_name: characterName,
                    professions: []
                })
            });

            const result = await response.json();
            if (result.success) {
                showSaveIndicator('Character added', 'saved');
                await loadData();
            } else {
                showSaveIndicator('Failed to add character', 'error');
            }
        } catch (error) {
            showSaveIndicator('Failed to add character', 'error');
        }

        // Clean up event listeners
        cleanup();
    };

    // Handle Cancel button
    const handleCancel = () => {
        modal.style.display = 'none';
        cleanup();
    };

    // Handle Enter key
    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleAdd();
        } else if (e.key === 'Escape') {
            handleCancel();
        }
    };

    // Handle clicking overlay
    const handleOverlayClick = (e) => {
        if (e.target === overlay) {
            handleCancel();
        }
    };

    // Cleanup function to remove event listeners
    const cleanup = () => {
        addBtn.removeEventListener('click', handleAdd);
        cancelBtn.removeEventListener('click', handleCancel);
        nameInput.removeEventListener('keypress', handleKeyPress);
        realmInput.removeEventListener('keypress', handleKeyPress);
        overlay.removeEventListener('click', handleOverlayClick);
    };

    // Add event listeners
    addBtn.addEventListener('click', handleAdd);
    cancelBtn.addEventListener('click', handleCancel);
    nameInput.addEventListener('keypress', handleKeyPress);
    realmInput.addEventListener('keypress', handleKeyPress);
    overlay.addEventListener('click', handleOverlayClick);
}

// Delete Character
async function deleteCharacter(charId) {
    if (!confirm('Are you sure you want to delete this character?')) return;

    try {
        const response = await fetch(`/api/characters/${charId}`, {
            method: 'DELETE'
        });

        const result = await response.json();
        if (result.success) {
            showSaveIndicator('Character deleted', 'saved');
            navigateToOverview();
            await loadData();
        } else {
            showSaveIndicator('Failed to delete character', 'error');
        }
    } catch (error) {
        showSaveIndicator('Failed to delete character', 'error');
    }
}

// Toggle between shared and custom credentials
function toggleCredentialsMode() {
    const useSharedCheckbox = document.getElementById('useSharedCredentials');
    const customSection = document.getElementById('customCredentialsSection');
    const clientIdInput = document.getElementById('clientId');
    const clientSecretInput = document.getElementById('clientSecret');

    if (useSharedCheckbox.checked) {
        // Switching to shared - hide custom fields and clear them
        customSection.style.display = 'none';
        clientIdInput.value = '';
        clientSecretInput.value = '';
    } else {
        // Switching to custom - show custom fields
        customSection.style.display = 'block';
        clientIdInput.focus();
    }
}

// API Config Save
async function saveApiConfig() {
    const useShared = document.getElementById('useSharedCredentials').checked;
    const config = {
        use_shared_credentials: useShared,
        region: document.getElementById('region').value
    };

    // Only save custom credentials if not using shared mode
    if (!useShared) {
        config.client_id = document.getElementById('clientId').value;
        config.client_secret = document.getElementById('clientSecret').value;
    }

    await saveData('/api/blizzard/config', config);
    showSaveIndicator('API config saved', 'saved');
}

// Character Sync
async function syncCharacter(charId, btn) {
    if (btn) {
        btn.disabled = true;
        btn.querySelector('svg') ? btn.querySelector('svg').style.opacity = '0.5' : null;
    }

    try {
        const response = await fetch(`/api/character/${charId}/sync`, { method: 'POST' });
        const result = await response.json();

        if (result.success) {
            showSaveIndicator('Gear synced', 'saved');
            await loadData();
        } else {
            showSaveIndicator(result.error || 'Sync failed', 'error');
        }
    } catch (error) {
        showSaveIndicator('Sync failed', 'error');
    }

    if (btn) {
        btn.disabled = false;
        btn.querySelector('svg') ? btn.querySelector('svg').style.opacity = '1' : null;
    }
}

async function syncAllCharacters() {
    try {
        const response = await fetch('/api/sync-all', { method: 'POST' });
        const result = await response.json();

        const successCount = result.results.filter(r => r.success).length;
        const total = result.results.length;
        showSaveIndicator(`Synced ${successCount}/${total} characters`, 'saved');

        await loadData();
    } catch (error) {
        showSaveIndicator('Sync all failed', 'error');
    }
}

async function resetDaily() {
    if (!confirm('Reset all daily checklists?')) return;

    await saveData('/api/reset-daily', {});
    await loadData();
    showSaveIndicator('Daily checklists reset', 'saved');
}

// Save utility
async function saveData(endpoint, data) {
    showSaveIndicator('Saving...', 'saving');

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (result.success) {
            showSaveIndicator('Saved', 'saved');
            return result;
        } else {
            showSaveIndicator('Save failed', 'error');
            return null;
        }
    } catch (error) {
        console.error('Save error:', error);
        showSaveIndicator('Save failed', 'error');
        return null;
    }
}

function showSaveIndicator(message, type) {
    const btn = document.getElementById('saveStatusBtn');
    if (!btn) return;

    const checkmark = btn.querySelector('.checkmark');
    const cross = btn.querySelector('.cross');

    // Update tooltip
    btn.title = message;

    // Reset classes
    btn.className = 'save-status-btn';

    if (type === 'saving') {
        btn.classList.add('saving');
        checkmark.style.display = 'block';
        cross.style.display = 'none';
    } else if (type === 'saved') {
        checkmark.style.display = 'block';
        cross.style.display = 'none';
        setTimeout(() => {
            btn.title = 'Saved';
            btn.className = 'save-status-btn';
        }, 2000);
    } else if (type === 'error') {
        btn.classList.add('error');
        checkmark.style.display = 'none';
        cross.style.display = 'block';
        setTimeout(() => {
            btn.title = 'Ready';
            btn.className = 'save-status-btn';
            checkmark.style.display = 'block';
            cross.style.display = 'none';
        }, 3000);
    }
}

// Utility functions
function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatTimestamp(iso) {
    const date = new Date(iso);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;

    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}


// Guided Tour with Driver.js
function startTour() {
    // Access driver.js from the global scope
    let driverConstructor = null;

    // Driver.js IIFE exports as window.driver.js.driver
    if (window.driver && window.driver.js && typeof window.driver.js.driver === 'function') {
        driverConstructor = window.driver.js.driver;
    } else {
        console.error('Driver.js not loaded correctly');
        alert('Tour library not loaded. Please refresh the page and try again.');
        return;
    }

    const driverObj = driverConstructor({
        showProgress: true,
        showButtons: ['next', 'previous', 'close'],
        popoverClass: 'hool-tour-popover',
        steps: [
            {
                element: 'body',
                popover: {
                    title: 'Welcome to Hool.gg Roster! 🎮',
                    description: 'This quick tour will show you how to set up and use the tracker for your WoW characters. Let\'s get started!',
                    side: 'center',
                    align: 'center'
                }
            },
            {
                element: '.dashboard-grid',
                popover: {
                    title: 'Character Dashboard 👤',
                    description: 'This is your character overview. Each card shows at-a-glance stats: task progress, Great Vault slots, crests, and professions. Click any card to open its full detail view.',
                    side: 'top',
                    align: 'start'
                }
            },
            {
                element: '.add-character-card',
                popover: {
                    title: 'Add Characters Here 👆',
                    description: 'Click this card to add a new WoW character. Gear sync works out of the box — no API setup needed to get started!',
                    side: 'top',
                    align: 'center'
                }
            },
            {
                element: '.tab[data-tab="settings"]',
                popover: {
                    title: 'Settings ⚙️',
                    description: 'Gear sync works automatically with a shared API key. If you ever hit rate limits, you can add your own free credentials here from develop.battle.net.',
                    side: 'bottom',
                    align: 'center'
                }
            },
            {
                element: 'body',
                popover: {
                    title: 'You\'re All Set! 🚀',
                    description: 'Add a character, then click it to explore the detail view — it includes an interactive season timeline, Great Vault tracker, BiS checklist, talent builds, and more. You can restart this tour anytime from Settings.',
                    side: 'center',
                    align: 'center'
                }
            }
        ],
        onDestroyed: () => {
            localStorage.setItem('tourCompleted', 'true');
        }
    });

    driverObj.drive();
}

// Handler for restart tour button
function restartTourHandler() {
    // Switch to dashboard tab
    const dashboardTab = document.querySelector('.tab[data-tab="dashboard"]');
    if (dashboardTab) {
        dashboardTab.click();
    }

    // Start tour after brief delay to let tab switch
    setTimeout(() => {
        startTour();
    }, 400);
}

// Auto-updater UI (Electron only)
if (window.electron) {
    const updateSection = document.getElementById('updateSection');
    const currentVersionEl = document.getElementById('currentVersion');
    const updateStatusEl = document.getElementById('updateStatus');
    const checkUpdatesBtn = document.getElementById('checkUpdatesBtn');
    const installUpdateBtn = document.getElementById('installUpdateBtn');
    const autoDownloadToggle = document.getElementById('autoDownloadToggle');

    // Show update section in packaged app
    if (updateSection) updateSection.style.display = 'block';

    // Display current app version
    currentVersionEl.textContent = 'v' + window.electron.appVersion;

    // Initialize auto-download toggle from saved preference
    if (autoDownloadToggle) {
        autoDownloadToggle.checked = window.electron.getAutoDownload();
        autoDownloadToggle.addEventListener('change', () => {
            window.electron.setAutoDownload(autoDownloadToggle.checked);
        });
    }

    // Listen for update status
    window.electron.onUpdateStatus((data) => {
        console.log('Update status:', data);

        if (data.status === 'checking') {
            updateStatusEl.textContent = 'Checking for updates...';
            updateStatusEl.style.color = 'var(--text-secondary)';
            checkUpdatesBtn.disabled = true;
            installUpdateBtn.style.display = 'none';
        } else if (data.status === 'available') {
            updateStatusEl.textContent = `Update available: v${data.version} — downloading...`;
            updateStatusEl.style.color = 'var(--hool-light-blue)';
            checkUpdatesBtn.disabled = true;
            installUpdateBtn.style.display = 'none';
        } else if (data.status === 'downloading') {
            updateStatusEl.textContent = `Downloading update... ${Math.round(data.percent)}%`;
            updateStatusEl.style.color = 'var(--text-secondary)';
            checkUpdatesBtn.disabled = true;
            installUpdateBtn.style.display = 'none';
        } else if (data.status === 'downloaded') {
            updateStatusEl.textContent = `Update v${data.version} ready to install`;
            updateStatusEl.style.color = 'var(--hool-primary-blue)';
            checkUpdatesBtn.disabled = true;
            installUpdateBtn.style.display = 'inline-block';
        } else if (data.status === 'up-to-date') {
            updateStatusEl.textContent = 'App is up to date';
            updateStatusEl.style.color = 'var(--text-muted)';
            checkUpdatesBtn.disabled = false;
            installUpdateBtn.style.display = 'none';
        } else if (data.status === 'error') {
            updateStatusEl.textContent = data.message;
            updateStatusEl.style.color = 'var(--text-secondary)';
            checkUpdatesBtn.disabled = false;
            installUpdateBtn.style.display = 'none';
        } else if (data.status === 'dev-mode') {
            updateStatusEl.textContent = 'Development mode (updates disabled)';
            updateStatusEl.style.color = 'var(--text-muted)';
            checkUpdatesBtn.disabled = true;
        }
    });

    // Check for updates button
    checkUpdatesBtn?.addEventListener('click', () => {
        window.electron.checkForUpdates();
    });

    // Install update button
    installUpdateBtn?.addEventListener('click', () => {
        window.electron.installUpdate();
    });
}
