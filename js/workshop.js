/* Progressive enhancement: all builds and notes are reachable without JavaScript. */
(() => {
  'use strict';
  const filters = [...document.querySelectorAll('[data-filter]')];
  const notes = [...document.querySelectorAll('[data-note]')];
  function filterNotes(topic) {
    filters.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.filter === topic)));
    let count = 0;
    notes.forEach(note => {
      note.hidden = topic !== 'all' && note.dataset.note !== topic;
      if (!note.hidden) count++;
    });
    const status = document.querySelector('#filter-status');
    if (status) status.textContent = `${count} build ${count === 1 ? 'note' : 'notes'} shown`;
  }
  filters.forEach(button => button.addEventListener('click', () => filterNotes(button.dataset.filter)));
  document.querySelectorAll('[data-topic-link]').forEach(link => link.addEventListener('click', () => {
    filterNotes(link.dataset.topicLink);
    filters.find(button => button.dataset.filter === link.dataset.topicLink)?.focus({preventScroll:true});
  }));
})();
