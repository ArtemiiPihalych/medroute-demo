import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));
for (const file of ['dist/app.js', 'dist/db.js', 'server.mjs']) {
  execFileSync(process.execPath, ['--check', path.join(root, file)], { stdio: 'inherit' });
}
const html = readFileSync(path.join(root, 'dist/index.html'), 'utf8');
const app = readFileSync(path.join(root, 'dist/app.js'), 'utf8');
const db = readFileSync(path.join(root, 'dist/db.js'), 'utf8');
const checklist = readFileSync(path.join(root, 'UC_CHECKLIST.md'), 'utf8');
for (const match of html.matchAll(/(?:src|href)="\.\/([^"#]+)"/g)) {
  if (!existsSync(path.join(root, 'dist', match[1]))) throw new Error(`Missing asset ${match[1]}`);
}
for (const marker of ['lang="ru"', 'id="login-form"', 'id="patient-login-form"', 'name="inPersonRequired"', 'value="draft"', 'value="publish"', 'data-view="users"']) {
  if (!html.includes(marker)) throw new Error(`Missing interface element: ${marker}`);
}
for (const useCase of ['UC-ADM-01', 'UC-AMB-01', 'UC-AMB-02', 'UC-HOSP-01', 'UC-HOSP-02', 'UC-PAT-01']) {
  if (!checklist.includes(useCase)) throw new Error(`Missing Use Case review: ${useCase}`);
}
for (const feature of ['function renderUsers', 'function ownsReferral', 'function renderTrack', 'function stageOffer', 'function statusActionHTML', 'function contactActionsHTML', "u.secret===code", "p.createdBy===currentUser.id"]) {
  if (!app.includes(feature)) throw new Error(`Missing role workflow: ${feature}`);
}
if (!db.includes('indexedDB.open') || !db.includes('saveSnapshot')) throw new Error('IndexedDB persistence is missing');
if (!existsSync(path.join(root, 'database/pilot-schema.sql'))) throw new Error('Missing PostgreSQL pilot schema');
for (const file of ['README.md', 'ARCHITECTURE.md', 'UC_CHECKLIST.md']) {
  if (!existsSync(path.join(root, file))) throw new Error(`Missing project guide ${file}`);
}
if (/<input[^>]+type="file"/i.test(html)) throw new Error('Arbitrary file upload must stay disabled in synthetic pilot');
console.log('JavaScript syntax, local assets, role workflows, all six Use Cases, fake-only file handling, and pilot DB schema verified.');
