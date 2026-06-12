import fs from 'fs';
import path from 'path';

const OUTPUT_BASENAME = 'project_structure_and_content';
const OUTPUT_EXTENSION = '.txt';
const CURRENT_DIR = process.cwd();
const SCRIPT_NAME = path.basename(import.meta.url).split('?')[0];

let diagramContent = 'Estrutura do Projeto:\n';
let fileContents = '\n--- Conteúdo dos Arquivos ---\n';
let filesToRead = [];

// Lista para armazenar as regras do .gitignore convertidas em RegExp
const ignoreRules = [];

// Adiciona regras padrões de forma manual
addIgnorePattern(OUTPUT_BASENAME + '*');
addIgnorePattern(SCRIPT_NAME);
addIgnorePattern('.git/');

// Função para converter o padrão de texto do gitignore para RegExp
function addIgnorePattern(pattern) {
  let cleaned = pattern.trim();
  // Ignora linhas vazias ou comentários
  if (!cleaned || cleaned.startsWith('#')) return;

  // Escapa caracteres especiais de RegExp, exceto os que importam para o glob (*, ?, /)
  // Substitui '*' por '.*' e '?' por '.'
  let regexString = cleaned
    .replace(/[.+^${}()|[\]\\]/g, '\\$&') // Escapa regex
    .replace(/\*/g, '.*')               // Convierte * em .*
    .replace(/\?/g, '.');                // Convierte ? em .

  // Se o padrão termina com '/', significa que casa com o diretório e tudo dentro dele
  if (regexString.endsWith('/')) {
    regexString += '.*';
  } else {
    // Caso contrário, pode ser um arquivo ou uma pasta inteira
    regexString += '($|/.*)';
  }

  // Garante que case se o padrão iniciar no meio do caminho (comportamento padrão do gitignore)
  if (!regexString.startsWith('/')) {
    regexString = '(^|.*/)' + regexString;
  } else {
    regexString = '^' + regexString.substring(1);
  }

  try {
    ignoreRules.push(new RegExp(regexString));
  } catch (e) {
    // Ignora padrões malformados silenciosamente
  }
}

function shouldIgnore(relativePath) {
  // Normaliza barras para o padrão Unix/Git (/)
  const normalizedPath = relativePath.replace(/\\/g, '/');
  return ignoreRules.some((regex) => regex.test(normalizedPath));
}

function getOutputFilename() {
  let counter = 1;
  let filename = `${OUTPUT_BASENAME}${OUTPUT_EXTENSION}`;
  while (fs.existsSync(path.join(CURRENT_DIR, filename))) {
    filename = `${OUTPUT_BASENAME}_${counter}${OUTPUT_EXTENSION}`;
    counter++;
  }
  return filename;
}

function loadGitignore(dir) {
  const gitignorePath = path.join(dir, '.gitignore');
  if (fs.existsSync(gitignorePath)) {
    const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
    gitignoreContent.split('\n').forEach(addIgnorePattern);
  }
}

function buildStructure(currentPath, prefix = '', rootPath = CURRENT_DIR) {
  const items = fs.readdirSync(currentPath, { withFileTypes: true });

  const visibleItems = items.filter((dirent) => {
    let itemRelativePath = path.relative(rootPath, path.join(currentPath, dirent.name));
    if (dirent.isDirectory()) {
      itemRelativePath += '/';
    }
    // Substituído ig.ignores por nossa função nativa
    return !shouldIgnore(itemRelativePath);
  });

  for (let i = 0; i < visibleItems.length; i++) {
    const dirent = visibleItems[i];
    const itemName = dirent.name;
    const itemPath = path.join(currentPath, itemName);
    const isLast = i === visibleItems.length - 1;

    const connector = isLast ? '└── ' : '├── ';
    const newPrefix = prefix + (isLast ? '    ' : '│   ');

    if (dirent.isDirectory()) {
      diagramContent += `${prefix}${connector}${itemName}/\n`;
      buildStructure(itemPath, newPrefix, rootPath);
    } else if (dirent.isFile()) {
      diagramContent += `${prefix}${connector}${itemName}\n`;
      filesToRead.push(itemPath);
    }
  }
}

function appendFileContents() {
  for (const filePath of filesToRead) {
    try {
      const relativePath = path.relative(CURRENT_DIR, filePath);
      const ext = path.extname(filePath).toLowerCase();
      const textExtensions = [
        '.js', '.jsx', '.ts', '.tsx', '.vue', '.html', '.css', '.scss', '.less',
        '.json', '.md', '.txt', '.xml', '.yml', '.yaml', '.svg', '.env',
        '.gitignore', '.log', '.gitattributes',
      ];

      if (textExtensions.includes(ext) || !ext) {
        const content = fs.readFileSync(filePath, 'utf8');
        fileContents += `\n--- Conteúdo de: ${relativePath} ---\n`;
        fileContents += content;
        fileContents += '\n';
      } else {
        fileContents += `\n--- Conteúdo de: ${relativePath} (Arquivo binário/não-texto ignorado na transcrição) ---\n`;
      }
    } catch (error) {
      fileContents += `\n--- Não foi possível ler o conteúdo de: ${path.relative(CURRENT_DIR, filePath)} ---\n`;
      fileContents += `Erro: ${error.message}\n`;
    }
  }
}

async function main() {
  console.log('Gerando estrutura e conteúdo do projeto...');
  loadGitignore(CURRENT_DIR);
  diagramContent += `.\n`;
  buildStructure(CURRENT_DIR, '', CURRENT_DIR);
  appendFileContents();

  const outputFilename = getOutputFilename();

  try {
    fs.writeFileSync(
      path.join(CURRENT_DIR, outputFilename),
      diagramContent + fileContents,
      'utf8',
    );
    console.log(`\nArquivo '${outputFilename}' gerado com sucesso na pasta atual.`);
    console.log('Lembre-se de apagar este arquivo quando terminar de usá-lo ou adicioná-lo ao seu .gitignore!');
  } catch (error) {
    console.error(`Erro ao escrever no arquivo ${outputFilename}:`, error);
  }
}

main();