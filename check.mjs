import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root=fileURLToPath(new URL('.',import.meta.url));
execFileSync(process.execPath,['--check',path.join(root,'dist/app.js')],{stdio:'inherit'});
const html=readFileSync(path.join(root,'dist/index.html'),'utf8');
const app=readFileSync(path.join(root,'dist/app.js'),'utf8');
for(const match of html.matchAll(/(?:src|href)="\.\/([^"#]+)"/g)){if(!existsSync(path.join(root,'dist',match[1])))throw new Error(`Missing asset ${match[1]}`);}
if(!html.includes('lang="ru"'))throw new Error('Missing language');
for(const marker of ['name="inPersonRequired"','value="draft"','value="publish"','Врач амбулатории','Врач стационара','Пациент','Администратор'])if(!html.includes(marker))throw new Error(`Missing demo interface element: ${marker}`);
for(const feature of ['function renderCalendar','function renderStatistics','function renderArchive','function renderAudit','function offerCardsHTML','function statusActionHTML','function contactActionsHTML','function filteredPatients'])if(!app.includes(feature))throw new Error(`Missing demonstrated workflow: ${feature}`);
console.log('JavaScript syntax, interface assets, roles, and key demo workflows verified.');
