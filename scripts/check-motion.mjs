import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const source = fs.readFileSync('js/motion.js', 'utf8');
assert.doesNotMatch(source, /\.animate\s*\(|IntersectionObserver|translateX|clipPath/);
function scenario({system = false, saved = null, storageFails = false} = {}) {
  const events = {}, windowEvents = {}, attrs = {};
  let value = saved, changeMedia;
  const label = {textContent: ''};
  const button = {hidden: true, disabled: false, setAttribute: (k, v) => attrs[k] = v, querySelector: () => label, addEventListener: (n, f) => events['button-' + n] = f};
  const root = {dataset: {}};
  const media = {matches: system, addEventListener: (_, f) => { changeMedia = f; }};
  const document = {documentElement: root, querySelector: () => button, addEventListener: (n, f) => events[n] = f};
  const window = {matchMedia: () => media, addEventListener: (n, f) => windowEvents[n] = f};
  const localStorage = {getItem: () => { if (storageFails) throw Error('blocked'); return value; }, setItem: (_, v) => { if (storageFails) throw Error('blocked'); value = v; }, removeItem: () => { if (storageFails) throw Error('blocked'); value = null; }};
  vm.runInNewContext(source, {window, document, localStorage});
  events.DOMContentLoaded();
  return {root, button, attrs, events, windowEvents, changeSystem(v) { media.matches = v; changeMedia(); }};
}
for (const config of [{}, {system: true}, {saved: '1'}, {storageFails: true}]) {
  const s = scenario(config), reduced = config.system || config.saved === '1';
  assert.equal(s.root.dataset.motion, reduced ? 'reduced' : 'full');
  assert.equal(s.button.hidden, false);
  assert.equal(s.attrs['aria-pressed'], String(!!reduced));
  assert.equal(s.button.disabled, !!config.system);
  if (!config.system) { s.events['button-click'](); assert.equal(s.root.dataset.motion, reduced ? 'full' : 'reduced'); }
}
const s = scenario();
s.changeSystem(true); assert.equal(s.root.dataset.motion, 'reduced'); assert.equal(s.button.disabled, true);
s.changeSystem(false); assert.equal(s.root.dataset.motion, 'full');
s.windowEvents.storage({key: 'ws42-reduced-motion', newValue: '1'}); assert.equal(s.root.dataset.motion, 'reduced');
console.log('PASS: content has no scripted entrance animations; motion preferences and storage fallback remain functional.');
