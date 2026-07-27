#!/usr/bin/env node
/**
 * Escape hatch do veto multi-máquina (manage-task.mjs:40-47).
 * Transfere posse de `machine` para outro hostname e grava justificativa no Log de Execução.
 *
 * Uso: node tools/scripts/reassign-machine.mjs <TaskID> <NovaMaquina> <Agente> "<motivo>"
 * Ex.: node tools/scripts/reassign-machine.mjs T-505a DESKTOP-XYZ israel "Vivobook16 com HD morto"
 */

import { TaskService } from '../../apps/nexus-backend/dist/services/task.service.js';
import { TaskError } from '../../apps/nexus-backend/dist/services/task.types.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..', '..');

const [, , taskId, newMachine, agent, reason] = process.argv;

function usage() {
  console.error('Uso: node tools/scripts/reassign-machine.mjs <TaskID> <NovaMaquina> <Agente> "<motivo>"');
  console.error('Ex.: node tools/scripts/reassign-machine.mjs T-505a DESKTOP-XYZ israel "Vivobook16 com HD morto"');
}

if (!taskId || !newMachine || !agent || !reason || reason.trim() === '') {
  usage();
  process.exit(1);
}

const svc = new TaskService({ rootDir });

try {
  const result = svc.reassignMachine(taskId, newMachine, agent, reason);
  console.log(`✅ Machine de ${taskId} reatribuída: ${newMachine}`);
  console.log(`   Log registrado com agente: ${agent}`);
  process.exit(0);
} catch (err) {
  if (err instanceof TaskError) {
    console.error(`❌ ${err.message}`);
  } else {
    console.error(`❌ Erro inesperado: ${err.message}`);
  }
  process.exit(1);
}
