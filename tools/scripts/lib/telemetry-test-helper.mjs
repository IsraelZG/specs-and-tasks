// Helper for telemetry.test.mjs — allows running emit() from a subprocess
// to test the ACTUAL lib/telemetry.mjs (catches path bugs like BLOCKER-1).
import { emit } from './telemetry.mjs';

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('usage: node telemetry-test-helper.mjs <events-json>');
  process.exit(1);
}
const events = JSON.parse(args[0]);
for (const e of events) {
  emit(e);
}
