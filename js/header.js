/* Shared site navigation. Every route uses the same markup, styles and behavior. */
(() => {
  'use strict';
  document.documentElement.classList.add('js');
  const header = document.querySelector('.site-header');
  const toggle = header?.querySelector('.menu-toggle');
  const menu = header?.querySelector('#main-menu');
  const closeMenu = () => {
    toggle?.setAttribute('aria-expanded', 'false');
    menu?.classList.remove('open');
  };
  toggle?.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') !== 'true';
    toggle.setAttribute('aria-expanded', String(open));
    menu.classList.toggle('open', open);
  });
  menu?.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && toggle?.getAttribute('aria-expanded') === 'true') {
      closeMenu(); toggle.focus();
    }
  });
  document.addEventListener('click', event => {
    if (!event.target.closest('.site-header nav')) closeMenu();
  });
  window.matchMedia('(min-width: 701px)').addEventListener('change', closeMenu);
})();
