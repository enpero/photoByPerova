const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const html = fs.readFileSync('docs/index.html', 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
function open({ narrow = false, saved = null, blocked = false } = {}) {
  const root = { dataset: {} }, viewport = { setAttribute(k, v) { this[k] = v; } };
  const label = { textContent: '' }, toggle = { setAttribute() {}, addEventListener(k, fn) { this[k] = fn; } };
  const media = { matches: narrow, addEventListener(k, fn) { this[k] = fn; } };
  const localStorage = { getItem() { if (blocked) throw Error('blocked'); return saved; }, setItem(k, v) { if (blocked) throw Error('blocked'); saved = v; } };
  vm.runInNewContext(script, { document: { documentElement: root, querySelector: () => viewport, getElementById: id => id === 'device-toggle' ? toggle : label }, window: { matchMedia: () => media }, localStorage });
  return { root, viewport, label, toggle, media, saved: () => saved };
}
const desktop = open(); assert.equal(desktop.root.dataset.device, undefined);
assert.equal(desktop.label.textContent, 'Мобильная версия');
desktop.toggle.click(); assert.equal(desktop.root.dataset.device, 'mobile'); assert.equal(desktop.saved(), 'mobile');
assert.match(desktop.viewport.content, /width=device-width/);
desktop.toggle.click(); assert.equal(desktop.root.dataset.device, 'desktop'); assert.match(desktop.viewport.content, /width=1100/);
const mobile = open({ narrow: true }); assert.equal(mobile.label.textContent, 'Версия для компьютера');
mobile.toggle.click(); assert.equal(mobile.root.dataset.device, 'desktop');
const restored = open({ saved: 'mobile' }); assert.equal(restored.root.dataset.device, 'mobile');
restored.media.matches = true; restored.media.change(); assert.equal(restored.root.dataset.device, 'mobile');
const denied = open({ blocked: true }); denied.toggle.click(); assert.equal(denied.root.dataset.device, 'mobile');
console.log('Passed: automatic device mode, both switch directions, saved preference and blocked storage.');
