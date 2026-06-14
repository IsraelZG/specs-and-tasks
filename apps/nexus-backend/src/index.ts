import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { routeIntent } from './services/router.js';
import { TurboVecClient } from './services/turbovec.client.js';
import { HeadroomClient } from './services/headroom.client.js';

const app = express();
app.use(cors());
app.use(express.json());
const PORT = process.env.PORT || 3001;

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'nexus-backend' });
});

// Helper for absolute path to root
const ROOT_DIR = path.resolve(__dirname, '../../../');

app.get('/api/tasks', async (req, res) => {
  try {
    const tasksDir = path.join(ROOT_DIR, 'tasks');
    const files = await fs.readdir(tasksDir);
    const mdFiles = files.filter(f => f.endsWith('.md') && f !== 'INDEX.md');
    
    const tasksList = await Promise.all(mdFiles.map(async file => {
      const content = await fs.readFile(path.join(tasksDir, file), 'utf-8');
      return { id: file.replace('.md', ''), content };
    }));
    res.json(tasksList);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/build-prompt', async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) {
      return res.status(400).json({ error: "Query is required" });
    }

    // 1. Intent Routing (Keywords)
    const keywords = await routeIntent(query);
    
    // 2. Fetch from Vector DB
    const searchResults = await TurboVecClient.search(keywords.join(' '));
    const rawContext = searchResults.results && searchResults.results.length > 0 
      ? searchResults.results.map((r: any) => r.content).join('\n\n') 
      : 'Contexto simulado para testes: A documentação do projeto afirma que...';
    
    // 3. Compress
    const compressedContext = await HeadroomClient.compressContext(rawContext);
    
    res.json({
      originalLength: rawContext.length,
      compressedLength: compressedContext.length,
      payload: compressedContext,
      keywords
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Nexus Backend running on port ${PORT}`);
});
