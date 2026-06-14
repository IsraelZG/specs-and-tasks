import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';
import { TurboVecClient } from './turbovec.client.js';

export async function walkDirectory(dir: string, fileList: string[] = []): Promise<string[]> {
  const files = await fs.readdir(dir, { withFileTypes: true });
  for (const file of files) {
    const fullPath = path.join(dir, file.name);
    if (file.isDirectory()) {
      await walkDirectory(fullPath, fileList);
    } else if (file.name.endsWith('.md')) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

export async function indexMarkdownFiles(baseDir: string) {
  console.log(`Scanning directory: ${baseDir}`);
  const mdFiles = await walkDirectory(baseDir);
  console.log(`Found ${mdFiles.length} Markdown files.`);

  let successCount = 0;

  for (const filePath of mdFiles) {
    try {
      const contentRaw = await fs.readFile(filePath, 'utf-8');
      
      // Extract frontmatter
      const { data: metadata, content } = matter(contentRaw);

      // We only index chunks of text, or the whole file if it's small.
      // For T-1002, we just index the entire content string along with metadata.
      const payload = {
        id: path.relative(baseDir, filePath).replace(/\\/g, '/'),
        content: content.trim(),
        metadata: {
          ...metadata,
          sourcePath: filePath
        }
      };

      if (payload.content.length > 0) {
        await TurboVecClient.indexDocument(payload);
        successCount++;
      }
    } catch (error) {
      console.error(`Error processing file ${filePath}:`, error);
    }
  }

  console.log(`Indexing complete. Successfully indexed ${successCount} files.`);
  return successCount;
}
