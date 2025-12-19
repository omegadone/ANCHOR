/**
 * theme.js
 * Handles visual modes and CSS variable injection
 */
export const Theme = {
    modes: { DARK: 'dark', LIGHT: 'light' },
    init() {
        const savedTheme = localStorage.getItem('theme_preference') || this.modes.DARK;
        this.setTheme(savedTheme);
    },
    setTheme(mode) {
        const root = document.documentElement;
        if (mode === this.modes.LIGHT) {
            root.style.setProperty('--bg-gradient', 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)');
            root.style.setProperty('--glass-bg', 'rgba(255, 255, 255, 0.7)');
            root.style.setProperty('--glass-border', 'rgba(0, 0, 0, 0.1)');
            root.style.setProperty('--text-main', '#0f172a');
            root.style.setProperty('--text-dim', '#475569');
        } else {
            root.style.setProperty('--bg-gradient', 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)');
            root.style.setProperty('--glass-bg', 'rgba(255, 255, 255, 0.05)');
            root.style.setProperty('--glass-border', 'rgba(255, 255, 255, 0.1)');
            root.style.setProperty('--text-main', '#f8fafc');
            root.style.setProperty('--text-dim', '#94a3b8');
        }
        localStorage.setItem('theme_preference', mode);
    },
    toggle() {
        const current = localStorage.getItem('theme_preference');
        this.setTheme(current === this.modes.DARK ? this.modes.LIGHT : this.modes.DARK);
    }
};