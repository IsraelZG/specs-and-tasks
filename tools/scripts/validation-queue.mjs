#!/usr/bin/env node
import path from 'node:path';
import { runQueuedCommand, validationQueueStatus } from './lib/validation-queue.mjs';

function valueAfter(args, flag, fallback) {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : fallback;
}

const args = process.argv.slice(2);
const action = args[0];
const separator = args.indexOf('--');
const repoDir = path.resolve(valueAfter(args, '--repo', process.cwd()));
const queueRootValue = valueAfter(args, '--queue-root', '');
const queueRoot = queueRootValue ? path.resolve(queueRootValue) : undefined;

if (action === 'status') {
  console.log(JSON.stringify(validationQueueStatus({ repoDir, queueRoot }), null, 2));
  process.exit(0);
}

if (action !== 'run' || separator < 0 || !args[separator + 1]) {
  console.error('Uso: validation-queue.mjs run [--repo DIR] [--cwd DIR] [--label TEXTO] -- <comando> [args...]');
  console.error('     validation-queue.mjs status [--repo DIR]');
  process.exit(1);
}

const cwd = path.resolve(valueAfter(args, '--cwd', process.cwd()));
const label = valueAfter(args, '--label', 'validação');
const command = args[separator + 1];
const commandArgs = args.slice(separator + 2);
process.exit(runQueuedCommand({ repoDir, queueRoot, cwd, label, command, args: commandArgs }));
