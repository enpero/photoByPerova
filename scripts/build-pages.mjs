import { mkdir, copyFile, writeFile } from 'node:fs/promises';
await mkdir('docs', { recursive: true });
await copyFile('page.html', 'docs/index.html');
await writeFile('docs/.nojekyll', '');
