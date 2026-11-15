const vm = require('node:vm');
const fs = require('node:fs');
const assert = require('node:assert/strict');
const html = fs.readFileSync('docs/index.html', 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
function element(extra = {}) {
  return { handlers: {}, dataset: {}, hidden: false,
    addEventListener(type, callback) { this.handlers[type] = callback; },
    setAttribute(key, value) { this[key] = value; }, ...extra };
}
const frames = [...html.matchAll(/<a class="frame" href="([^"]+)" data-tags="([^"]*)"/g)]
  .map(([_, href, tags], i) => element({ href, dataset: { tags },
    querySelector: () => ({ alt: 'Photo ' + i }), focus() { this.focused = true; } }));
const gallery = element({ children: [...frames], append(...items) { this.children = items; } });
const filters = ['all', 'animals', 'nature', 'people', 'buba'].map(filter => element({ dataset: { filter } }));
const views = ['original', 'squares'].map(view => element({ dataset: { view } }));
const photo = element(), stage = element(), shuffle = element(), empty = element();
const controls = Object.fromEntries(['.album-close', '.album-prev', '.album-next'].map(k => [k, element()]));
const album = element({ querySelector: key => controls[key], showModal() { this.open = true; }, close() { this.open = false; this.handlers.close(); } });
const byId = { album, 'album-photo': photo, 'album-stage': stage, shuffle, 'empty-gallery': empty };
const document = {
  querySelector: () => gallery,
  querySelectorAll: selector => ({ '.frame': frames, '.filter-button': filters, '.view-button': views })[selector],
  getElementById: id => byId[id], documentElement: { classList: { add() {}, remove() {} } }
};
const localStorage = { getItem: () => null, setItem() {} };
vm.runInNewContext(script, { document, localStorage });
const click = key => filters.find(b => b.dataset.filter === key).handlers.click();
const visible = () => gallery.children.filter(f => !f.hidden);
assert.equal(visible().length, 26);
assert.equal(filters[0]['aria-pressed'], 'true');
click('animals'); assert(visible().every(f => f.dataset.tags.includes('animals')));
assert.equal(filters[0]['aria-pressed'], 'false');
click('nature'); assert(visible().some(f => f.dataset.tags === 'nature'));
assert(visible().every(f => /animals|nature/.test(f.dataset.tags)));
click('people'); click('buba');
assert.equal(filters[0]['aria-pressed'], 'true'); assert.equal(visible().length, 26);
assert(filters.slice(1).every(b => b['aria-pressed'] === 'false'));
click('buba'); assert.equal(visible().length, 6);
const before = visible().map(f => f.href); shuffle.handlers.click();
assert.notDeepEqual(visible().map(f => f.href), before);
assert.deepEqual([...visible().map(f => f.href)].sort(), [...before].sort());
const ordered = visible();
ordered[0].handlers.click({ preventDefault() {} }); assert.equal(photo.src, ordered[0].href);
controls['.album-next'].handlers.click(); assert.equal(photo.src, ordered[1].href);
controls['.album-prev'].handlers.click(); controls['.album-prev'].handlers.click(); assert.equal(photo.src, ordered.at(-1).href);
controls['.album-close'].handlers.click(); assert(ordered[0].focused);
click('buba'); assert.equal(visible().length, 26);
click('people'); assert.equal(visible().length, 0); assert.equal(empty.hidden, false); assert.equal(shuffle.disabled, true);
click('all'); assert.equal(visible().length, 26); assert.equal(empty.hidden, true);
views[1].handlers.click(); assert.equal(gallery.dataset.view, 'squares');
console.log('Passed: default/reset, OR filters, all-four normalization, Buba, shuffle, filtered album order, empty category and layout switching.');
