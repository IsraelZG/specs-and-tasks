/**
 * TaskService — fonte ÚNICA de escrita do ciclo de vida MGTIA de tarefas.
 *
 * Porta a lógica de tools/scripts/manage-task.mjs (status + Log de Execução) e
 * tools/scripts/rebuild-index.mjs (geração do INDEX) para TypeScript tipado.
 * Toda mutação reescreve o frontmatter, faz append datado no Log de Execução e
 * regenera o INDEX.md numa única operação.
 *
 * NÃO importa os scripts .mjs; o comportamento (formato de log, formato do INDEX)
 * é replicado fielmente para manter compatibilidade byte-a-byte.
 */
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import {
  CreateTaskInput,
  InvalidTransitionError,
  LogEntry,
  PROGRESS_LABEL,
  TaskAction,
  TaskError,
  TaskFilter,
  TaskFrontmatter,
  TaskNotFoundError,
  TaskRecord,
  TaskStatus,
  TRANSITIONS,
} from './task.types.js';

export interface TaskServiceOptions {
  /** Raiz do repositório (contém tasks/ e meta-tasks/). Default: NEXUS_ROOT_DIR ou cwd. */
  rootDir?: string;
}

const LOG_LINE_RE = /^- \*\*\[(.+?)\]\*\* - \*(.+?)\* - `(.+?)`(?::\s?(.*))?$/;
const LOG_SECTION = '## 9. Log de Execução';

export class TaskService {
  private readonly rootDir: string;

  constructor(opts: TaskServiceOptions = {}) {
    this.rootDir = opts.rootDir ?? process.env.NEXUS_ROOT_DIR ?? process.cwd();
  }

  private get tasksDir(): string {
    return path.join(this.rootDir, 'tasks');
  }

  private get metaTasksDir(): string {
    return path.join(this.rootDir, 'meta-tasks');
  }

  /** Resolve o caminho de uma task em tasks/ ou meta-tasks/. */
  private resolvePath(id: string): string {
    const inTasks = path.join(this.tasksDir, `${id}.md`);
    if (fs.existsSync(inTasks)) return inTasks;
    const inMeta = path.join(this.metaTasksDir, `${id}.md`);
    if (fs.existsSync(inMeta)) return inMeta;
    throw new TaskNotFoundError(`Tarefa ${id} não encontrada em /tasks ou /meta-tasks.`);
  }

  // ---------------------------------------------------------------- leitura

  getTask(id: string): TaskRecord {
    const filePath = this.resolvePath(id);
    const raw = fs.readFileSync(filePath, 'utf8');
    const parsed = matter(raw);
    const frontmatter = parsed.data as TaskFrontmatter;
    return {
      id: frontmatter.id ?? id,
      frontmatter,
      body: parsed.content,
      log: this.parseLog(parsed.content),
      path: filePath,
    };
  }

  listTasks(filter: TaskFilter = {}): TaskRecord[] {
    const dirs = [this.tasksDir, this.metaTasksDir].filter((d) => fs.existsSync(d));
    const records: TaskRecord[] = [];
    for (const dir of dirs) {
      const files = fs
        .readdirSync(dir)
        .filter((f) => f.endsWith('.md') && f !== 'INDEX.md' && !f.startsWith('_'));
      for (const file of files) {
        const record = this.getTask(file.replace(/\.md$/, ''));
        if (filter.status && record.frontmatter.status !== filter.status) continue;
        if (filter.targetAgent && record.frontmatter.target_agent !== filter.targetAgent) continue;
        records.push(record);
      }
    }
    records.sort((a, b) => a.id.localeCompare(b.id));
    return records;
  }

  private parseLog(body: string): LogEntry[] {
    const idx = body.indexOf(LOG_SECTION);
    if (idx === -1) return [];
    const section = body.slice(idx);
    const entries: LogEntry[] = [];
    for (const line of section.split('\n')) {
      const m = LOG_LINE_RE.exec(line.trim());
      if (m) {
        entries.push({
          timestamp: m[1],
          agent: m[2],
          label: m[3], // já vem com colchetes, ex.: "[Iniciado]"
          message: m[4] ?? '',
          raw: line.trim(),
        });
      }
    }
    return entries;
  }

  // --------------------------------------------------------------- mutações

  /** Cria uma nova task (status draft) a partir do template MGTIA. Regenera o INDEX. */
  createTask(input: CreateTaskInput): TaskRecord {
    const isMeta = input.id.startsWith('M-');
    const dir = isMeta ? this.metaTasksDir : this.tasksDir;
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const filePath = path.join(dir, `${input.id}.md`);
    if (fs.existsSync(filePath)) {
      throw new TaskError(`Tarefa ${input.id} já existe.`);
    }
    fs.writeFileSync(filePath, this.renderTemplate(input), 'utf8');
    this.rebuildIndexes();
    return this.getTask(input.id);
  }

  /** Aplica uma transição da máquina de estados, grava log e regenera o INDEX. */
  transition(id: string, action: TaskAction, agent: string, message = ''): TaskRecord {
    const rule = TRANSITIONS[action];
    if (!rule) throw new TaskError(`Ação inválida: ${action}`);

    const filePath = this.resolvePath(id);
    let content = fs.readFileSync(filePath, 'utf8');
    const current = this.readStatus(content);

    if (rule.from !== '*' && !rule.from.includes(current)) {
      throw new InvalidTransitionError(
        `Transição inválida: '${action}' requer status ${rule.from.join('|')}, mas a task ${id} está em '${current}'.`,
      );
    }

    content = this.replaceStatus(content, rule.to);
    content = this.appendLog(content, agent, rule.logLabel, message);
    fs.writeFileSync(filePath, content, 'utf8');
    this.rebuildIndexes();
    return this.getTask(id);
  }

  /** Registra progresso no Log de Execução SEM mudar o status (checkpoint/handoff durável). */
  logProgress(id: string, agent: string, message: string): TaskRecord {
    const filePath = this.resolvePath(id);
    let content = fs.readFileSync(filePath, 'utf8');
    content = this.appendLog(content, agent, PROGRESS_LABEL, message);
    fs.writeFileSync(filePath, content, 'utf8');
    return this.getTask(id);
  }

  /** Atribui/realoca o agente responsável (target_agent). Regenera o INDEX. */
  assign(id: string, targetAgent: string): TaskRecord {
    const filePath = this.resolvePath(id);
    let content = fs.readFileSync(filePath, 'utf8');
    if (/^target_agent:\s*.*$/m.test(content)) {
      content = content.replace(/^target_agent:\s*.*$/m, `target_agent: ${targetAgent}`);
    } else {
      content = content.replace(/^---\r?\n/, `---\ntarget_agent: ${targetAgent}\n`);
    }
    fs.writeFileSync(filePath, content, 'utf8');
    this.rebuildIndexes();
    return this.getTask(id);
  }

  // ------------------------------------------------------------- utilitários

  private readStatus(content: string): TaskStatus {
    const m = content.match(/^status:\s*(.*)$/m);
    if (!m) throw new TaskError('Frontmatter sem campo status.');
    return m[1].trim() as TaskStatus;
  }

  private replaceStatus(content: string, status: TaskStatus): string {
    return content.replace(/^status:\s*.*$/m, `status: ${status}`);
  }

  private appendLog(content: string, agent: string, label: string, message: string): string {
    const timestamp = new Date().toISOString().slice(0, 16); // YYYY-MM-DDTHH:mm
    const entry = `- **[${timestamp}]** - *${agent}* - \`${label}\`${message ? `: ${message}` : ''}\n`;
    if (!content.includes(LOG_SECTION)) {
      return `${content}\n${LOG_SECTION} (Agent Execution Log)\n${entry}`;
    }
    return content.endsWith('\n') ? content + entry : `${content}\n${entry}`;
  }

  // ------------------------------------------------------------------ INDEX
  // Porta fiel de rebuild-index.mjs (parser ingênuo por linha + tabela markdown),
  // para garantir saída idêntica à ferramenta legada.

  private parseFrontmatterNaive(content: string): Record<string, string> {
    const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (!match) return {};
    const fm: Record<string, string> = {};
    for (const line of match[1].split('\n')) {
      const colon = line.indexOf(':');
      if (colon === -1) continue;
      const key = line.slice(0, colon).trim();
      let value = line.slice(colon + 1).trim();
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      fm[key] = value;
    }
    return fm;
  }

  private buildIndexForDirectory(dirPath: string): void {
    if (!fs.existsSync(dirPath)) return;
    const files = fs
      .readdirSync(dirPath)
      .filter((f) => f.endsWith('.md') && f !== 'INDEX.md' && !f.startsWith('_'));

    const tasks = files
      .map((f) => this.parseFrontmatterNaive(fs.readFileSync(path.join(dirPath, f), 'utf8')))
      .filter((m) => m.id && m.title)
      .sort((a, b) => a.id.localeCompare(b.id));

    let md = `# Dashboard de Tarefas: ${path.basename(dirPath)}\n\n`;
    md += `> **Atualizado automaticamente.** Agentes: não editem este arquivo. Usem \`manage-task.mjs\` para atualizar status.\n\n`;
    md += `| ID | Título | Status | Agente Alocado | Complexidade |\n`;
    md += `|---|---|---|---|---|\n`;
    for (const t of tasks) {
      md += `| [${t.id}](./${t.id}.md) | ${t.title} | \`${t.status || 'unknown'}\` | ${t.target_agent || '-'} | ${t.complexity || '-'} |\n`;
    }
    fs.writeFileSync(path.join(dirPath, 'INDEX.md'), md, 'utf8');
  }

  rebuildIndexes(): void {
    this.buildIndexForDirectory(this.tasksDir);
    this.buildIndexForDirectory(this.metaTasksDir);
  }

  // --------------------------------------------------------------- template

  private renderTemplate(input: CreateTaskInput): string {
    const deps = JSON.stringify(input.dependencies ?? []).replace(/,/g, ', ');
    const blocks = JSON.stringify(input.blocks ?? []).replace(/,/g, ', ');
    return `---
id: ${input.id}
title: "${input.title}"
status: draft
complexity: ${input.complexity ?? 2}
target_agent: ${input.targetAgent ?? 'logic_agent'}
reviewer_agent: agile_reviewer
execution_mode: sequential
dependencies: ${deps}
blocks: ${blocks}
---

# ${input.id} · ${input.title}

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js v20+
- **Package Manager:** \`pnpm\`
- **Test Runner:** \`vitest\`

## 1. Objetivo
*(Descreva a meta final desta tarefa)*

## 2. Contexto RAG (Spec-Driven Development)
- [ ] \`docs/...\`

## 3. Escopo de Arquivos (Inputs e Outputs)
- **[READ]** \`...\`
- **[CREATE]** \`...\`
- **[UPDATE]** \`...\`

## 4. Estratégia de Testes Estrita (Test-Driven Development)
- [ ] **Framework:**
- [ ] **Cobertura:**
- [ ] **Ambiente:**

## 5. Instruções de Execução (Step-by-Step)
> **⚠️ REGRAS DO QUE NÃO FAZER:**
> -

1.

## 6. Feedback de Especificação (Spec Feedback Loop)
- *[Nenhum problema identificado]*

## 7. Definition of Done (DoD) & Reviewer Checklist
- [ ] \`pnpm test\` verde no ambiente especificado?

## 8. Log de Handover e Revisão Agile (Code Review)
### Handover do Executor:
-

### Parecer do Agente Revisor (Reviewer):
- [ ] **Aprovado**
- [ ] **Requer Refatoração**
- **Comentários de Revisão:**

## 9. Log de Execução (Agent Execution Log)
> **Agentes de IA:** Registrem aqui cada sessão de trabalho usando \`node tools/scripts/manage-task.mjs\`.
`;
  }
}
