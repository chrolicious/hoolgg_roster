// Warband HQ - Frontend Logic

let appData = null;
let saveTimeout = null;

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
}

// Setup global event listeners
function setupEventListeners() {
    // Week selector
    const weekSelect = document.getElementById('weekSelect');
    if (weekSelect) {
        weekSelect.addEventListener('change', async (e) => {
            const newWeek = parseInt(e.target.value);
            await saveData('/api/meta', { current_week: newWeek });
            await loadData();
        });
    }

    // Sync all button (handled in renderDashboard since it's dynamic)

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
    renderWeekSelector();
    renderDashboard();
    renderTimeline();
    renderCrestLedger();
    renderProfessionHub();
    renderSettings();
}

// Week Selector
function renderWeekSelector() {
    const select = document.getElementById('weekSelect');
    if (!select) return;

    select.innerHTML = '';

    for (let i = 0; i <= 12; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = i === 0 ? 'Pre-Season' : `Week ${i}`;
        if (i === appData.meta.current_week) {
            option.selected = true;
        }
        select.appendChild(option);
    }
}

// Dashboard
function renderDashboard() {
    const container = document.getElementById('dashboard');
    const dashboardGrid = container.querySelector('.dashboard-grid');

    // Render weekly maintenance section
    const weeklySection = renderWeeklyMaintenance();
    const existingWeekly = container.querySelector('.weekly-maintenance-section');
    if (existingWeekly) {
        existingWeekly.replaceWith(weeklySection);
    } else {
        container.insertBefore(weeklySection, dashboardGrid);
    }

    // Add sync button if it doesn't exist
    let syncContainer = container.querySelector('.sync-all-container');
    if (!syncContainer) {
        syncContainer = document.createElement('div');
        syncContainer.className = 'sync-all-container';
        syncContainer.innerHTML = '<button class="sync-all-btn" id="syncAllBtn">Sync All Gear from Blizzard API</button>';
        container.insertBefore(syncContainer, dashboardGrid);
        // Reattach event listener
        document.getElementById('syncAllBtn').addEventListener('click', syncAllCharacters);
    }

    // Render character cards or empty state
    const grid = document.getElementById('dashboardGrid');
    grid.innerHTML = '';

    if (appData.characters.length === 0) {
        // Show empty state
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-state';
        emptyState.innerHTML = `
            <div class="empty-state-icon">
                <img src="/static/cool-doge.gif" alt="Cool Doge" />
            </div>
            <h3>No Characters Added Yet</h3>
            <p>Get started by adding your WoW characters to track their progression!</p>
            <button class="btn-primary" onclick="document.querySelector('.tab[data-tab=\\'settings\\']').click()">
                Go to Settings
            </button>
        `;
        grid.appendChild(emptyState);
    } else {
        // Show character cards
        appData.characters.forEach(char => {
            const card = createCharacterCard(char);
            grid.appendChild(card);
        });
    }
}

function renderWeeklyMaintenance() {
    const section = document.createElement('div');
    section.className = 'weekly-maintenance-section';

    if (!appData.weekly_tasks) {
        section.innerHTML = '<p class="text-muted">No tasks configured</p>';
        return section;
    }

    const weeklyTasks = appData.weekly_tasks.weekly || [];
    const weekName = appData.weekly_tasks.name || 'Week ' + appData.meta.current_week;

    section.innerHTML = `
        <div class="settings-section" style="margin-bottom: 24px; position: relative;">
            <div class="target-display" style="position: absolute; top: 12px; right: 12px;">
                Target ilvl: <strong id="targetIlvl">${appData.weekly_target}</strong>
            </div>
            <h3>📋 Weekly Maintenance - ${weekName}</h3>
            <p class="text-muted" style="margin-bottom: 16px;">Complete these tasks across all characters this week</p>
            <div class="weekly-task-grid">
                ${weeklyTasks.map(task => `
                    <div class="weekly-task-item">
                        <strong>${task.label}</strong>
                    </div>
                `).join('')}
            </div>
        </div>
    `;

    return section;
}

function createCharacterCard(char) {
    const card = document.createElement('div');
    card.className = 'character-card-enhanced';
    card.draggable = true;
    card.dataset.charId = char.id;

    const delta = char.avg_ilvl - appData.weekly_target;
    const deltaClass = delta >= 0 ? 'positive' : 'negative';
    const deltaSign = delta >= 0 ? '+' : '';

    const lastSync = char.last_gear_sync
        ? `Last sync: ${formatTimestamp(char.last_gear_sync)}`
        : 'Not synced';

    const avatarUrl = char.avatar_url || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%232a2a2a"/%3E%3C/svg%3E';
    const classColor = getClassColor(char.class);

    card.innerHTML = `
        <div class="char-header">
            <div class="char-avatar-container">
                <img src="${avatarUrl}" alt="${char.character_name || char.name}" class="char-avatar">
            </div>
            <div class="char-info">
                <h3 style="color: ${classColor}">${char.character_name || char.name}</h3>
                <div class="ilvl-display">
                    ${char.avg_ilvl}
                    <span class="ilvl-delta ${deltaClass}">${deltaSign}${delta.toFixed(1)}</span>
                </div>
                <div class="last-sync">${lastSync}</div>
            </div>
            <button class="sync-btn-compact" data-char-id="${char.id}" title="Sync from Blizzard API">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
                </svg>
            </button>
        </div>

        <div class="char-stats">
            ${renderCharacterStats(char)}
        </div>

        <div class="char-gear-section">
            <div class="collapsible-header" data-target="gear-${char.id}">
                <h4>
                    <svg class="collapse-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                    Equipment
                </h4>
            </div>
            <div class="collapsible-content collapsed" id="gear-${char.id}">
                ${renderGearGrid(char.gear)}
            </div>
        </div>

        <div class="tasks-container">
            <div class="weekly-tasks-section">
                <h4 style="margin-bottom: 8px;">Weekly Tasks</h4>
                ${renderWeeklyTasksForCharacter(char)}
            </div>

            <div class="daily-checklist">
                <h4>Daily Tasks</h4>
                ${renderDailyChecklist(char)}
            </div>
        </div>

        <div class="crest-summary">
            <h4 style="margin-bottom: 8px;">Weekly Crests</h4>
            ${renderCrestSummary(char)}
        </div>
    `;

    // Sync button
    card.querySelector('.sync-btn-compact').addEventListener('click', () => syncCharacter(char.id));

    // Collapsible gear section only
    const gearHeader = card.querySelector('.collapsible-header[data-target^="gear-"]');
    if (gearHeader) {
        gearHeader.addEventListener('click', (e) => {
            const targetId = e.currentTarget.dataset.target;
            const content = card.querySelector(`#${targetId}`);
            const icon = e.currentTarget.querySelector('.collapse-icon');

            content.classList.toggle('collapsed');
            icon.classList.toggle('rotated');

            // Save collapse state to localStorage
            saveCollapseState(targetId, !content.classList.contains('collapsed'));
        });

        // Restore collapse state from localStorage
        const targetId = gearHeader.dataset.target;
        const isExpanded = getCollapseState(targetId);
        if (isExpanded) {
            const content = card.querySelector(`#${targetId}`);
            const icon = gearHeader.querySelector('.collapse-icon');
            content.classList.remove('collapsed');
            icon.classList.add('rotated');
        }
    }

    // Daily and weekly checklist events
    setupChecklistEvents(card, char.id);

    // Drag and drop events
    setupDragAndDrop(card);

    return card;
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
let draggedCard = null;

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
        document.querySelectorAll('.character-card-enhanced').forEach(c => {
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
    const cards = Array.from(grid.querySelectorAll('.character-card-enhanced'));
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

// Timeline
function renderTimeline() {
    const container = document.getElementById('timelineContent');
    container.innerHTML = '';

    const weeks = [
        {
            number: 0,
            name: 'Pre-Season Prep (Mar 2-16)',
            milestones: [
                'Level all your characters to max level (90)',
                'Unlock Delves up to Tier 8 or Tier 11 on all characters',
                'Farm random heroic dungeons for ilvl 224 gear',
                'Complete world quests for initial upgrades',
                'Fill vault slots (Champion track gear possible)',
                'Darkmoon Faire opens Sunday for faster leveling',
                'Prepare professions for crafting',
                'Target: 215 ilvl baseline for Week 1'
            ]
        },
        {
            number: 1,
            name: 'Heroic Week (Mar 17)',
            milestones: [
                'Complete LFR for tier pieces on all characters (unlock catalyst charges)',
                'Mythic 0 tour (8 dungeons) on all characters',
                'Kill world boss daily on all characters',
                'Complete Prey quest on all characters',
                'Farm high-level Delves with coffer keys',
                'Clear Normal raid',
                'Clear Heroic raid',
                'DO NOT spend Heroic/Mythic crests yet',
                'Target: 235 ilvl'
            ]
        },
        {
            number: 2,
            name: 'Mythic+ Opens (Mar 24)',
            milestones: [
                'Mythic raiding begins',
                'Mythic+ dungeons open',
                'Farm M+10s minimum for gear on all characters',
                'Continue LFR for tier pieces on all characters',
                'Farm Delves for crests',
                'Fill 3 vault slots (6x M+10) on all characters',
                'DO NOT spend Heroic/Mythic crests yet',
                'Target: 235 ilvl'
            ]
        },
        {
            number: 3,
            name: 'Final Raid Opens (Mar 31)',
            milestones: [
                'March on Quel\'danas raid unlocks',
                'Complete full raid reclear before mythic progression',
                'Farm M+12s for vault slots and crests',
                'Begin spending Heroic/Mythic crests safely',
                'Target: 250 ilvl'
            ]
        },
        {
            number: 4,
            name: 'Steady Progression (Apr 7)',
            milestones: [
                'Continue M+12 farming',
                'Ongoing mythic raid progression',
                'Use crafting sparks for BiS pieces',
                'Upgrade gear with crests',
                'Target: 250 ilvl'
            ]
        },
        {
            number: 5,
            name: 'Week 5 Progression',
            milestones: [
                'Continue M+12 farming on all characters',
                'Mythic raid progression',
                'Fill vault slots weekly on all characters',
                'Work toward 4-set Tier bonus on all characters',
                'Target: 265 ilvl'
            ]
        },
        {
            number: 6,
            name: 'Week 6 Progression',
            milestones: [
                '4-set Tier priority for all characters',
                'Upgrade crafted gear pieces',
                'Push M+12s for gear and crests on all characters',
                'Mythic raid progression',
                'Target: 265 ilvl'
            ]
        },
        {
            number: 7,
            name: 'Week 7 Progression',
            milestones: [
                'Second Spark of Omen available',
                'Complete 4-set Tier on all characters',
                'Continue M+12 farming on all characters',
                'Target: 265 ilvl'
            ]
        },
        {
            number: 8,
            name: 'Week 8 Progression',
            milestones: [
                'Push for BiS trinkets and weapons',
                'Optimize secondary stats',
                'High mythic raid progression',
                'Continue vault filling',
                'Target: 265 ilvl'
            ]
        },
        {
            number: 9,
            name: 'Week 9 Optimization',
            milestones: [
                'Mythic Track upgrades priority',
                'Farm specific BiS items on all characters',
                '4-set Tier completion on all characters',
                'Perfect gear min-maxing',
                'Target: 280 ilvl'
            ]
        },
        {
            number: 10,
            name: 'Week 10 Optimization',
            milestones: [
                'BiS optimization across warband',
                'Continue mythic raid progression',
                'Maximize all crest usage',
                'Fill all vault slots',
                'Target: 280 ilvl'
            ]
        },
        {
            number: 11,
            name: 'Week 11 Refinement',
            milestones: [
                'Final gear min-maxing on all characters',
                'Perfect secondary stat allocation',
                'Complete any missing BiS pieces',
                'All characters pushing 280+ ilvl',
                'Target: 280 ilvl'
            ]
        },
        {
            number: 12,
            name: 'Week 12 Completion',
            milestones: [
                'All characters at or above target ilvl',
                'Full 4-set Tier across entire warband',
                'BiS trinkets and weapons secured on all characters',
                'Ready for next content phase',
                'Target: 280 ilvl'
            ]
        }
    ];

    weeks.forEach(week => {
        const item = document.createElement('div');
        item.className = 'week-item';
        if (week.number === appData.meta.current_week) {
            item.classList.add('current');
        }

        item.innerHTML = `
            <h3>
                <span class="week-number">Week ${week.number}</span>
                ${week.name ? `<span style="color: var(--text-secondary); font-weight: var(--font-weight-normal); margin-left: 8px;">- ${week.name}</span>` : ''}
            </h3>
            <ul>
                ${week.milestones.map(m => `<li>${m}</li>`).join('')}
            </ul>
        `;

        container.appendChild(item);
    });
}

// Crest Ledger
function renderCrestLedger() {
    const table = document.getElementById('crestTable');
    const crestTypes = ['weathered', 'carved', 'runed', 'gilded'];

    let html = `
        <thead>
            <tr>
                <th>Character</th>
                ${crestTypes.map(type => {
                    const iconUrl = getCrestIcon(type);
                    return `<th>
                        <div class="crest-header">
                            <img src="${iconUrl}" alt="${type}" class="crest-icon-header" onerror="handleCrestIconError(this, '${type}')" />
                            ${capitalize(type)}
                        </div>
                    </th>`;
                }).join('')}
            </tr>
        </thead>
        <tbody>
    `;

    appData.characters.forEach(char => {
        const classColor = getClassColor(char.class);
        html += `<tr>`;
        html += `<td><strong style="color: ${classColor}">${char.character_name || char.name}</strong></td>`;

        crestTypes.forEach(type => {
            const crest = char.crests[type];
            const isCapped = crest.collected_this_week >= 90;
            const badge = isCapped ? '<span class="cap-badge">CAP</span>' : '';

            html += `
                <td>
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                        <input type="number"
                               min="0"
                               value="${crest.collected_this_week}"
                               data-char-id="${char.id}"
                               data-crest-type="${type}"
                               placeholder="This week"
                               style="flex: 1;">
                        ${badge}
                    </div>
                    <div class="crest-total-display">
                        Total: <strong>${crest.total_collected}</strong>
                    </div>
                    <div class="progress-indicator">
                        ${crest.collected_this_week}/90 this week
                    </div>
                </td>
            `;
        });

        html += `</tr>`;
    });

    html += `</tbody>`;
    table.innerHTML = html;

    // Setup crest input events
    table.querySelectorAll('input[type="number"]').forEach(input => {
        input.addEventListener('change', async (e) => {
            const charId = parseInt(e.target.dataset.charId);
            const crestType = e.target.dataset.crestType;
            const value = parseInt(e.target.value) || 0;

            const updates = {
                crest_type: crestType,
                collected_this_week: value
            };

            await saveData(`/api/character/${charId}/crests`, updates);
            await loadData();
        });
    });
}

// Profession Hub
function renderProfessionHub() {
    const table = document.getElementById('professionTable');

    const allProfessions = ['Alchemy', 'Blacksmithing', 'Enchanting', 'Engineering',
                            'Herbalism', 'Inscription', 'Jewelcrafting', 'Leatherworking',
                            'Mining', 'Skinning', 'Tailoring'];

    let html = `
        <thead>
            <tr>
                <th>Character</th>
                <th>Profession</th>
                <th>Weekly Tasks</th>
                <th>Knowledge Points</th>
                <th>Concentration</th>
            </tr>
        </thead>
        <tbody>
    `;

    appData.characters.forEach((char, charIdx) => {
        const classColor = getClassColor(char.class);

        // Show 2 profession slots per character (even if empty)
        for (let profIndex = 0; profIndex < 2; profIndex++) {
            const profName = char.professions[profIndex] || '';
            const prof = profName ? char.profession_progress[profName] : {
                weekly_quest: false,
                patron_orders: false,
                treatise: false,
                knowledge_points: 0,
                concentration: 1000
            };

            html += `
                <tr class="profession-row">
                    ${profIndex === 0 ? `<td rowspan="2" class="char-name-cell"><strong style="color: ${classColor}">${char.character_name || char.name}</strong></td>` : ''}
                    <td>
                        <select class="profession-dropdown" data-char-id="${char.id}" data-prof-index="${profIndex}">
                            <option value="">-- Select Profession --</option>
                            ${allProfessions.map(p => `<option value="${p}" ${profName === p ? 'selected' : ''}>${p}</option>`).join('')}
                        </select>
                    </td>
                    <td>
                        ${profName ? `
                            <div class="toggle-group">
                                <label class="toggle-label">
                                    <input type="checkbox"
                                           data-char-id="${char.id}"
                                           data-profession="${profName}"
                                           data-field="weekly_quest"
                                           ${prof.weekly_quest ? 'checked' : ''}>
                                    Quest
                                </label>
                                <label class="toggle-label">
                                    <input type="checkbox"
                                           data-char-id="${char.id}"
                                           data-profession="${profName}"
                                           data-field="patron_orders"
                                           ${prof.patron_orders ? 'checked' : ''}>
                                    Orders
                                </label>
                                <label class="toggle-label">
                                    <input type="checkbox"
                                           data-char-id="${char.id}"
                                           data-profession="${profName}"
                                           data-field="treatise"
                                           ${prof.treatise ? 'checked' : ''}>
                                    Treatise
                                </label>
                            </div>
                        ` : '<span class="text-muted">Select a profession</span>'}
                    </td>
                    <td>
                        ${profName ? `
                            <input type="number"
                                   class="number-input"
                                   min="0"
                                   value="${prof.knowledge_points}"
                                   data-char-id="${char.id}"
                                   data-profession="${profName}"
                                   data-field="knowledge_points">
                        ` : ''}
                    </td>
                    <td>
                        ${profName ? `
                            <input type="number"
                                   class="number-input"
                                   min="0"
                                   max="1000"
                                   value="${prof.concentration}"
                                   data-char-id="${char.id}"
                                   data-profession="${profName}"
                                   data-field="concentration">
                        ` : ''}
                    </td>
                </tr>
            `;
        }
    });

    html += `</tbody>`;
    table.innerHTML = html;

    // Setup profession dropdown events
    table.querySelectorAll('.profession-dropdown').forEach(select => {
        select.addEventListener('change', async (e) => {
            const charId = parseInt(e.target.dataset.charId);
            const profIndex = parseInt(e.target.dataset.profIndex);
            const char = appData.characters.find(c => c.id === charId);

            if (!char) return;

            // Update professions array
            const newProfessions = [...char.professions];
            while (newProfessions.length < 2) newProfessions.push('');
            newProfessions[profIndex] = e.target.value;

            // Update via API
            try {
                const response = await fetch(`/api/characters/${charId}/professions`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ professions: newProfessions })
                });

                const result = await response.json();
                if (result.success) {
                    showSaveIndicator('Profession updated', 'saved');
                    await loadData();
                } else {
                    showSaveIndicator('Failed to update profession', 'error');
                }
            } catch (error) {
                showSaveIndicator('Failed to update profession', 'error');
            }
        });
    });

    // Setup profession events
    table.querySelectorAll('input[type="checkbox"], input[type="number"]').forEach(input => {
        input.addEventListener('change', async (e) => {
            const charId = parseInt(e.target.dataset.charId);
            const profession = e.target.dataset.profession;
            const field = e.target.dataset.field;

            let value;
            if (e.target.type === 'checkbox') {
                value = e.target.checked;
            } else {
                value = parseInt(e.target.value) || 0;
            }

            const updates = {
                profession: profession,
                [field]: value
            };

            await saveData(`/api/character/${charId}/profession`, updates);
        });
    });
}

// Settings
function renderSettings() {
    // Load API config
    document.getElementById('clientId').value = appData.blizzard_config.client_id || '';
    document.getElementById('clientSecret').value = appData.blizzard_config.client_secret || '';
    document.getElementById('region').value = appData.blizzard_config.region || 'us';

    // Render character configs
    const grid = document.getElementById('characterConfigGrid');
    grid.innerHTML = '';

    // Add "Add Character" button
    const addBtn = document.createElement('div');
    addBtn.className = 'character-config-card add-character-card';
    addBtn.style.cursor = 'pointer';
    addBtn.style.display = 'flex';
    addBtn.style.flexDirection = 'column';
    addBtn.style.alignItems = 'center';
    addBtn.style.justifyContent = 'center';
    addBtn.style.gap = '12px';
    addBtn.innerHTML = `
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" style="color: var(--hool-primary-blue);">
            <circle cx="12" cy="12" r="10" stroke-width="2"/>
            <line x1="12" y1="8" x2="12" y2="16" stroke-width="2"/>
            <line x1="8" y1="12" x2="16" y2="12" stroke-width="2"/>
        </svg>
        <h4 style="margin: 0; color: var(--hool-primary-blue);">Add Character</h4>
    `;
    addBtn.addEventListener('click', (e) => {
        console.log('Add character button clicked!');
        e.preventDefault();
        e.stopPropagation();
        addCharacter();
    });
    console.log('Add character button created and attached to grid');
    grid.appendChild(addBtn);

    appData.characters.forEach(char => {
        const card = document.createElement('div');
        card.className = 'character-config-card';

        card.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                <h4 style="margin: 0;">${char.character_name || char.name}</h4>
                <button class="btn-danger-sm" onclick="deleteCharacter(${char.id})" style="padding: 4px 10px; font-size: var(--font-size-sm); background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); color: #FCA5A5; border-radius: 6px; cursor: pointer;">Delete</button>
            </div>
            <div class="form-group">
                <label>Character Name</label>
                <input type="text"
                       value="${char.character_name || char.name}"
                       placeholder="e.g., Mytank"
                       data-char-id="${char.id}"
                       data-field="character_name">
            </div>
            <div class="form-group">
                <label>Realm</label>
                <input type="text"
                       value="${char.realm}"
                       placeholder="e.g., Area-52"
                       data-char-id="${char.id}"
                       data-field="realm">
            </div>
        `;

        grid.appendChild(card);

        // Setup character config events
        card.querySelectorAll('input').forEach(input => {
            input.addEventListener('change', async (e) => {
                const charId = parseInt(e.target.dataset.charId);
                const field = e.target.dataset.field;
                const value = e.target.value;

                const updates = {};
                updates[field] = value;

                await saveData(`/api/character/${charId}/config`, updates);
                await loadData();
            });
        });
    });
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
            await loadData();
        } else {
            showSaveIndicator('Failed to delete character', 'error');
        }
    } catch (error) {
        showSaveIndicator('Failed to delete character', 'error');
    }
}

// API Config Save
async function saveApiConfig() {
    const config = {
        client_id: document.getElementById('clientId').value,
        client_secret: document.getElementById('clientSecret').value,
        region: document.getElementById('region').value
    };

    await saveData('/api/blizzard/config', config);
    showSaveIndicator('API config saved', 'saved');
}

// Character Sync
async function syncCharacter(charId) {
    const btn = event.target;
    btn.disabled = true;
    btn.textContent = 'Syncing...';

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

    btn.disabled = false;
    btn.textContent = 'Sync';
}

async function syncAllCharacters() {
    const btn = document.getElementById('syncAllBtn');
    btn.disabled = true;
    btn.textContent = 'Syncing all characters...';

    try {
        const response = await fetch('/api/sync-all', { method: 'POST' });
        const result = await response.json();

        const successCount = result.results.filter(r => r.success).length;
        showSaveIndicator(`Synced ${successCount}/6 characters`, 'saved');

        await loadData();
    } catch (error) {
        showSaveIndicator('Sync all failed', 'error');
    }

    btn.disabled = false;
    btn.textContent = 'Sync All Gear from Blizzard API';
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
                element: '#weekSelect',
                popover: {
                    title: 'Week Selector',
                    description: 'Select the current week of the season. This determines which weekly tasks and target item levels to display. Start with "Pre-Season" if the season hasn\'t begun yet.',
                    side: 'bottom',
                    align: 'center'
                }
            },
            {
                element: '.tab[data-tab="settings"]',
                popover: {
                    title: 'First: Configure API Settings ⚙️',
                    description: 'Click here to go to Settings where you\'ll enter your Blizzard API credentials. This allows the app to automatically sync your character gear from the Armory.',
                    side: 'bottom',
                    align: 'center'
                }
            },
            {
                element: '.weekly-maintenance-section',
                popover: {
                    title: 'Weekly Maintenance Tasks 📋',
                    description: 'These are the key tasks to complete each week across all your characters. The tasks update based on the selected week.',
                    side: 'bottom',
                    align: 'start'
                }
            },
            {
                element: '.target-display',
                popover: {
                    title: 'Target Item Level 🎯',
                    description: 'This shows the target average item level for the current week. Your character cards will display how far above or below this target each character is.',
                    side: 'left',
                    align: 'start'
                }
            },
            {
                element: '.sync-all-btn',
                popover: {
                    title: 'Sync All Gear 🔄',
                    description: 'After setting up your API credentials, click this button to automatically fetch current gear for all your characters from the Blizzard Armory.',
                    side: 'top',
                    align: 'center'
                }
            },
            {
                element: '.dashboard-grid',
                popover: {
                    title: 'Character Cards 👤',
                    description: 'Each card shows a character\'s current gear, stats, and weekly/daily tasks. You can drag cards to reorder them. Click the sync button on individual cards to update just that character.',
                    side: 'top',
                    align: 'start'
                }
            },
            {
                element: '.tab[data-tab="timeline"]',
                popover: {
                    title: 'Timeline Tab 📅',
                    description: 'View weekly milestones and goals for the entire season. This helps you plan ahead and track progression week by week.',
                    side: 'bottom',
                    align: 'center'
                }
            },
            {
                element: '.tab[data-tab="crest-ledger"]',
                popover: {
                    title: 'Crest Ledger 💎',
                    description: 'Track your weekly crest earnings across all characters. Stay on top of your upgrade resources and plan your gear improvements.',
                    side: 'bottom',
                    align: 'center'
                }
            },
            {
                element: '.tab[data-tab="profession-hub"]',
                popover: {
                    title: 'Profession Hub 🔨',
                    description: 'Manage your characters\' professions, track knowledge points, and plan your crafting progression.',
                    side: 'bottom',
                    align: 'center'
                }
            },
            {
                element: 'body',
                popover: {
                    title: 'You\'re All Set! 🚀',
                    description: 'Now head to Settings to configure your Blizzard API credentials, then start tracking your characters! You can restart this tour anytime from the Settings page.',
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

