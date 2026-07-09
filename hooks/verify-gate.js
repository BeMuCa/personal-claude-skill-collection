#!/usr/bin/env node
// verify-gate.js — Stop/SubagentStop hook.
// After a turn that used state-changing tools, blocks the first stop attempt
// with a verification reminder. Second attempt (stop_hook_active) always passes.
// Fail-open: any error exits 0 with no output.
'use strict';
const fs = require('fs');

const STATE_CHANGING = new Set(['Edit', 'Write', 'NotebookEdit', 'Bash']);
const REMINDER =
  'Before ending: did you run/verify what you changed or claimed? ' +
  'If tests/commands were not run, run them now. Report any failure verbatim. ' +
  'Explicitly mark anything you could not verify.';

function isRealUserMessage(msg) {
  const c = msg.content;
  if (typeof c === 'string') return true;
  return Array.isArray(c) && c.some((b) => b && b.type === 'text');
}

function currentTurnChangedState(lines) {
  for (let i = lines.length - 1; i >= 0; i--) {
    let entry;
    try { entry = JSON.parse(lines[i]); } catch { continue; }
    const msg = entry && entry.message;
    if (!msg) continue;
    if (entry.type === 'user') {
      if (isRealUserMessage(msg)) return false; // start of current turn, nothing found
      continue; // tool_result — still inside the current turn
    }
    if (entry.type === 'assistant' && Array.isArray(msg.content)) {
      for (const block of msg.content) {
        if (block && block.type === 'tool_use' && STATE_CHANGING.has(block.name)) {
          return true;
        }
      }
    }
  }
  return false;
}

function main() {
  const data = JSON.parse(fs.readFileSync(0, 'utf8'));
  if (data.stop_hook_active) return;
  const tp = data.transcript_path;
  if (!tp || !fs.existsSync(tp)) return;
  const lines = fs.readFileSync(tp, 'utf8').split('\n').filter(Boolean);
  if (currentTurnChangedState(lines)) {
    process.stdout.write(JSON.stringify({ decision: 'block', reason: REMINDER }));
  }
}

try { main(); } catch { /* fail open */ }
process.exitCode = 0;
