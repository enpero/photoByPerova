import { mkdir, readFile, writeFile } from 'node:fs/promises';
const base = 'https://enpero.github.io/photoByPerova/';
const photos = JSON.parse(await readFile('docs/photos.json', 'utf8'));
const source = await readFile('page.html', 'utf8');
const author = { '@type': 'Person', '@id': base + '#photographer', name: 'Ekaterina Perova', alternateName: 'Екатерина Перова', url: base, sameAs: ['https://www.instagram.com/qatyaperova/', 'https://t.me/qatya', 'https://www.linkedin.com/in/enpero'] };
const schema = {
  '@context': 'https://schema.org',
  '@graph': [author,
    { '@type': 'WebSite', '@id': base + '#website', url: base, name: 'Photo Gallery by Ekaterina Perova', inLanguage: 'ru', creator: { '@id': author['@id'] } },
    { '@type': 'ImageGallery', '@id': base + '#gallery', url: base,
      name: 'Фотографии Кипра, природы и котов',
      description: 'Авторская фотогалерея Екатерины Перовой: природа Кипра, коты, пейзажи и портреты.',
      inLanguage: 'ru', isPartOf: { '@id': base + '#website' }, creator: { '@id': author['@id'] },
      image: photos.map(photo => ({ '@type': 'ImageObject', '@id': base + '#photo-' + encodeURIComponent(photo.id), contentUrl: new URL(photo.url, base).href, name: photo.title || 'Фотография из галереи Екатерины Перовой', creator: { '@id': author['@id'] }, creditText: 'Перова Екатерина' })) }
  ]
};
const json = JSON.stringify(schema).replace(/</g, '\\u003c');
if (!source.includes('<!-- structured-data -->')) throw new Error('Structured data placeholder missing');
const html = source.replace('<!-- structured-data -->', `<script type="application/ld+json">${json}</script>`);
const xmlEscape = value => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n  <url>\n    <loc>${base}</loc>\n${photos.map(photo => `    <image:image><image:loc>${xmlEscape(new URL(photo.url, base).href)}</image:loc></image:image>`).join('\n')}\n  </url>\n</urlset>\n`;
await mkdir('docs', { recursive: true });
await writeFile('docs/index.html', html);
await writeFile('docs/sitemap.xml', sitemap);
await writeFile('docs/.nojekyll', '');
console.log(`Built Pages with structured data and sitemap for ${photos.length} images.`);
