const THEMES = {
    midnight: {
        '--primary': '#818cf8',
        '--primary-hover': '#6366f1',
        '--accent': '#2dd4bf',
        '--danger': '#ef4444',
        '--danger-hover': '#dc2626',
        '--bg': '#020617',
        '--panel-bg': 'rgba(15, 23, 42, 0.6)',
        '--card-bg': 'rgba(30, 41, 59, 0.4)',
        '--input-bg': 'rgba(15, 23, 42, 0.85)',
        '--text-main': '#f1f5f9',
        '--text-dim': '#94a3b8',
        '--glass-border': 'rgba(255, 255, 255, 0.1)',
        '--bg-gradient-1': 'rgba(129, 140, 248, 0.05)',
        '--bg-gradient-2': 'rgba(45, 212, 191, 0.04)',
        '--bg-primary': '#020617',
        '--accent-primary': '#818cf8',
        '--accent-secondary': '#2dd4bf',
        '--premium-surface-card': 'rgba(30, 41, 59, 0.4)'
    },
    sage: {
        '--primary': '#10b981',
        '--primary-hover': '#059669',
        '--accent': '#34d399',
        '--danger': '#f87171',
        '--danger-hover': '#ef4444',
        '--bg': '#040d0a',
        '--panel-bg': 'rgba(11, 27, 22, 0.6)',
        '--card-bg': 'rgba(16, 38, 31, 0.4)',
        '--input-bg': 'rgba(11, 27, 22, 0.85)',
        '--text-main': '#ecfdf5',
        '--text-dim': '#a7f3d0',
        '--glass-border': 'rgba(52, 211, 153, 0.1)',
        '--bg-gradient-1': 'rgba(16, 185, 129, 0.04)',
        '--bg-gradient-2': 'rgba(52, 211, 153, 0.03)',
        '--bg-primary': '#040d0a',
        '--accent-primary': '#10b981',
        '--accent-secondary': '#34d399',
        '--premium-surface-card': 'rgba(16, 38, 31, 0.4)'
    },
    sepia: {
        '--primary': '#b45309',
        '--primary-hover': '#92400e',
        '--accent': '#0f766e',
        '--danger': '#be123c',
        '--danger-hover': '#9f1239',
        '--bg': '#fcf8ed',
        '--panel-bg': 'rgba(240, 234, 214, 0.8)',
        '--card-bg': 'rgba(230, 222, 198, 0.5)',
        '--input-bg': 'rgba(240, 234, 214, 0.9)',
        '--text-main': '#2b2621',
        '--text-dim': '#6e6255',
        '--glass-border': 'rgba(0, 0, 0, 0.08)',
        '--bg-gradient-1': 'rgba(180, 83, 9, 0.03)',
        '--bg-gradient-2': 'rgba(15, 118, 110, 0.02)',
        '--bg-primary': '#fcf8ed',
        '--accent-primary': '#b45309',
        '--accent-secondary': '#0f766e',
        '--premium-surface-card': 'rgba(230, 222, 198, 0.5)'
    },
    frost: {
        '--primary': '#38bdf8',
        '--primary-hover': '#0ea5e9',
        '--accent': '#a5f3fc',
        '--danger': '#f87171',
        '--danger-hover': '#ef4444',
        '--bg': '#0f172a',
        '--panel-bg': 'rgba(30, 41, 59, 0.7)',
        '--card-bg': 'rgba(51, 65, 85, 0.4)',
        '--input-bg': 'rgba(15, 23, 42, 0.85)',
        '--text-main': '#f8fafc',
        '--text-dim': '#94a3b8',
        '--glass-border': 'rgba(148, 163, 184, 0.15)',
        '--bg-gradient-1': 'rgba(56, 189, 248, 0.06)',
        '--bg-gradient-2': 'rgba(165, 243, 252, 0.05)',
        '--bg-primary': '#0f172a',
        '--accent-primary': '#38bdf8',
        '--accent-secondary': '#a5f3fc',
        '--premium-surface-card': 'rgba(51, 65, 85, 0.4)'
    },
    // --- 10 PREMIUM SHOP THEMES ---
    cyberpunk: {
        '--primary': '#00f0ff',
        '--primary-hover': '#00b8c4',
        '--accent': '#ff007f',
        '--danger': '#ff3333',
        '--danger-hover': '#cc0000',
        '--bg': '#000000',
        '--panel-bg': 'rgba(10, 10, 10, 0.85)',
        '--card-bg': 'rgba(20, 20, 20, 0.9)',
        '--input-bg': 'rgba(5, 5, 5, 0.95)',
        '--text-main': '#00f0ff',
        '--text-dim': '#ff007f',
        '--glass-border': 'rgba(255, 0, 127, 0.35)',
        '--bg-gradient-1': 'rgba(0, 240, 255, 0.08)',
        '--bg-gradient-2': 'rgba(255, 0, 127, 0.06)',
        '--bg-primary': '#000000',
        '--accent-primary': '#00f0ff',
        '--accent-secondary': '#ff007f',
        '--premium-surface-card': 'rgba(20, 20, 20, 0.9)'
    },
    obsidian: {
        '--primary': '#ffffff',
        '--primary-hover': '#e2e8f0',
        '--accent': '#ffffff',
        '--danger': '#be123c',
        '--danger-hover': '#9f1239',
        '--bg': '#0f0f11',
        '--panel-bg': 'rgba(21, 21, 24, 0.85)',
        '--card-bg': '#151518',
        '--input-bg': '#0f0f11',
        '--text-main': '#ffffff',
        '--text-dim': '#8e8e93',
        '--glass-border': 'rgba(255, 255, 255, 0.04)',
        '--bg-gradient-1': 'rgba(255, 255, 255, 0.01)',
        '--bg-gradient-2': 'rgba(255, 255, 255, 0.01)',
        '--bg-primary': '#0f0f11',
        '--accent-primary': '#ffffff',
        '--accent-secondary': '#ffffff',
        '--premium-surface-card': '#151518'
    },
    tokyomidnight: {
        '--primary': '#9d8df2',
        '--primary-hover': '#8673eb',
        '--accent': '#8df2bc',
        '--danger': '#ff9e64',
        '--danger-hover': '#ff7a29',
        '--bg': '#0b0d16',
        '--panel-bg': 'rgba(18, 21, 36, 0.8)',
        '--card-bg': '#121524',
        '--input-bg': '#0b0d16',
        '--text-main': '#c5cbe8',
        '--text-dim': '#9ca3af',
        '--glass-border': 'rgba(157, 141, 242, 0.15)',
        '--bg-gradient-1': 'rgba(157, 141, 242, 0.06)',
        '--bg-gradient-2': 'rgba(255, 158, 100, 0.05)',
        '--bg-primary': '#0b0d16',
        '--accent-primary': '#9d8df2',
        '--accent-secondary': '#ff9e64',
        '--premium-surface-card': '#121524'
    },
    cafealchemy: {
        '--primary': '#d4a373',
        '--primary-hover': '#c68d54',
        '--accent': '#52796f',
        '--danger': '#e07a5f',
        '--danger-hover': '#d96241',
        '--bg': '#1a0f0a',
        '--panel-bg': 'rgba(44, 27, 18, 0.75)',
        '--card-bg': '#2c1b12',
        '--input-bg': '#1a0f0a',
        '--text-main': '#fdfbf7',
        '--text-dim': '#d4a373',
        '--glass-border': 'rgba(212, 163, 115, 0.15)',
        '--bg-gradient-1': 'rgba(212, 163, 115, 0.05)',
        '--bg-gradient-2': 'rgba(82, 121, 111, 0.04)',
        '--bg-primary': '#1a0f0a',
        '--accent-primary': '#d4a373',
        '--accent-secondary': '#52796f',
        '--premium-surface-card': '#2c1b12'
    },
    solarizedonyx: {
        '--primary': '#b58900',
        '--primary-hover': '#997300',
        '--accent': '#2aa198',
        '--danger': '#dc322f',
        '--danger-hover': '#cb2421',
        '--bg': '#07221d',
        '--panel-bg': 'rgba(10, 47, 40, 0.8)',
        '--card-bg': '#0a2f28',
        '--input-bg': '#07221d',
        '--text-main': '#93a1a1',
        '--text-dim': '#586e75',
        '--glass-border': 'rgba(181, 137, 0, 0.25)',
        '--bg-gradient-1': 'rgba(181, 137, 0, 0.06)',
        '--bg-gradient-2': 'rgba(42, 161, 152, 0.05)',
        '--bg-primary': '#07221d',
        '--accent-primary': '#b58900',
        '--accent-secondary': '#2aa198',
        '--premium-surface-card': '#0a2f28'
    },
    quantummirage: {
        '--primary': '#0066ff',
        '--primary-hover': '#0052cc',
        '--accent': '#00f0ff',
        '--danger': '#ff0055',
        '--danger-hover': '#cc0044',
        '--bg': '#010103',
        '--panel-bg': 'rgba(9, 9, 15, 0.85)',
        '--card-bg': '#09090f',
        '--input-bg': '#010103',
        '--text-main': '#a0a0a5',
        '--text-dim': '#52525b',
        '--glass-border': 'rgba(0, 102, 255, 0.2)',
        '--bg-gradient-1': 'rgba(0, 102, 255, 0.05)',
        '--bg-gradient-2': 'rgba(0, 240, 255, 0.04)',
        '--bg-primary': '#010103',
        '--accent-primary': '#0066ff',
        '--accent-secondary': '#00f0ff',
        '--premium-surface-card': '#09090f'
    },
    nordicfrost: {
        '--primary': '#1d4ed8',
        '--primary-hover': '#1e40af',
        '--accent': '#10b981',
        '--danger': '#ef4444',
        '--danger-hover': '#dc2626',
        '--bg': '#eef2f7',
        '--panel-bg': 'rgba(255, 255, 255, 0.65)',
        '--card-bg': 'rgba(255, 255, 255, 0.45)',
        '--input-bg': 'rgba(255, 255, 255, 0.85)',
        '--text-main': '#1e293b',
        '--text-dim': '#64748b',
        '--glass-border': 'rgba(29, 78, 216, 0.12)',
        '--bg-gradient-1': 'rgba(29, 78, 216, 0.04)',
        '--bg-gradient-2': 'rgba(16, 185, 129, 0.04)',
        '--bg-primary': '#eef2f7',
        '--accent-primary': '#1d4ed8',
        '--accent-secondary': '#10b981',
        '--premium-surface-card': 'rgba(255, 255, 255, 0.45)'
    },
    crimsonvintage: {
        '--primary': '#800020',
        '--primary-hover': '#600018',
        '--accent': '#c5a059',
        '--danger': '#a62c2b',
        '--danger-hover': '#802221',
        '--bg': '#141416',
        '--panel-bg': 'rgba(29, 29, 32, 0.85)',
        '--card-bg': '#1d1d20',
        '--input-bg': '#141416',
        '--text-main': '#f4f1ea',
        '--text-dim': '#c5a059',
        '--glass-border': 'rgba(197, 160, 89, 0.2)',
        '--bg-gradient-1': 'rgba(128, 0, 32, 0.06)',
        '--bg-gradient-2': 'rgba(197, 160, 89, 0.04)',
        '--bg-primary': '#141416',
        '--accent-primary': '#800020',
        '--accent-secondary': '#c5a059',
        '--premium-surface-card': '#1d1d20'
    },
    vaporwavenostalgia: {
        '--primary': '#ff007f',
        '--primary-hover': '#e60072',
        '--accent': '#00f0ff',
        '--danger': '#ffe600',
        '--danger-hover': '#ccb800',
        '--bg': '#240e3f',
        '--panel-bg': 'rgba(60, 27, 100, 0.8)',
        '--card-bg': '#3c1b64',
        '--input-bg': '#240e3f',
        '--text-main': '#ffffff',
        '--text-dim': '#00f0ff',
        '--glass-border': 'rgba(255, 0, 127, 0.4)',
        '--bg-gradient-1': 'rgba(255, 0, 127, 0.08)',
        '--bg-gradient-2': 'rgba(255, 230, 0, 0.06)',
        '--bg-primary': '#240e3f',
        '--accent-primary': '#ff007f',
        '--accent-secondary': '#ffe600',
        '--premium-surface-card': '#3c1b64'
    },
    auroraborealis: {
        '--primary': '#10b981',
        '--primary-hover': '#059669',
        '--accent': '#06b6d4',
        '--danger': '#ef4444',
        '--danger-hover': '#dc2626',
        '--bg': '#041c15',
        '--panel-bg': 'rgba(9, 44, 32, 0.85)',
        '--card-bg': '#092c20',
        '--input-bg': '#041c15',
        '--text-main': '#e6f7f2',
        '--text-dim': '#a7f3d0',
        '--glass-border': 'rgba(16, 185, 129, 0.2)',
        '--bg-gradient-1': 'rgba(16, 185, 129, 0.08)',
        '--bg-gradient-2': 'rgba(6, 182, 212, 0.06)',
        '--bg-primary': '#041c15',
        '--accent-primary': '#10b981',
        '--accent-secondary': '#06b6d4',
        '--premium-surface-card': '#092c20'
    }
};

const THEME_OVERRIDES = {
    cyberpunk: `
        * {
            font-family: 'Courier New', Courier, monospace !important;
        }
        .theme-card.active-card:hover, .menu-item:hover, .btn:hover, .btn-primary:hover, .stat-card:hover, .challenge-card:hover, .sub-btn:hover, .chapter-card:hover, .pill-btn:hover, .field:hover {
            outline: 2px solid var(--primary) !important;
            animation: cyberpunk-shadow-glitch 0.4s linear infinite !important;
        }
        @keyframes cyberpunk-shadow-glitch {
            0% { box-shadow: 0 0 15px var(--primary), 3px 0 0 var(--accent), -3px 0 0 var(--primary); }
            20% { box-shadow: 0 0 15px var(--primary), -3px -3px 0 var(--accent), 3px 3px 0 var(--primary); }
            40% { box-shadow: 0 0 15px var(--primary), 3px -3px 0 var(--accent), -3px 3px 0 var(--primary); }
            60% { box-shadow: 0 0 15px var(--primary), -3px 3px 0 var(--accent), 3px -3px 0 var(--primary); }
            80% { box-shadow: 0 0 15px var(--primary), 2px 2px 0 var(--accent), -2px -2px 0 var(--primary); }
            100% { box-shadow: 0 0 15px var(--primary), 3px 0 0 var(--accent), -3px 0 0 var(--primary); }
        }
    `,
    obsidian: `
        .theme-card.active-card, .stat-card, .setting-card, .leaderboard-container, .challenge-card, .wallet-hud, .field, .chapter-pane, .chapter-card {
            border: none !important;
            background: #121214 !important;
            box-shadow: 0 0 0 1px rgba(255,255,255,0.02) !important;
        }
        .theme-card.active-card:hover, .stat-card:hover, .setting-card:hover, .challenge-card:hover, .field:hover, .chapter-card:hover {
            background: #17171a !important;
            box-shadow: 0 0 0 1px rgba(255,255,255,0.04) !important;
        }
        .menu-item.active::before, .tab-btn.active::before, .sub-btn.active::before {
            content: '✦ ' !important;
            color: var(--primary) !important;
            font-weight: 800 !important;
        }
    `,
    tokyomidnight: `
        .theme-card.active-card, .stat-card, .setting-card, .leaderboard-container, .challenge-card, .wallet-hud, .chapter-pane, .field, .chapter-card {
            box-shadow: 0 4px 20px -8px rgba(157, 141, 242, 0.25) !important;
        }
        .theme-card.active-card:hover, .stat-card:hover, .setting-card:hover, .challenge-card:hover, .wallet-hud:hover, .field:hover, .chapter-card:hover {
            box-shadow: 0 12px 30px -5px rgba(157, 141, 242, 0.45) !important;
        }
    `,
    cafealchemy: `
        .theme-card.active-card, .stat-card, .setting-card, .leaderboard-container, .challenge-card, .wallet-hud, .btn, .btn-primary, .btn-action, .pfp, .palette-preview, .menu-item, .chapter-pane, .sub-btn, .pill-btn {
            border-radius: 32px !important;
        }
        input[type="text"], input[type="number"], select, .field, .chapter-card {
            border-radius: 16px !important;
        }
    `,
    solarizedonyx: `
        .theme-card.active-card:hover, .stat-card:hover, .btn:hover, .btn-primary:hover, .btn-action:hover, .menu-item:hover, .challenge-card:hover, .sub-btn:hover, .chapter-card:hover, .pill-btn:hover, .field:hover {
            border: 3px double var(--primary) !important;
            outline: 1px solid var(--accent) !important;
        }
    `,
    quantummirage: `
        .menu-item.active::before, .tab-btn.active::before, .sub-btn.active::before {
            content: '💠 ' !important;
            color: var(--primary) !important;
        }
    `,
    nordicfrost: `
        .theme-card.active-card, .stat-card, .setting-card, .leaderboard-container, .challenge-card, .wallet-hud, .sidebar, .top-navbar-main, .top-navbar-corner, .chapter-pane, .field, .chapter-card {
            backdrop-filter: blur(25px) !important;
            background: rgba(255, 255, 255, 0.45) !important;
            border: 1px solid rgba(255, 255, 255, 0.3) !important;
        }
        body::after {
            background-image: radial-gradient(circle at 10% 10%, rgba(29, 78, 216, 0.1) 0%, transparent 40%),
                              radial-gradient(circle at 90% 90%, rgba(16, 185, 129, 0.08) 0%, transparent 40%) !important;
        }
    `,
    crimsonvintage: `
        * {
            font-family: 'Georgia', 'Times New Roman', serif !important;
        }
    `,
    vaporwavenostalgia: `
        .theme-card.active-card, .stat-card, .setting-card, .leaderboard-container, .challenge-card, .wallet-hud, .field, .chapter-pane, .chapter-card {
            border: 3px solid #000000 !important;
            box-shadow: 6px 6px 0px var(--accent) !important;
            border-radius: 0px !important;
        }
        .theme-card.active-card:hover, .stat-card:hover, .setting-card:hover, .challenge-card:hover, .field:hover, .chapter-card:hover {
            transform: translate(-2px, -2px) !important;
            box-shadow: 8px 8px 0px var(--primary) !important;
        }
        .btn, .btn-primary, .btn-action, .kbd, .sub-btn, .pill-btn {
            border: 2px solid #000000 !important;
            box-shadow: 4px 4px 0px var(--primary) !important;
            border-radius: 0px !important;
        }
        .btn:hover, .btn-primary:hover, .btn-action:hover, .sub-btn:hover, .pill-btn:hover {
            transform: translate(-1px, -1px) !important;
            box-shadow: 5px 5px 0px var(--accent) !important;
        }
    `,
    auroraborealis: `
        @keyframes aurora-bg-glow {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
        }
        body::after {
            background: linear-gradient(135deg, #041c15, #0a2d21, #06b6d4, #041c15) !important;
            background-size: 300% 300% !important;
            animation: aurora-bg-glow 16s ease infinite !important;
            content: "" !important;
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            height: 100% !important;
            z-index: -1 !important;
            pointer-events: none !important;
        }
    `
};

function applyTheme(themeName) {
    const theme = THEMES[themeName] || THEMES.midnight;
    const root = document.documentElement;
    
    // 1. Set standard CSS custom properties
    for (const [key, value] of Object.entries(theme)) {
        root.style.setProperty(key, value);
    }
    
    // 2. Set aliases for plannedtt.html
    root.style.setProperty('--p', theme['--primary']);
    root.style.setProperty('--acc', theme['--accent']);
    root.style.setProperty('--t', theme['--text-main']);
    root.style.setProperty('--c', theme['--card-bg']);
    root.style.setProperty('--border', theme['--glass-border']);
    
    // 3. Set aliases for podcast.html
    root.style.setProperty('--bg-color', theme['--bg']);
    root.style.setProperty('--accent-hover', theme['--primary-hover'] || theme['--primary']);
    root.style.setProperty('--text-muted', theme['--text-dim']);

    // 4. Set aliases for test.html
    root.style.setProperty('--bg2', theme['--panel-bg'] || theme['--bg']);
    root.style.setProperty('--surface', theme['--card-bg']);
    root.style.setProperty('--surface2', theme['--input-bg'] || theme['--card-bg']);
    root.style.setProperty('--border2', theme['--glass-border']);
    root.style.setProperty('--primary2', theme['--primary-hover'] || theme['--primary']);
    root.style.setProperty('--text', theme['--text-main']);
    root.style.setProperty('--text2', theme['--text-dim']);
    root.style.setProperty('--text3', theme['--text-dim']);

    root.setAttribute('data-theme', themeName);

    // 5. Inject theme-specific styles dynamically
    let styleEl = document.getElementById('dynamic-theme-overrides');
    if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = 'dynamic-theme-overrides';
        document.head.appendChild(styleEl);
    }
    styleEl.innerHTML = THEME_OVERRIDES[themeName] || '';
}

function setTheme(themeName) {
    try {
        localStorage.setItem('app_theme', themeName);
    } catch (e) {
        console.warn("Unable to save theme to localStorage:", e);
    }
    applyTheme(themeName);
    window.dispatchEvent(new CustomEvent('themechanged', { detail: themeName }));
}

// Immediately apply theme on script execution
(function() {
    let savedTheme = 'midnight';
    try {
        savedTheme = localStorage.getItem('app_theme') || 'midnight';
    } catch (e) {
        console.warn("Unable to read theme from localStorage:", e);
    }
    applyTheme(savedTheme);

    // Cross-tab synchronization
    window.addEventListener('storage', function(e) {
        if (e.key === 'app_theme') {
            applyTheme(e.newValue);
            // Sync settings dropdown if it exists on current page
            const themeSelect = document.getElementById('theme-select');
            if (themeSelect) {
                if (typeof window.repopulateThemeSelect === 'function') {
                    window.repopulateThemeSelect();
                }
                themeSelect.value = e.newValue;
            }
        }
    });
})();
