/* Small, finite workshop gestures. Everything is visible before enhancement. */
(() => {
  'use strict';
  const root = document.documentElement;
  const media = window.matchMedia('(prefers-reduced-motion: reduce)');
  const key = 'ws42-reduced-motion';
  const running = new Set();
  let reducedByChoice = false;
  try { reducedByChoice = localStorage.getItem(key) === '1'; } catch { /* Keep an in-session choice. */ }
  const reduce = () => media.matches || reducedByChoice;
  const stop = () => { running.forEach(animation => animation.cancel()); running.clear(); };
  const apply = () => {
    root.dataset.motion = reduce() ? 'reduced' : 'full';
    if (reduce()) stop();
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
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });
  document.addEventListener('DOMContentLoaded', () => {
    apply();
    document.querySelector('.motion-toggle')?.addEventListener('click', () => {
      reducedByChoice = !reducedByChoice;
      try { if (reducedByChoice) localStorage.setItem(key, '1'); else localStorage.removeItem(key); } catch { /* No storage required. */ }
      apply();
    });
    const play = (element, frames, duration, delay = 0) => {
      if (reduce() || document.hidden || typeof element.animate !== 'function' || element.contains(document.activeElement)) return;
      const animation = element.animate(frames, {duration, delay, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'none'});
      running.add(animation);
      const done = () => running.delete(animation);
      animation.addEventListener('finish', done, {once: true});
      animation.addEventListener('cancel', done, {once: true});
    };
    // The three beats stay under 700ms, with no replay timer or layout changes.
    document.querySelectorAll('.motto-word').forEach((word, index) => {
      const frames = index === 1
        ? [{transform:'translateX(-9px) skewX(-4deg)'},{transform:'translateX(2px) skewX(0deg)',offset:.65},{transform:'none'}]
        : [{clipPath:'inset(0 100% 0 0)',transform:'translateX(-6px)'},{clipPath:'inset(0)',transform:'none'}];
      play(word, frames, 460, index * 85);
    });
    document.addEventListener('focusin', event => {
      // Keyboard focus never waits for a reveal to finish.
      running.forEach(animation => { if (animation.effect?.target?.contains(event.target)) animation.cancel(); });
    });
    if (!('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        observer.unobserve(entry.target);
        if (entry.target.matches('.selected-photo')) {
          play(entry.target, [{clipPath:'inset(0 100% 0 0)'},{clipPath:'inset(0)'}], 420);
        } else {
          const siblings = [...entry.target.parentElement.children];
          const delay = Math.min(siblings.indexOf(entry.target) * 40, 120);
          play(entry.target, [{transform:'translateX(-6px)',opacity:.65},{transform:'none',opacity:1}], 300, delay);
        }
      });
    }, {threshold: .12});
    document.querySelectorAll('.selected-photo,.software-card,.process-full .steps>li').forEach(element => observer.observe(element));
    window.addEventListener('pagehide', () => { stop(); observer.disconnect(); }, {once:true});
  });
})();
