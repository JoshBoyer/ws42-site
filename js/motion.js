/* Small, finite workshop gestures. Everything is visible before enhancement. */
(() => {
  'use strict';
  const root = document.documentElement;
  const media = window.matchMedia('(prefers-reduced-motion: reduce)');
  const key = 'ws42-reduced-motion';
  let reducedByChoice = false;
  try { reducedByChoice = localStorage.getItem(key) === '1'; } catch { /* Keep an in-session choice. */ }
  const reduce = () => media.matches || reducedByChoice;
  const apply = () => {
    root.dataset.motion = reduce() ? 'reduced' : 'full';
    const button = document.querySelector('.motion-toggle');
    if (!button) return;
    button.hidden = false;
    button.disabled = media.matches;
    button.setAttribute('aria-pressed', String(reduce()));
    button.setAttribute('aria-label', media.matches ? 'Motion reduced by your system setting' : 'Reduce motion');
    button.title = media.matches ? 'Your system setting reduces motion' : (reduce() ? 'Restore workshop motion' : 'Reduce workshop motion');
    button.querySelector('span').textContent = media.matches ? 'Motion: System reduced' : (reduce() ? 'Motion: Reduced' : 'Motion: Full');
  };
  apply();
  media.addEventListener('change', apply);
  window.addEventListener('storage', event => { if (event.key === key) { reducedByChoice = event.newValue === '1'; apply(); } });
  document.addEventListener('DOMContentLoaded', () => {
    apply();
    document.querySelector('.motion-toggle')?.addEventListener('click', () => {
      reducedByChoice = !reducedByChoice;
      try { if (reducedByChoice) localStorage.setItem(key, '1'); else localStorage.removeItem(key); } catch { /* No storage required. */ }
      apply();
    });
  });
})();
