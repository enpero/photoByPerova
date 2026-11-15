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
const photo = element(), stage = element(), empty = element();
const controls = Object.fromEntries(['.album-close', '.album-prev', '.album-next'].map(k => [k, element()]));
const album = element({ querySelector: key => controls[key], showModal() { this.open = true; }, close() { this.open = false; this.handlers.close(); } });
const byId = { album, 'album-photo': photo, 'album-stage': stage, 'empty-gallery': empty };
const document = {
  querySelector: () => gallery,
  querySelectorAll: selector => ({ '.frame': frames, '.filter-button': filters, '.view-button': views })[selector],
  getElementById: id => byId[id], documentElement: { classList: { add() {}, remove() {} } }
};
const localStorage = { getItem: () => null, setItem() {} };
vm.runInNewContext(script, { document, localStorage, Math: Object.assign(Object.create(Math), { random: () => 0.5 }) });
assert(!html.includes('shuffle-button'));
assert.notDeepEqual(gallery.children.map(f => f.href), frames.map(f => f.href));
assert.deepEqual([...gallery.children.map(f => f.href)].sort(), [...frames.map(f => f.href)].sort());
const peopleCount = frames.filter(f => f.dataset.tags.split(',').includes('people')).length;
const click = key => filters.find(b => b.dataset.filter === key).handlers.click();
const visible = () => gallery.children.filter(f => !f.hidden);
assert.equal(visible().length, frames.length);
assert.equal(filters[0]['aria-pressed'], 'true');
click('animals'); assert(visible().every(f => f.dataset.tags.includes('animals')));
assert.equal(filters[0]['aria-pressed'], 'false');
click('nature'); assert(visible().some(f => f.dataset.tags === 'nature'));
assert(visible().every(f => f.dataset.tags.split(',').includes('nature')));
assert.equal(filters.find(b => b.dataset.filter === 'animals')['aria-pressed'], 'false');
assert.equal(filters.filter(b => b['aria-pressed'] === 'true').length, 1);
click('people'); assert.equal(visible().length, peopleCount); assert(visible().every(f => f.dataset.tags.split(',').includes('people')));
click('buba'); assert.equal(visible().length, 6);
assert.equal(filters.filter(b => b['aria-pressed'] === 'true').length, 1);
const before = visible().map(f => f.href); click('nature'); click('buba');
assert.deepEqual(visible().map(f => f.href), before);
const ordered = visible();
ordered[0].handlers.click({ preventDefault() {} }); assert.equal(photo.src, ordered[0].href);
controls['.album-next'].handlers.click(); assert.equal(photo.src, ordered[1].href);
controls['.album-prev'].handlers.click(); controls['.album-prev'].handlers.click(); assert.equal(photo.src, ordered.at(-1).href);
controls['.album-close'].handlers.click(); assert(ordered[0].focused);
click('buba'); assert.equal(visible().length, 6);
click('people'); assert.equal(visible().length, peopleCount); assert(visible().every(f => f.dataset.tags.split(',').includes('people'))); assert.equal(empty.hidden, peopleCount !== 0);
click('all'); assert.equal(visible().length, frames.length); assert.equal(empty.hidden, true);
views[1].handlers.click(); assert.equal(gallery.dataset.view, 'squares');
console.log('Passed: default, exclusive sections, repeated selection, Buba, automatic shuffle, section album order, empty category and layout switching.');
