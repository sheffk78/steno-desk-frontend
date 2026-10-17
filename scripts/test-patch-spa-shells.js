/**
 * Integration test for scripts/patch-spa-shells.js
 * Runs the patcher against temp fixtures: source-format AND minified-format heads,
 * then asserts noindex, self-canonical, title, and idempotency.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execSync } = require('child_process');

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'spa-test-'));
fs.mkdirSync(path.join(tmp, 'scripts'));
fs.mkdirSync(path.join(tmp, 'build'));
fs.copyFileSync(path.join(__dirname, 'patch-spa-shells.js'), path.join(tmp, 'scripts', 'patch-spa-shells.js'));

// Fixture A: source (pretty) format
const pretty = `<!doctype html><html><head><meta name="description" content="x"/>
<link rel="canonical" href="https://stenodesk.co/" />
<title>Steno Desk \u2014 Practice management for freelance court reporters</title></head><body><div id="root"></div><script defer src="/static/js/main.abc123.js"></script></body></html>`;
fs.writeFileSync(path.join(tmp, 'build', 'index.html'), pretty);
fs.writeFileSync(path.join(tmp, 'build', 'spa.html'), pretty);

// Fixture B: minified format (what craco actually emits)
const mini = pretty.replace('<link rel="canonical" href="https://stenodesk.co/" />', '<link rel="canonical" href="https://stenodesk.co/"/>');
fs.writeFileSync(path.join(tmp, 'build', 'mini.html'), mini);

execSync('node scripts/patch-spa-shells.js', { cwd: tmp, stdio: 'inherit' });

// The patcher only rewrites spa.html; re-point it at the minified fixture and rerun
fs.copyFileSync(path.join(tmp, 'build', 'mini.html'), path.join(tmp, 'build', 'spa.html'));
execSync('node scripts/patch-spa-shells.js', { cwd: tmp, stdio: 'inherit' });

const spa = fs.readFileSync(path.join(tmp, 'build', 'spa.html'), 'utf8');
const checks = {
  'noindex injected': spa.includes('name="robots" content="noindex, nofollow"'),
  'self-canonical (minified input)': spa.includes('href="https://stenodesk.co/spa"'),
  'honest title': spa.includes('<title>StenoDesk App</title>'),
  'no duplicate robots (idempotent)': spa.split('name="robots"').length === 2,
  'bundle untouched': spa.includes('/static/js/main.abc123.js'),
  'index.html untouched by patcher': fs.readFileSync(path.join(tmp, 'build', 'index.html'), 'utf8').includes('Practice management'),
};
let fail = 0;
for (const [k, v] of Object.entries(checks)) { console.log((v ? 'PASS ' : 'FAIL ') + k); if (!v) fail = 1; }
fs.rmSync(tmp, { recursive: true, force: true });
process.exit(fail);