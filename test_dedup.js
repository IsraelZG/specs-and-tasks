import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const CURRENT_DIR = process.cwd();

function findFiles(dir, fileList = []) {
  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of items) {
    const itemPath = path.join(dir, item.name);
    // Ignore common non-doc directories
    if (item.isDirectory()) {
      if (!['.git', 'node_modules', '.vscode', '.claude', '.foam', 'scripts', 'tools'].includes(item.name)) {
        findFiles(itemPath, fileList);
      }
    } else {
      const ext = path.extname(item.name).toLowerCase();
      // Look at markdown and text files, ignore the generated summary files and this test script itself
      if (['.md', '.txt', '.json', '.js'].includes(ext) 
          && !item.name.startsWith('project_structure_and_content')
          && !item.name.includes('test_dedup')
          && !item.name.includes('design-system-stub')) { // also ignore the big stub to focus on real docs
        fileList.push(itemPath);
      }
    }
  }
  return fileList;
}

const files = findFiles(CURRENT_DIR);
const blockHashes = new Map();

for (const file of files) {
  try {
    const content = fs.readFileSync(file, 'utf8');
    // Split into paragraphs/blocks by double newline
    const blocks = content.split(/\n\s*\n/);
    
    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i].trim();
      // Only care about substantial blocks (> 100 chars) to avoid matching generic short headers or code blocks
      if (block.length > 100) {
        const hash = crypto.createHash('sha256').update(block).digest('hex');
        if (blockHashes.has(hash)) {
          blockHashes.get(hash).locations.push({ file, index: i });
        } else {
          blockHashes.set(hash, {
            content: block,
            locations: [{ file, index: i }]
          });
        }
      }
    }
  } catch (e) {
    // Ignore read errors
  }
}

// Filter out blocks that appear only once
let totalSavedBytes = 0;
const report = [];

for (const [hash, data] of blockHashes.entries()) {
  // If the locations are from different files OR even the same file, it's duplication
  // Let's filter to only those that appear more than once
  if (data.locations.length > 1) {
    const appearances = data.locations.length;
    const size = data.content.length;
    const saved = size * (appearances - 1);
    totalSavedBytes += saved;
    
    report.push({
      size,
      appearances,
      saved,
      contentPreview: data.content.substring(0, 100).replace(/\n/g, ' ') + '...',
      locations: data.locations.map(loc => path.relative(CURRENT_DIR, loc.file))
    });
  }
}

report.sort((a, b) => b.saved - a.saved);

console.log(`================ DEDUPLICATION REPORT ================`);
console.log(`Total duplicated blocks found (>100 chars): ${report.length}`);
console.log(`Total bytes that could be saved: ${totalSavedBytes}`);
console.log(`\nTop 15 most impactful duplicates:`);

for (let i = 0; i < Math.min(15, report.length); i++) {
  const item = report[i];
  console.log(`\n[${i+1}] Saved: ${item.saved} bytes (${item.appearances} occurrences, ${item.size} bytes each)`);
  console.log(`Preview: "${item.contentPreview}"`);
  console.log(`Found in:`);
  const uniqueFiles = [...new Set(item.locations)];
  uniqueFiles.forEach(f => {
    const fileCount = item.locations.filter(l => l === f).length;
    console.log(`  - ${f} (${fileCount}x)`);
  });
}
