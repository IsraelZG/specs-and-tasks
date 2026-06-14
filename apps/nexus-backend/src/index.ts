import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';

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

app.listen(PORT, () => {
  console.log(`Nexus Backend running on port ${PORT}`);
});
