#!/usr/bin/env node
// spec-guard.js — Stop/SubagentStop hook. In repos using the spec-tree
// convention (SPEC-TREE.md at repo root), blocks the first stop attempt after
// a turn that edited code without touching the covering SPEC.md or the tree.
// Self-disabling: silent in repos without SPEC-TREE.md. One-shot: second stop
// attempt (stop_hook_active) always passes. Fail-open: any error exits 0.
// Coverage gap (accepted): file changes made via Bash commands are not seen.
'use strict';
const fs = require('fs');
const path = require('path');

const EDIT_TOOLS = new Set(['Edit', 'Write', 'NotebookEdit']);
const SPEC_NAMES = new Set(['SPEC.md', 'SPEC-TREE.md', 'PROJECT-SPEC.md']);
const MAX_WALK = 20;

function isRealUserMessage(msg) {
  const c = msg.content;
  if (typeof c === 'string') return true;
  return Array.isArray(c) && c.some((b) => b && b.type === 'text');
}

function changedFilesThisTurn(lines) {
  const files = [];
  for (let i = lines.length - 1; i >= 0; i--) {
    let entry;
    try { entry = JSON.parse(lines[i]); } catch { continue; }
    const msg = entry && entry.message;
    if (!msg) continue;
    if (entry.type === 'user') {
      if (isRealUserMessage(msg)) break; // start of current turn
      continue; // tool_result — still inside the current turn
    }
    if (entry.type === 'assistant' && Array.isArray(msg.content)) {
      for (const block of msg.content) {
        if (block && block.type === 'tool_use' && EDIT_TOOLS.has(block.name) && block.input) {
          const p = block.input.file_path || block.input.notebook_path;
          if (typeof p === 'string' && path.isAbsolute(p)) files.push(p);
        }
      }
    }
  }
  return files;
}

function findRepoRoot(file) {
  let dir = path.dirname(file);
  for (let i = 0; i < MAX_WALK; i++) {
    if (fs.existsSync(path.join(dir, '.git'))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
  return null;
}

function nearestSpec(file, root) {
  let dir = path.dirname(file);
  for (let i = 0; i < MAX_WALK; i++) {
    const spec = path.join(dir, 'SPEC.md');
    if (fs.existsSync(spec)) return spec;
    if (dir === root) return null;
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
  return null;
}

function main() {
  const data = JSON.parse(fs.readFileSync(0, 'utf8'));
  if (data.stop_hook_active) return;
  const tp = data.transcript_path;
  if (!tp || !fs.existsSync(tp)) return;
  const lines = fs.readFileSync(tp, 'utf8').split('\n').filter(Boolean);
  const changed = changedFilesThisTurn(lines);
  if (!changed.length) return;

  const touchedSpecs = new Set(changed.filter((f) => SPEC_NAMES.has(path.basename(f))));
  const stale = [];
  for (const file of changed) {
    if (SPEC_NAMES.has(path.basename(file))) continue;
    const root = findRepoRoot(file);
    if (!root) continue;
    const tree = path.join(root, 'SPEC-TREE.md');
    if (!fs.existsSync(tree)) continue; // smart toggle: repo doesn't use the convention
    if (touchedSpecs.has(tree)) continue; // tree updated this turn
    const spec = nearestSpec(file, root);
    if (spec && !touchedSpecs.has(spec)) stale.push({ file, spec });
  }
  if (stale.length) {
    const first = stale[0];
    const more = stale.length > 1 ? ` (and ${stale.length - 1} more file${stale.length > 2 ? 's' : ''})` : '';
    process.stdout.write(JSON.stringify({
      decision: 'block',
      reason: `${path.basename(first.file)}${more} changed but the covering spec ${first.spec} and SPEC-TREE.md were not updated. Update the spec and its tree entry now, or state why no update is needed.`,
    }));
  }
}

try { main(); } catch { /* fail open */ }
process.exitCode = 0;
