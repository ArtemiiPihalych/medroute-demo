import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root=fileURLToPath(new URL('.',import.meta.url));
execFileSync(process.execPath,['--check',path.join(root,'dist/app.js')],{stdio:'inherit'});
const html=readFileSync(path.join(root,'dist/index.html'),'utf8');
for(const match of html.matchAll(/(?:src|href)="\.\/([^"#]+)"/g)){if(!existsSync(path.join(root,'dist',match[1])))throw new Error(`Missing asset ${match[1]}`);}
if(!html.includes('lang="ru"'))throw new Error('Missing language');
console.log('JavaScript syntax and local asset references verified.');
