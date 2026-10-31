import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));
for (const file of ['dist/app.js', 'dist/db.js', 'dist/operation-catalog.js', 'server.mjs']) {
  execFileSync(process.execPath, ['--check', path.join(root, file)], { stdio: 'inherit' });
}
const html = readFileSync(path.join(root, 'dist/index.html'), 'utf8');
const app = readFileSync(path.join(root, 'dist/app.js'), 'utf8');
const db = readFileSync(path.join(root, 'dist/db.js'), 'utf8');
const operationCatalog = readFileSync(path.join(root, 'dist/operation-catalog.js'), 'utf8');
const checklist = readFileSync(path.join(root, 'UC_CHECKLIST.md'), 'utf8');
for (const match of html.matchAll(/(?:src|href)="\.\/([^"#]+)"/g)) {
  if (!existsSync(path.join(root, 'dist', match[1]))) throw new Error(`Missing asset ${match[1]}`);
}
for (const marker of ['lang="ru"', 'id="login-form"', 'id="patient-login-form"', 'id="logout-user"', 'id="detail-dialog"', 'id="detail-content"', 'id="attachments-input"', 'id="attachment-feedback"', 'id="attachment-preview-dialog"', 'type="file"', 'name="inPersonRequired"', 'value="draft"', 'value="publish"', 'data-view="users"']) {
  if (!html.includes(marker)) throw new Error(`Missing interface element: ${marker}`);
}
if (html.includes('Это имитация входа для проверки Use Case, не защита данных.')) throw new Error('Obsolete login disclaimer is still shown');
for (const obsolete of ['МАРШРУТ ПОМОЩИ', 'field-help', 'demo-tag', 'switch-user', 'Сменить аккаунт']) {
  if (html.includes(obsolete) || app.includes(obsolete)) throw new Error(`Obsolete interface element remains: ${obsolete}`);
}
if (!app.includes('<h2>Только тестовые данные</h2>')) throw new Error('Test-data heading was not updated');
if (!html.includes('class="brand-symbol" aria-hidden="true"><svg')) throw new Error('New vector brand mark is missing');
for (const useCase of ['UC-ADM-01', 'UC-AMB-01', 'UC-AMB-02', 'UC-HOSP-01', 'UC-HOSP-02', 'UC-PAT-01']) {
  if (!checklist.includes(useCase)) throw new Error(`Missing Use Case review: ${useCase}`);
}
for (const feature of ['function renderUsers', 'function ownsReferral', 'function renderTrack', 'function stageOffer', 'function statusActionHTML', 'function contactActionsHTML', "u.secret===code", "p.createdBy===currentUser.id"]) {
  if (!app.includes(feature)) throw new Error(`Missing role workflow: ${feature}`);
}
if (!db.includes('indexedDB.open') || !db.includes('saveSnapshot')) throw new Error('IndexedDB persistence is missing');
if (!app.includes("document.getElementById('logout-user').addEventListener('click'")) throw new Error('Logout action is missing');
for (const feature of ['function attachmentItemsHTML', 'function openAttachmentPreview', 'URL.createObjectURL(blob)', 'data-preview-attachment', 'class="attachment-pdf"', 'class="attachment-image"']) {
  if (!app.includes(feature)) throw new Error(`Missing attachment display or preview workflow: ${feature}`);
}
if (!app.includes("if(b.dataset.open){openPatient(b.dataset.open);return;}")) throw new Error('Referral row action is not wired to its detail dialog');
if (!app.includes("validName=/^(ДЕМО-|DEMO-)/i.test(name)")) throw new Error('Synthetic attachment filename guard is missing');
if ((operationCatalog.match(/^\s+"/gm) || []).length !== 67) throw new Error('Expected all 67 operation names from the supplied HTML');
const css = readFileSync(path.join(root, 'dist/style.css'), 'utf8');
for (const rule of ['.login-dialog label{display:grid', '.form-dialog:not(.login-dialog){width:min(1120px', '.form-dialog:not(.login-dialog) .form-grid{grid-template-columns:repeat(4', '.form-dialog:not(.login-dialog) .checkbox-label input[type=checkbox]{flex:0 0 18px;width:18px', '.brand-symbol svg', '.attachment-list']) {
  if (!css.includes(rule)) throw new Error(`Missing popup layout fix: ${rule}`);
}
if (!existsSync(path.join(root, 'database/pilot-schema.sql'))) throw new Error('Missing PostgreSQL pilot schema');
for (const file of ['README.md', 'ARCHITECTURE.md', 'UC_CHECKLIST.md']) {
  if (!existsSync(path.join(root, file))) throw new Error(`Missing project guide ${file}`);
}
if (!html.includes('accept=".pdf,.jpg,.jpeg,.png"')) throw new Error('File picker must limit its types');
console.log('JavaScript syntax, assets, role workflows, all six Use Cases, operation catalog, fake-only file picker, and DB schema verified.');
