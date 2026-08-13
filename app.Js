document.addEventListener("DOMContentLoaded", () => {
    const button = document.getElementById("themes");
    const body = document.body;
    const THEME_KEY = 'site-theme';

    function applyTheme(theme) {
        body.classList.toggle('dark-mode', theme === 'dark');
        body.classList.toggle('light-mode', theme === 'light');
        if (button) button.textContent = theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode';
    }

    // Initialize theme from localStorage or system preference
    let saved = null;
    try { saved = localStorage.getItem(THEME_KEY); } catch (e) { /* ignore */ }
    let theme = saved || (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
    applyTheme(theme);

    if (button) {
        button.addEventListener('click', () => {
            theme = theme === 'light' ? 'dark' : 'light';
            try { localStorage.setItem(THEME_KEY, theme); } catch (e) { /* ignore */ }
            applyTheme(theme);
        });
    }
});