const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const out = path.join(root, 'dist-netlify');
const files = ['index.html', 'sw.js', 'manifest.json', 'favicon.ico'];

function rmrf(target) {
  if (fs.existsSync(target)) fs.rmSync(target, { recursive: true, force: true });
}

function copyFile(rel) {
  const src = path.join(root, rel);
  const dest = path.join(out, rel);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

function copyDir(rel) {
  const src = path.join(root, rel);
  const dest = path.join(out, rel);
  fs.cpSync(src, dest, { recursive: true });
}

rmrf(out);
fs.mkdirSync(out, { recursive: true });
files.forEach(copyFile);
copyDir('assets');

fs.writeFileSync(path.join(out, '_redirects'), '/* /index.html 200\n');
fs.writeFileSync(path.join(out, '_headers'), [
  '/index.html',
  '  Cache-Control: no-cache',
  '/sw.js',
  '  Cache-Control: no-cache',
  ''
].join('\n'));

console.log(`Netlify build ready: ${path.relative(root, out)}`);
