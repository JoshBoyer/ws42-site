/* Runs in the head before styles: follow the system until an explicit choice is made. */
(() => {
  'use strict';
  const key = 'ws42-theme';
  const system = window.matchMedia('(prefers-color-scheme: dark)');
  let preference = 'system';
  try { const saved = localStorage.getItem(key); if (saved === 'light' || saved === 'dark') preference = saved; } catch { /* Storage can be unavailable; the control still works. */ }
  const modes = ['system', 'light', 'dark'];
  const apply = () => {
    const theme = preference === 'system' ? (system.matches ? 'dark' : 'light') : preference;
    document.documentElement.dataset.theme = theme;
    document.documentElement.dataset.themePreference = preference;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#191b1f' : '#f5f6f7');
    const button = document.querySelector('.theme-toggle');
    if (!button) return;
    const next = modes[(modes.indexOf(preference) + 1) % modes.length];
    const label = `Theme: ${preference[0].toUpperCase() + preference.slice(1)}. ${next === 'system' ? 'Use system preference' : `Switch to ${next} mode`}`;
    button.hidden = false;
    button.setAttribute('aria-label', label);
    button.title = label;
    button.querySelector('.theme-label').textContent = preference[0].toUpperCase() + preference.slice(1);
  };
  apply();
  system.addEventListener('change', apply);
  window.addEventListener('storage', event => { if (event.key === key) { preference = modes.includes(event.newValue) ? event.newValue : 'system'; apply(); } });
  document.addEventListener('DOMContentLoaded', () => {
    apply();
    document.querySelector('.theme-toggle')?.addEventListener('click', () => {
      preference = modes[(modes.indexOf(preference) + 1) % modes.length];
      try { if (preference === 'system') localStorage.removeItem(key); else localStorage.setItem(key, preference); } catch { /* Session choice remains available. */ }
      apply();
    });
  });
})();
