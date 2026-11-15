import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const html = await readFile('docs/index.html', 'utf8');
const photos = JSON.parse(await readFile('docs/photos.json', 'utf8'));
const base = 'https://enpero.github.io/photoByPerova/';
assert.match(html, /<title>Фотограф на Кипре Перова Екатерина<\/title>/);
assert.equal((html.match(/<h1\b/g) || []).length, 1);
assert.match(html, /<link rel="canonical" href="https:\/\/enpero.github.io\/photoByPerova\/">/);
assert.match(html, /name="robots" content="index, follow, max-image-preview:large"/);
assert(!html.includes('noindex'));
const schema = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
const gallery = schema['@graph'].find(node => node['@type'] === 'ImageGallery');
assert.equal(gallery.image.length, photos.length);
const cards = [...html.matchAll(/<a class="frame" href="([^"]+)"[^>]*><img[^>]*alt="([^"]+)"/g)];
assert.equal(cards.length, photos.length);
for (const [, path, alt] of cards) {
  assert(!/^Фотография \d+$/.test(alt));
  assert(alt.length > 12);
  await readFile(new URL('../docs/' + path.replace('./', ''), import.meta.url));
}
const sitemap = await readFile('docs/sitemap.xml', 'utf8');
assert.match(sitemap, /xmlns:image="http:\/\/www.google.com\/schemas\/sitemap-image\/1.1"/);
assert.equal((sitemap.match(/<image:loc>/g) || []).length, photos.length);
for (const photo of photos) {
  assert(photo.title);
  const url = new URL(photo.url, base).href;
  assert(sitemap.includes(url));
  assert(gallery.image.some(image => image.contentUrl === url && image.name === photo.title));
}
console.log(`Passed: metadata, canonical, single H1, ${photos.length} descriptive alt texts, structured data and image sitemap.`);
