const fs = require('fs');
const path = require('path');

const dir = 'apps/design-system-showcase/src';
const patterns = ['sections', 'ui'];
let count = 0;

for (const p of patterns) {
  const fullDir = path.join(dir, p);
  for (const f of fs.readdirSync(fullDir)) {
    if (!f.endsWith('.tsx')) continue;
    const fp = path.join(fullDir, f);
    let c = fs.readFileSync(fp, 'utf8');
    if (c.includes('@ds/index')) {
      c = c.split('@ds/index').join('@plataforma/design-system');
      fs.writeFileSync(fp, c);
      count++;
    }
  }
}
const app = path.join(dir, 'App.tsx');
let ac = fs.readFileSync(app, 'utf8');
if (ac.includes('@ds/index')) {
  ac = ac.split('@ds/index').join('@plataforma/design-system');
  fs.writeFileSync(app, ac);
  count++;
}
console.log('Fixed ' + count + ' files');