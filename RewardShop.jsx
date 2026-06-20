import React, { useState, useEffect } from 'react';

// TASK 1: Complete Extensible Theme Design Architecture Config
export const PremiumThemes = {
  cyberpunk: {
    name: 'Cyberpunk Overdrive',
    icon: '⚡',
    cost: 50,
    vibe: 'Glitch-heavy cyber-dystopia styled with neon cyan, hot pink and monospace elements.',
    colors: {
      bg: '#000000',
      text: '#00f0ff',
      primary: '#00f0ff',
      accent: '#ff007f',
      card: '#121212',
    },
    variables: {
      '--bg-primary': '#000000',
      '--text-main': '#00f0ff',
      '--accent-primary': '#00f0ff',
      '--accent-secondary': '#ff007f',
      '--premium-surface-card': '#121212',
    }
  },
  obsidian: {
    name: 'Obsidian Minimalist',
    icon: '✦',
    cost: 50,
    vibe: 'Sleek, low-contrast dark charcoal theme defined by tone-shift boundaries and minimal star indicators.',
    colors: {
      bg: '#0f0f11',
      text: '#ffffff',
      primary: '#ffffff',
      accent: '#8e8e93',
      card: '#151518',
    },
    variables: {
      '--bg-primary': '#0f0f11',
      '--text-main': '#ffffff',
      '--accent-primary': '#ffffff',
      '--accent-secondary': '#8e8e93',
      '--premium-surface-card': '#151518',
    }
  },
  tokyomidnight: {
    name: 'Tokyo Midnight',
    icon: '🌌',
    cost: 50,
    vibe: 'Neon lavender and soft mint overlays floating on dark slate navy base.',
    colors: {
      bg: '#0b0d16',
      text: '#c5cbe8',
      primary: '#9d8df2',
      accent: '#8df2bc',
      card: '#121524',
    },
    variables: {
      '--bg-primary': '#0b0d16',
      '--text-main': '#c5cbe8',
      '--accent-primary': '#9d8df2',
      '--accent-secondary': '#8df2bc',
      '--premium-surface-card': '#121524',
    }
  },
  cafealchemy: {
    name: 'Café Alchemy',
    icon: '☕',
    cost: 50,
    vibe: 'Warm espresso, rich caramel and forest green accents with organic curved layout elements.',
    colors: {
      bg: '#1a0f0a',
      text: '#fdfbf7',
      primary: '#d4a373',
      accent: '#52796f',
      card: '#2c1b12',
    },
    variables: {
      '--bg-primary': '#1a0f0a',
      '--text-main': '#fdfbf7',
      '--accent-primary': '#d4a373',
      '--accent-secondary': '#52796f',
      '--premium-surface-card': '#2c1b12',
    }
  },
  solarizedonyx: {
    name: 'Solarized Onyx',
    icon: '☀️',
    cost: 50,
    vibe: 'Matte greenish-black Solarized variant featuring brass gold and high-contrast dual borders.',
    colors: {
      bg: '#07221d',
      text: '#93a1a1',
      primary: '#b58900',
      accent: '#2aa198',
      card: '#0a2f28',
    },
    variables: {
      '--bg-primary': '#07221d',
      '--text-main': '#93a1a1',
      '--accent-primary': '#b58900',
      '--accent-secondary': '#2aa198',
      '--premium-surface-card': '#0a2f28',
    }
  },
  quantummirage: {
    name: 'Quantum Mirage',
    icon: '💠',
    cost: 50,
    vibe: 'Pure dark layout with monochromatic text, electric-blue indicator tags and diamond indicators.',
    colors: {
      bg: '#010103',
      text: '#a0a0a5',
      primary: '#0066ff',
      accent: '#00f0ff',
      card: '#09090f',
    },
    variables: {
      '--bg-primary': '#010103',
      '--text-main': '#a0a0a5',
      '--accent-primary': '#0066ff',
      '--accent-secondary': '#00f0ff',
      '--premium-surface-card': '#09090f',
    }
  },
  nordicfrost: {
    name: 'Nordic Frost',
    icon: '❄️',
    cost: 50,
    vibe: 'Icy white slate background paired with deep-sea blue and frosted glass backdrop elements.',
    colors: {
      bg: '#eef2f7',
      text: '#1e293b',
      primary: '#1d4ed8',
      accent: '#10b981',
      card: 'rgba(255,255,255,0.45)',
    },
    variables: {
      '--bg-primary': '#eef2f7',
      '--text-main': '#1e293b',
      '--accent-primary': '#1d4ed8',
      '--accent-secondary': '#10b981',
      '--premium-surface-card': 'rgba(255,255,255,0.45)',
    }
  },
  crimsonvintage: {
    name: 'Crimson Vintage',
    icon: '⚔️',
    cost: 50,
    vibe: 'Ivory text and oxblood red elements overlaid on dark charcoal base with serif typography.',
    colors: {
      bg: '#141416',
      text: '#f4f1ea',
      primary: '#800020',
      accent: '#c5a059',
      card: '#1d1d20',
    },
    variables: {
      '--bg-primary': '#141416',
      '--text-main': '#f4f1ea',
      '--accent-primary': '#800020',
      '--accent-secondary': '#c5a059',
      '--premium-surface-card': '#1d1d20',
    }
  },
  vaporwavenostalgia: {
    name: 'Vaporwave Nostalgia',
    icon: '🌴',
    cost: 50,
    vibe: 'Radical hot pink, yellow, and retro teal accents wrapped in solid offset blocked borders.',
    colors: {
      bg: '#240e3f',
      text: '#ffffff',
      primary: '#ff007f',
      accent: '#00f0ff',
      card: '#3c1b64',
    },
    variables: {
      '--bg-primary': '#240e3f',
      '--text-main': '#ffffff',
      '--accent-primary': '#ff007f',
      '--accent-secondary': '#00f0ff',
      '--premium-surface-card': '#3c1b64',
    }
  },
  auroraborealis: {
    name: 'Aurora Borealis',
    icon: '🌌',
    cost: 50,
    vibe: 'Glowing emerald accents flowing dynamically on dark forest green base.',
    colors: {
      bg: '#041c15',
      text: '#e6f7f2',
      primary: '#10b981',
      accent: '#06b6d4',
      card: '#092c20',
    },
    variables: {
      '--bg-primary': '#041c15',
      '--text-main': '#e6f7f2',
      '--accent-primary': '#10b981',
      '--accent-secondary': '#06b6d4',
      '--premium-surface-card': '#092c20',
    }
  }
};

export default function RewardShop() {
  const [walletXp, setWalletXp] = useState(150); // Available balance
  const [lifetimeXp, setLifetimeXp] = useState(450); // Total lifetime earnings
  const [unlockedThemes, setUnlockedThemes] = useState(['midnight']); // Unlocked theme keys
  const [activeTheme, setActiveTheme] = useState('midnight'); // Current active theme

  // Load from local storage or mock database on mount
  useEffect(() => {
    const savedWallet = localStorage.getItem('wallet_xp');
    const savedLifetime = localStorage.getItem('lifetime_xp');
    const savedUnlocked = localStorage.getItem('unlocked_themes');
    const savedActive = localStorage.getItem('app_theme');

    if (savedWallet) setWalletXp(parseInt(savedWallet));
    if (savedLifetime) setLifetimeXp(parseInt(savedLifetime));
    if (savedUnlocked) setUnlockedThemes(JSON.parse(savedUnlocked));
    if (savedActive) setActiveTheme(savedActive);
  }, []);

  // Set the CSS variables globally on selection
  const applyThemeVariables = (themeKey) => {
    const theme = PremiumThemes[themeKey];
    if (!theme) return;
    const root = document.documentElement;
    Object.entries(theme.variables).forEach(([key, val]) => {
      root.style.setProperty(key, val);
    });
    // Set theme custom flags
    root.setAttribute('data-theme', themeKey);
  };

  const handlePurchaseOrEquip = (themeKey) => {
    const theme = PremiumThemes[themeKey];
    if (!theme) return;

    if (unlockedThemes.includes(themeKey)) {
      // Equip theme
      setActiveTheme(themeKey);
      localStorage.setItem('app_theme', themeKey);
      applyThemeVariables(themeKey);
    } else {
      // Purchase theme
      if (walletXp >= theme.cost) {
        const newWalletXp = walletXp - theme.cost;
        const newUnlocked = [...unlockedThemes, themeKey];

        setWalletXp(newWalletXp);
        setUnlockedThemes(newUnlocked);

        localStorage.setItem('wallet_xp', newWalletXp.toString());
        localStorage.setItem('unlocked_themes', JSON.stringify(newUnlocked));
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 font-sans selection:bg-indigo-500 selection:text-white">
      {/* Container wrapper */}
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* TASK 2 - A: User Wallet Tracker HUD */}
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900/60 p-8 backdrop-blur-md shadow-2xl">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 h-32 w-32 rounded-full bg-indigo-500/10 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 -mb-8 -ml-8 h-32 w-32 rounded-full bg-teal-500/10 blur-3xl"></div>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div>
              <span className="text-xs font-bold tracking-widest text-teal-400 uppercase">Premium Rewards</span>
              <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mt-1 text-white">
                Your Wallet: <span className="text-indigo-400">{walletXp}</span> XP
              </h1>
            </div>
            
            <div className="flex flex-col gap-1 items-start md:items-end">
              <span className="text-sm font-semibold text-slate-400">Total Lifetime Earnings</span>
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold text-white">{lifetimeXp} XP</span>
                <span className="rounded-full bg-teal-500/10 px-3 py-1 text-xs font-bold text-teal-400 border border-teal-500/20">
                  Global Leaderboard Verified
                </span>
              </div>
            </div>
          </div>

          {/* Leaderboard status reassurance message */}
          <div className="mt-6 pt-6 border-t border-white/5 flex items-center gap-3 text-xs text-slate-400">
            <svg className="h-4 w-4 text-indigo-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Your lifetime earnings are anchored! Spending XP in the Shop will never decrease your global leaderboard standing.</span>
          </div>
        </div>

        {/* TASK 2 - B: Premium Grid Display */}
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <span>Premium Theme Vault</span>
              <span className="text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full px-2.5 py-0.5">50 XP Each</span>
            </h2>
            <p className="text-sm text-slate-400 mt-1">Unlock custom color systems and UI micro-interactions built for study focus.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(PremiumThemes).map(([key, theme]) => {
              const isUnlocked = unlockedThemes.includes(key);
              const isActive = activeTheme === key;
              const canAfford = walletXp >= theme.cost;

              // Action button states mapping
              let btnText = `Buy theme (${theme.cost} XP)`;
              let btnClass = "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20";
              
              if (isUnlocked) {
                if (isActive) {
                  btnText = "Equipped";
                  btnClass = "bg-teal-500/20 border border-teal-500/30 text-teal-300 cursor-default";
                } else {
                  btnText = "Equip Theme";
                  btnClass = "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/5";
                }
              } else if (!canAfford) {
                btnText = "Insufficient XP";
                btnClass = "bg-slate-900 border border-white/5 text-slate-500 cursor-not-allowed opacity-50";
              }

              return (
                <div 
                  key={key} 
                  className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border transition-all duration-300 ${
                    isActive 
                      ? 'border-teal-500/50 bg-slate-900 shadow-teal-950/20' 
                      : 'border-white/10 bg-slate-900/40 hover:border-white/20 hover:bg-slate-900/60'
                  } p-6`}
                >
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{theme.icon}</span>
                        <h3 className="font-bold text-white text-base leading-tight group-hover:text-indigo-300 transition-colors">
                          {theme.name}
                        </h3>
                      </div>
                      
                      {isActive && (
                        <span className="rounded-full bg-teal-400/10 px-2.5 py-0.5 text-2xs font-extrabold text-teal-400 border border-teal-400/20 uppercase tracking-widest">
                          Active
                        </span>
                      )}
                    </div>

                    {/* Vibe Description */}
                    <p className="text-xs text-slate-400 leading-relaxed min-h-[36px]">
                      {theme.vibe}
                    </p>

                    {/* Palette Preview Strip */}
                    <div className="rounded-lg border border-white/5 bg-slate-950 p-2 flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-1">Palette</span>
                      <div className="flex -space-x-1.5 overflow-hidden">
                        <div className="h-5 w-8 rounded-md border border-white/10" style={{ backgroundColor: theme.colors.bg }} title="Background"></div>
                        <div className="h-5 w-8 rounded-md border border-white/10" style={{ backgroundColor: theme.colors.text }} title="Text"></div>
                        <div className="h-5 w-8 rounded-md border border-white/10" style={{ backgroundColor: theme.colors.primary }} title="Primary"></div>
                        <div className="h-5 w-8 rounded-md border border-white/10" style={{ backgroundColor: theme.colors.accent }} title="Accent"></div>
                      </div>
                    </div>
                  </div>

                  {/* Buy / Equip Action button */}
                  <button
                    onClick={() => handlePurchaseOrEquip(key)}
                    disabled={!isUnlocked && !canAfford}
                    className={`mt-6 w-full rounded-xl py-3 text-xs font-bold transition-all duration-200 ${btnClass}`}
                  >
                    {btnText}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
