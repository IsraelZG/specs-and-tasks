#!/usr/bin/env node
/**
 * Remove artifacts órfãos gitignored da raiz do repo (Docs): snapshots de Gate pós-integração
 * (.dmm*-evidence/) e logs/dirs de sessão de agentes (.tmp-*, .tmp). Extraído do one-liner inline
 * que vivia no passo 6 do SKILL.md de /drenar-fila — comando fixo sem parênteses/aspas facilita
 * escrever a regra de permissão pra rodar headless (Windows Task Scheduler).
 */
import fs from 'node:fs';
import path from 'node:path';

const dirt = fs.readdirSync('.').filter((f) => f.startsWith('.dmm') || f.startsWith('.tmp-') || f === '.tmp');
for (const f of dirt) fs.rmSync(path.join('.', f), { recursive: true, force: true });
console.log(dirt.length + ' artifacts removidos');
