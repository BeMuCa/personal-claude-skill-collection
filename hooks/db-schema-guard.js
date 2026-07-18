#!/usr/bin/env node
// db-schema-guard.js — Stop/SubagentStop hook. In repos using the db-schema
// convention (a DB-SCHEMA.md somewhere in the repo), blocks the first stop
// attempt after a turn that edited a schema-defining file without updating
// DB-SCHEMA.md. Self-disabling: silent in repos without a DB-SCHEMA.md.
// One-shot: second stop attempt (stop_hook_active) always passes. Fail-open:
// any error exits 0. Coverage gap (accepted): schema changes made via Bash
// (e.g. `alembic revision --autogenerate`, `prisma migrate`) are not seen.
'use strict';
const fs = require('fs');
const path = require('path');

const EDIT_TOOLS = new Set(['Edit', 'Write', 'NotebookEdit']);
const DOC_NAME = 'DB-SCHEMA.md';
const MAX_WALK = 20;
const MAX_DEPTH = 6;
const SKIP_DIRS = new Set([
  'node_modules', '.git', 'dist', 'build', '.venv', 'venv', '__pycache__',
  '.next', 'target', 'vendor', 'coverage', '.tox',
]);

// Schema-defining file patterns, tested against the posix-normalized path.
// Edit this array to tune what counts as "touching the DB" in your repos.
const SCHEMA_PATTERNS = [
  /\.sql$/i,                 // raw SQL / migrations
  /\/migrations\//,          // migration dirs (Alembic, Django, node-pg-migrate, ...)
  /\/versions\/[^/]*\.py$/,  // Alembic revision files
  /\.prisma$/i,              // Prisma schema
  /(^|\/)models\.py$/,       // Django / SQLAlchemy models.py
  /\/models\/[^/]*\.py$/,    // models package
  /\.entity\.ts$/i,          // TypeORM entities
  /(^|\/)schema\.ts$/,       // Drizzle schema
  /(^|\/)models\.ts$/,       // Sequelize / generic TS models
];

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

function isSchemaFile(file) {
  const posix = file.split(path.sep).join('/');
  return SCHEMA_PATTERNS.some((re) => re.test(posix));
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

// Bounded breadth-first search for the one DB-SCHEMA.md under root.
function findSchemaDoc(root) {
  let level = [{ dir: root, depth: 0 }];
  while (level.length) {
    const next = [];
    for (const { dir, depth } of level) {
      let entries;
      try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { continue; }
      for (const e of entries) {
        if (e.isFile() && e.name === DOC_NAME) return path.join(dir, e.name);
      }
      if (depth < MAX_DEPTH) {
        for (const e of entries) {
          if (e.isDirectory() && !SKIP_DIRS.has(e.name)) {
            next.push({ dir: path.join(dir, e.name), depth: depth + 1 });
          }
        }
      }
    }
    level = next;
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

  const schemaChanges = changed.filter(isSchemaFile);
  if (!schemaChanges.length) return;

  const touchedDoc = changed.some((f) => path.basename(f) === DOC_NAME);
  if (touchedDoc) return; // doc updated this turn

  const root = findRepoRoot(schemaChanges[0]);
  if (!root) return;
  const doc = findSchemaDoc(root);
  if (!doc) return; // smart toggle: repo doesn't use the convention

  const first = path.basename(schemaChanges[0]);
  const more = schemaChanges.length > 1
    ? ` (and ${schemaChanges.length - 1} more schema file${schemaChanges.length > 2 ? 's' : ''})`
    : '';
  process.stdout.write(JSON.stringify({
    decision: 'block',
    reason: `${first}${more} changed but ${doc} was not updated. Regenerate it (Mermaid erDiagram + per-column purposes + relations) to reflect the schema change, or state why no update is needed. Use the db-schema-sync skill for a full regen.`,
  }));
}

try { main(); } catch { /* fail open */ }
process.exitCode = 0;
