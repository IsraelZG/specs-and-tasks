const fs = require('fs');
const path = require('path');
const tasksDir = path.join('c:/Dev2026/Docs/tasks');
const files = fs.readdirSync(tasksDir).filter(f => f.endsWith('.md') && !f.startsWith('_') && f !== 'INDEX.md' && f !== 'LEDGER.md');

let updatedCount = 0;

for (const file of files) {
  const filepath = path.join(tasksDir, file);
  let content = fs.readFileSync(filepath, 'utf8').replace(/\r\n/g, '\n');

  // Skip if it doesn't have frontmatter at all
  if (!content.match(/^---\n([\s\S]*?)\n---/)) continue;

  const mCapFM = content.match(/^capacity_target:\s*(.+)$/m);
  const mCapBody = content.match(/- \*\*Capacidade[- ]?[aA]lvo:\*\*\s*(.+)$/im);
  
  const hasCapFM = mCapFM && mCapFM[1].trim() !== '' && mCapFM[1].trim() !== 'null';
  
  if (!hasCapFM && mCapBody) {
    let bodyCap = mCapBody[1].trim();
    if (bodyCap.includes('*')) bodyCap = bodyCap.split('*')[0].trim();
    if (bodyCap.includes('(')) bodyCap = bodyCap.split('(')[0].trim();
    
    if (bodyCap === '') continue; // Nothing to extract

    // Add to frontmatter
    content = content.replace(/^---\n([\s\S]*?)\n---/, (match, inner) => {
      // If capacity_target line exists but is empty
      if (inner.match(/^capacity_target:/m)) {
        return `---\n${inner.replace(/^capacity_target:.*$/m, 'capacity_target: ' + bodyCap)}\n---`;
      } else {
        // Find the last line before ---
        return `---\n${inner}\ncapacity_target: ${bodyCap}\n---`;
      }
    });
    fs.writeFileSync(filepath, content, 'utf8');
    console.log(`Updated capacity_target in ${file} to ${bodyCap}`);
    updatedCount++;
  }
}

console.log(`Total files updated: ${updatedCount}`);
