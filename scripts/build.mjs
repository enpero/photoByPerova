import {readFile,mkdir,writeFile,copyFile} from 'node:fs/promises';
const html=await readFile('page.html','utf8');
const code=await readFile('worker/index.js','utf8');
await mkdir('dist/server',{recursive:true});await mkdir('dist/.openai',{recursive:true});
await writeFile('dist/server/index.js','const HTML = '+JSON.stringify(html)+';\n'+code);
await copyFile('.openai/hosting.json','dist/.openai/hosting.json');
