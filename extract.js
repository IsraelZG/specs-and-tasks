const fs = require('fs');
const path = require('path');

const fileContent = fs.readFileSync('c:\\Dev2026\\Docs\\implementação llm-lingua.txt', 'utf-8');
const lines = fileContent.split('\n');
const jsonLine = lines[3]; // Line 4 is the JSON array
const files = JSON.parse(jsonLine);

const outDir = 'c:\\Dev2026\\Docs\\packages\\llmlingua-js';
fs.mkdirSync(outDir, { recursive: true });

files.forEach(f => {
  const filePath = path.join(outDir, f.fileName);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, f.generatedCode);
  console.log(`Created ${filePath}`);
});
