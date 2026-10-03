import fs from 'node:fs';
import path from 'node:path';
const lock = JSON.parse(fs.readFileSync('package-lock.json', 'utf8'));
const records = [];
fs.mkdirSync('docs/licenses', { recursive: true });
for (const [location, item] of Object.entries(lock.packages)) {
  if (!location || item.dev) continue;
  const manifest = path.join(location, 'package.json');
  if (!fs.existsSync(manifest)) continue;
  const pkg = JSON.parse(fs.readFileSync(manifest, 'utf8'));
  const key = `${pkg.name}@${pkg.version}`;
  if (records.some(r => r.package === key)) continue;
  const licenses = [];
  for (const file of fs.readdirSync(location).filter(file => /^(licen[sc]e|copying|notice)(\.|$|-)/i.test(file))) {
    const source = path.join(location, file); if (!fs.statSync(source).isFile()) continue;
    const target = `docs/licenses/${key.replaceAll('/', '__')}-${file}`;
    fs.copyFileSync(source, target); licenses.push(target);
  }
  let license = pkg.license ?? pkg.licenses?.map(l => l.type).join(' OR ') ?? item.license;
  if (!licenses.length || !license) {
    for (const file of fs.readdirSync(location).filter(file => /^readme(\.|$)/i.test(file))) {
      const source = path.join(location, file); if (!fs.statSync(source).isFile()) continue;
      const readme = fs.readFileSync(source, 'utf8');
      if (!license && /##?\s+license[\s\S]*?MIT License/i.test(readme)) license = 'MIT';
      const target = `docs/licenses/${key.replaceAll('/', '__')}-${file}`;
      fs.copyFileSync(source, target); licenses.push(target);
    }
    // Some npm archives keep their copyright notice in the source header only.
    if (typeof pkg.main === 'string') {
      const source = path.join(location, pkg.main);
      if (fs.existsSync(source) && fs.statSync(source).isFile() && /\.(m?js|cjs)$/.test(source)) {
        const contents = fs.readFileSync(source, 'utf8');
        if (/copyright|@license|MIT License/i.test(contents.slice(0, 4096))) {
          const target = `docs/licenses/${key.replaceAll('/', '__')}-source-notice.js`;
          fs.writeFileSync(target, contents); licenses.push(target);
        }
      }
    }
  }
  records.push({ package: key, license: license ?? 'UNKNOWN', source: typeof pkg.repository === 'string' ? pkg.repository : pkg.repository?.url ?? '', notices: licenses });
}
records.sort((a,b) => a.package.localeCompare(b.package));
fs.writeFileSync('docs/dependency-licenses.json', JSON.stringify(records, null, 2) + '\n');
const rows = records.map(r=>`| ${r.package} | ${r.license} | ${r.notices.map(p=>`[notice](${p.replace('docs/','')})`).join(' ')} |`);
fs.writeFileSync('docs/THIRD_PARTY_LICENSES.md', '# Third-party licenses\n\nGenerated from the locked production dependency graph by `npm run licenses`. Includes installed optional/transitive packages; not all are bundled into the browser app. Original notices are preserved in `licenses/`.\n\n| Package | License | Notices |\n| --- | --- | --- |\n'+rows.join('\n')+'\n');
console.log(`Recorded ${records.length} production dependency licenses.`);
const unknown = records.filter(r => r.license === 'UNKNOWN');
if (unknown.length) { console.error('Unknown licenses:', unknown.map(r=>r.package).join(', ')); process.exitCode=1; }
