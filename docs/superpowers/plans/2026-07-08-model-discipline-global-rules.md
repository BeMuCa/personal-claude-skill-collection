# Global Model-Discipline Rules Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship always-on discipline rules (`~/.claude/CLAUDE.md`), three global skills, and a deterministic Stop/SubagentStop verification hook so every agent on every model reasons and verifies like a top-tier model.

**Architecture:** Three enforcement layers: a ~50-line global CLAUDE.md injected into every context; three on-demand skills (`rigorous-reasoning`, `disciplined-implementation`, `grounded-claims`) pushed by a mandatory escalation table; and a fail-open Node hook (`verify-gate.js`) that blocks turn-end once after code-changing turns until verification is addressed. All config is versioned in the `~/.claude` git repo (already initialized; spec committed).

**Tech Stack:** Markdown (CLAUDE.md, SKILL.md), Node.js (hook, run via `/home/berk/.nvm/versions/node/v24.15.0/bin/node` — same interpreter as existing GSD hooks), bash test script, git.

**Spec:** `/home/berk/.claude/docs/superpowers/specs/2026-07-08-model-discipline-global-rules-design.md`

## Global Constraints

- All paths are under `/home/berk/.claude/` (global config, not a project repo).
- Do NOT modify anything GSD-managed: `agents/gsd-*.md`, `skills/gsd-*`, `hooks/gsd-*`, `hooks/gitnexus/`.
- The hook must be fail-open: any internal error → exit 0, no output. A broken hook must never trap an agent.
- CLAUDE.md must stay ≤ 60 lines. No model-tier language anywhere ("smaller model", "Haiku", etc.) — rules are universal.
- Skill frontmatter `description` must start with "Use when" and state the trigger.
- settings.json edits must preserve all existing GSD/gitnexus hook entries (PreToolUse, PostToolUse, SessionStart).
- Every commit message ends with: `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`
- Run all git commands as `git -C /home/berk/.claude ...` (working dir may differ).

---

### Task 1: Baseline commit of existing config

Commit the pre-existing GSD/gitnexus config that the whitelist `.gitignore` tracks, so later diffs show only our changes.

**Files:**
- Modify: none (git only)

**Interfaces:**
- Consumes: existing repo at `/home/berk/.claude` (`.gitignore` + spec already committed on `master`/`main`).
- Produces: a baseline commit; working tree clean for tracked paths.

- [ ] **Step 1: Verify repo state**

Run: `git -C /home/berk/.claude log --oneline && git -C /home/berk/.claude status --porcelain | head -20`
Expected: one commit ("Add design spec..."); status lists untracked `agents/`, `skills/`, `hooks/`, `settings.json`, `docs/superpowers/plans/`.

- [ ] **Step 2: Commit baseline**

```bash
git -C /home/berk/.claude add agents/ skills/ hooks/ settings.json docs/
git -C /home/berk/.claude commit -m "Baseline: existing GSD/gitnexus agents, skills, hooks, settings

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

- [ ] **Step 3: Verify clean tree**

Run: `git -C /home/berk/.claude status --porcelain`
Expected: empty output (hooks/gitnexus/ is gitignored; everything else tracked).

---

### Task 2: Global CLAUDE.md

**Files:**
- Create: `/home/berk/.claude/CLAUDE.md`

**Interfaces:**
- Consumes: nothing.
- Produces: escalation table referencing skill names `rigorous-reasoning`, `disciplined-implementation`, `grounded-claims` (created in Tasks 3–5 — names must match exactly).

- [ ] **Step 1: Write the file with exactly this content**

```markdown
# Operating Rules (Mandatory)

These rules are mandatory for every task, every model, and every agent — including subagents. They are not suggestions.

## Before acting
- Restate the task in one sentence, including its success criterion. If you cannot, you do not understand the task yet — investigate or ask.
- List the assumptions you are making. Verify every assumption about the codebase by reading the code before relying on it.
- For any non-trivial task, consider at least two approaches before committing to one.

## Evidence
- Never state that a file, function, API, flag, or behavior exists unless you read it or ran it in this session.
- If you are recalling something from memory rather than verifying it, either verify it or explicitly mark it as unverified.
- "I don't know" and "I couldn't verify this" are correct answers. A confident guess is a wrong answer.

## Code
- Read the surrounding code and its imports before editing.
- Match the file's existing patterns, naming, and error-handling style.
- Make the smallest change that fully solves the problem. No drive-by refactors. No speculative generality.

## Completion
- Never claim something works without running it.
- Report failures verbatim. Never smooth over, summarize away, or hide a failure.
- A task is done when it is verified done — not when the code is written.

## Scope
- Re-read the original request before declaring done. Confirm every stated constraint was honored and nothing unrequested was added.
- If you are blocked or the task is beyond you, say so explicitly. A plausible-looking wrong answer is worse than admitting a limit.

## Mandatory skill escalation

| Situation | You MUST invoke |
|---|---|
| Non-trivial problem, design decision, or ambiguous request | `rigorous-reasoning` |
| Writing or modifying code | `disciplined-implementation` |
| Stating facts about unfamiliar code, APIs, or libraries | `grounded-claims` |
| About to claim work is complete | `superpowers:verification-before-completion` |
| Debugging | `superpowers:systematic-debugging` |

If a skill in this table applies, invoke it before proceeding. Do not rationalize skipping it.
```

- [ ] **Step 2: Verify line budget and content**

Run: `wc -l /home/berk/.claude/CLAUDE.md && grep -c "MUST invoke" /home/berk/.claude/CLAUDE.md`
Expected: ≤ 60 lines; grep count 1.

- [ ] **Step 3: Commit**

```bash
git -C /home/berk/.claude add CLAUDE.md
git -C /home/berk/.claude commit -m "Add global operating rules (CLAUDE.md): evidence, code, completion, scope discipline + skill escalation table

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 3: `rigorous-reasoning` skill

**Files:**
- Create: `/home/berk/.claude/skills/rigorous-reasoning/SKILL.md`

**Interfaces:**
- Consumes: referenced by CLAUDE.md escalation table as `rigorous-reasoning`.
- Produces: skill invocable via Skill tool under that exact name.

- [ ] **Step 1: Write the file with exactly this content**

```markdown
---
name: rigorous-reasoning
description: Use when facing any non-trivial problem, design decision, or ambiguous request — replaces pattern-matched first answers with a five-step protocol of restating, verifying assumptions, comparing approaches, and stress-testing before acting
---

# Rigorous Reasoning

## Overview

A first answer is a pattern match, not analysis. This protocol forces the analysis. Run all five steps, in order, before acting. Skipping a step because the task "seems simple" is the exact failure this skill exists to prevent.

## The Protocol

**Step 1 — Restate.** Write the problem and its success criterion in your own words, one sentence each. If you cannot, you do not understand the problem — investigate or ask before continuing.

**Step 2 — Surface assumptions.** List what you are assuming (about the code, the environment, the user's intent). For every assumption about the codebase, verify it by reading the actual code before relying on it. An unverified assumption is a guess wearing a suit.

**Step 3 — Compare approaches.** Generate at least two genuinely different approaches — not one approach and a strawman. State in one sentence why the losing approach loses. If you cannot articulate why, you have not compared them.

**Step 4 — Steelman the failure.** Ask: "If this turns out to be wrong, what will have caused it?" Name the most likely failure mode of your chosen approach and check it now, while it is cheap.

**Step 5 — Trace second-order effects.** Who calls this? What depends on it? What breaks downstream if you change it? Search for callers/dependents before editing shared code.

## Red flags — you are rationalizing

| Thought | Reality |
|---|---|
| "The first idea feels right" | First ideas are pattern matches. Run Step 3. |
| "This is obviously simple" | Simple-looking tasks hide the most assumptions. Run Step 2. |
| "I'll verify after implementing" | Post-hoc verification confirms bias. Verify before. |
| "There's really only one way to do this" | There is almost never only one way. Find the second. |
| "Checking callers is overkill" | Downstream breakage is the most common regression. Run Step 5. |

## Example

Bad: "The test fails because of a timeout — I'll increase the timeout." (pattern match)
Good: "Restate: test X fails intermittently; success = reliably green. Assumption: it's timing-related — verified by reading the test: it awaits a fixed 100ms sleep before asserting. Approaches: (a) raise sleep, (b) await the actual condition. (a) loses: it shrinks the race, doesn't remove it. Failure mode of (b): condition callback may never fire — check that the event is always emitted. Callers: 3 other tests use this helper — update all."
```

- [ ] **Step 2: Verify frontmatter**

Run: `head -4 /home/berk/.claude/skills/rigorous-reasoning/SKILL.md`
Expected: `---`, `name: rigorous-reasoning`, `description: Use when facing any non-trivial problem...`, `---`.

- [ ] **Step 3: Commit**

```bash
git -C /home/berk/.claude add skills/rigorous-reasoning/
git -C /home/berk/.claude commit -m "Add rigorous-reasoning skill: five-step protocol against pattern-matched answers

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 4: `disciplined-implementation` skill

**Files:**
- Create: `/home/berk/.claude/skills/disciplined-implementation/SKILL.md`

**Interfaces:**
- Consumes: referenced by CLAUDE.md escalation table as `disciplined-implementation`.
- Produces: skill invocable under that exact name.

- [ ] **Step 1: Write the file with exactly this content**

```markdown
---
name: disciplined-implementation
description: Use when writing or modifying any code — enforces reading before writing, matching existing conventions, right-sizing the change, and reviewing your own diff before declaring it done
---

# Disciplined Implementation

## Overview

Sloppy code is rarely a typing problem; it is a not-looking problem. This protocol makes you look — at the existing code before writing, and at your own diff after.

## Before writing

1. **Read the file you are about to change, and its neighbors.** Look at its imports, its error-handling style, its naming. You are a guest in this codebase.
2. **Find the existing convention for what you are about to do.** Adding a route? Read two existing routes. Adding a test? Read two existing tests. Copy the house style, not your habits.
3. **Right-size the plan.** The correct change is the smallest one that fully solves the stated problem. Both failure directions are defects: under-engineering (ignores edge cases the problem statement implies) and over-engineering (abstractions, options, and generality nobody asked for).

## While writing

- Handle errors where the operation can actually fail — I/O, parsing, external calls — in the style the codebase already uses. Do not add blanket try/catch wallpaper.
- No speculative generality: no parameters, hooks, or abstractions for hypothetical future needs (YAGNI).
- No drive-by refactors. If you see unrelated code worth improving, note it in your summary instead of touching it.
- Comments only for constraints the code cannot express. Never narrate what the next line does.

## After writing — the self-review gate

Re-read your full diff as if reviewing a stranger's PR:

- Does every changed line earn its place? Delete any that don't.
- Does the change fully solve the stated problem, including the implied edge cases?
- Did you break a caller? (You checked callers before editing shared code — confirm the contract still holds.)
- Would the file's original author recognize this as their style?

## Red flags — you are rationalizing

| Thought | Reality |
|---|---|
| "I know how this framework works" | This codebase may use it differently. Read the neighbors. |
| "I'll clean this other thing up while I'm here" | Scope creep. Note it, don't touch it. |
| "A wrapper/abstraction would make this cleaner" | If only one caller exists, it's speculation. Inline it. |
| "Error handling can come later" | Later never comes. Handle it where it can fail, now. |
| "My diff is fine, I just wrote it" | That is exactly why you can't see its flaws. Re-read it cold. |
```

- [ ] **Step 2: Verify frontmatter**

Run: `head -4 /home/berk/.claude/skills/disciplined-implementation/SKILL.md`
Expected: `---`, `name: disciplined-implementation`, `description: Use when writing or modifying any code...`, `---`.

- [ ] **Step 3: Commit**

```bash
git -C /home/berk/.claude add skills/disciplined-implementation/
git -C /home/berk/.claude commit -m "Add disciplined-implementation skill: read-first, convention-matching, right-sized changes

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 5: `grounded-claims` skill

**Files:**
- Create: `/home/berk/.claude/skills/grounded-claims/SKILL.md`

**Interfaces:**
- Consumes: referenced by CLAUDE.md escalation table as `grounded-claims`.
- Produces: skill invocable under that exact name.

- [ ] **Step 1: Write the file with exactly this content**

```markdown
---
name: grounded-claims
description: Use when stating facts about code, APIs, libraries, or system behavior, or when writing code against an unfamiliar API — an anti-hallucination protocol that forces every claim to be verified, traced, or explicitly flagged as assumed
---

# Grounded Claims

## Overview

A hallucination is a claim with no source. This protocol attaches a source to every claim — or an explicit flag that there isn't one. A fluent guess is a defect; "I don't know" is a valid, professional answer.

## Classify every factual claim

Before asserting anything about code, APIs, or system behavior, it must fit one of three classes:

- **Verified** — you read it or ran it *in this session*. Cite where (`file:line`, command output).
- **Inferred** — it follows from something verified. Say what it follows from.
- **Assumed** — neither. You MUST say so explicitly: "I'm assuming X — not verified."

If a claim fits none of these, do not make it.

## Hard rules

1. **APIs must be proven to exist before you use them.** Function signatures, methods, config flags, CLI options: check the installed version — read `node_modules`/site-packages, run `--help`, read the type stubs — not your memory. Training memory is stale and blends versions.
2. **Never invent identifiers.** File paths, function names, env vars, error messages — if you didn't see it, don't write it as if you did.
3. **Version-check library claims.** "Library X supports Y" is meaningless without "in the version installed here." Check the lockfile/manifest first.
4. **Quote, don't paraphrase, error messages and outputs.** Paraphrased errors smuggle in interpretation as fact.
5. **Uncertainty is stated, not smoothed.** If sources conflict or you couldn't check, the answer includes that — prominently, not in a footnote.

## Red flags — you are about to hallucinate

| Thought | Reality |
|---|---|
| "I'm pretty sure this API takes these arguments" | "Pretty sure" = unverified. Check the installed version. |
| "This is how this library usually works" | Usually ≠ here. Check the version in the lockfile. |
| "The file is probably at src/utils/..." | Probably = invented path. Glob for it. |
| "I remember this from training" | Training memory is stale and unversioned. Verify or flag. |
| "Saying 'I don't know' looks weak" | A confident wrong answer costs hours. "I don't know" costs seconds. |
```

- [ ] **Step 2: Verify frontmatter**

Run: `head -4 /home/berk/.claude/skills/grounded-claims/SKILL.md`
Expected: `---`, `name: grounded-claims`, `description: Use when stating facts about code...`, `---`.

- [ ] **Step 3: Commit**

```bash
git -C /home/berk/.claude add skills/grounded-claims/
git -C /home/berk/.claude commit -m "Add grounded-claims skill: verified/inferred/assumed classification against hallucination

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 6: `verify-gate.js` hook (test-first)

**Files:**
- Test: `/tmp/claude-1000/-home-berk-git/259477d2-2a6e-4c69-8144-bab619c9ea42/scratchpad/test-verify-gate.sh`
- Create: `/home/berk/.claude/hooks/verify-gate.js`

**Interfaces:**
- Consumes: Stop/SubagentStop hook stdin JSON: `{stop_hook_active: boolean, transcript_path: string, ...}`. Transcript is JSONL; assistant lines carry `message.content[]` blocks with `{type:"tool_use", name:"Edit"|...}`; real user messages have string content or a `text` block; tool results are user-type lines whose content blocks are `tool_result`.
- Produces: on block — stdout `{"decision":"block","reason":"..."}` and exit 0; on allow — no output, exit 0. Registered by Task 7 at path `/home/berk/.claude/hooks/verify-gate.js`.

- [ ] **Step 1: Write the failing test script**

Write to `/tmp/claude-1000/-home-berk-git/259477d2-2a6e-4c69-8144-bab619c9ea42/scratchpad/test-verify-gate.sh`:

```bash
#!/bin/bash
# Tests for verify-gate.js Stop/SubagentStop hook
HOOK=/home/berk/.claude/hooks/verify-gate.js
NODE=/home/berk/.nvm/versions/node/v24.15.0/bin/node
FIX=$(mktemp -d)
pass=0; fail=0
check() { # name expected actual
  if [ "$2" = "$3" ]; then echo "PASS: $1"; pass=$((pass+1));
  else echo "FAIL: $1 (expected [$2] got [$3])"; fail=$((fail+1)); fi
}

# Fixture A: current turn contains an Edit tool use -> must block
cat > "$FIX/edit.jsonl" <<'EOF'
{"type":"user","message":{"role":"user","content":"please fix the bug"}}
{"type":"assistant","message":{"role":"assistant","content":[{"type":"tool_use","name":"Edit","input":{}}]}}
{"type":"user","message":{"role":"user","content":[{"type":"tool_result","content":"ok"}]}}
{"type":"assistant","message":{"role":"assistant","content":[{"type":"text","text":"done"}]}}
EOF
out=$(echo "{\"stop_hook_active\":false,\"transcript_path\":\"$FIX/edit.jsonl\"}" | "$NODE" "$HOOK")
echo "$out" | grep -q '"decision":"block"' && r=block || r=allow
check "code-changing turn blocks" block "$r"

# Fixture B: read-only turn -> must allow silently
cat > "$FIX/read.jsonl" <<'EOF'
{"type":"user","message":{"role":"user","content":"what does this do?"}}
{"type":"assistant","message":{"role":"assistant","content":[{"type":"tool_use","name":"Read","input":{}}]}}
{"type":"user","message":{"role":"user","content":[{"type":"tool_result","content":"file contents"}]}}
{"type":"assistant","message":{"role":"assistant","content":[{"type":"text","text":"it parses config"}]}}
EOF
out=$(echo "{\"stop_hook_active\":false,\"transcript_path\":\"$FIX/read.jsonl\"}" | "$NODE" "$HOOK")
[ -z "$out" ] && r=allow || r=block
check "read-only turn allows" allow "$r"

# Case C: stop_hook_active=true -> always allow (no loops)
out=$(echo "{\"stop_hook_active\":true,\"transcript_path\":\"$FIX/edit.jsonl\"}" | "$NODE" "$HOOK")
[ -z "$out" ] && r=allow || r=block
check "second stop passes through" allow "$r"

# Case D: garbage stdin -> fail open (exit 0, no output)
out=$(echo "not json" | "$NODE" "$HOOK"); ec=$?
{ [ "$ec" -eq 0 ] && [ -z "$out" ]; } && r=allow || r=block
check "garbage input fails open" allow "$r"

# Case E: missing transcript -> fail open
out=$(echo '{"stop_hook_active":false,"transcript_path":"/nonexistent/x.jsonl"}' | "$NODE" "$HOOK")
[ -z "$out" ] && r=allow || r=block
check "missing transcript fails open" allow "$r"

# Fixture F: Edit happened in a PREVIOUS turn; current turn read-only -> allow
cat > "$FIX/prev.jsonl" <<'EOF'
{"type":"user","message":{"role":"user","content":"fix the bug"}}
{"type":"assistant","message":{"role":"assistant","content":[{"type":"tool_use","name":"Edit","input":{}}]}}
{"type":"user","message":{"role":"user","content":"thanks, what does foo do?"}}
{"type":"assistant","message":{"role":"assistant","content":[{"type":"text","text":"foo parses config"}]}}
EOF
out=$(echo "{\"stop_hook_active\":false,\"transcript_path\":\"$FIX/prev.jsonl\"}" | "$NODE" "$HOOK")
[ -z "$out" ] && r=allow || r=block
check "previous-turn edit does not trigger" allow "$r"

echo
echo "$pass passed, $fail failed"
rm -rf "$FIX"
[ "$fail" -eq 0 ]
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `bash /tmp/claude-1000/-home-berk-git/259477d2-2a6e-4c69-8144-bab619c9ea42/scratchpad/test-verify-gate.sh`
Expected: FAIL on "code-changing turn blocks" (hook file does not exist yet → node errors → allow), other cases may vacuously pass. Exit code 1.

- [ ] **Step 3: Write the hook**

Write to `/home/berk/.claude/hooks/verify-gate.js`:

```javascript
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
process.exit(0);
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `bash /tmp/claude-1000/-home-berk-git/259477d2-2a6e-4c69-8144-bab619c9ea42/scratchpad/test-verify-gate.sh`
Expected: `6 passed, 0 failed`, exit code 0.

- [ ] **Step 5: Commit**

```bash
git -C /home/berk/.claude add hooks/verify-gate.js
git -C /home/berk/.claude commit -m "Add verify-gate hook: one-shot verification reminder on stop after code-changing turns

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 7: Register hook in settings.json

**Files:**
- Modify: `/home/berk/.claude/settings.json` (add top-level `hooks.Stop` and `hooks.SubagentStop` keys; existing keys are PreToolUse, PostToolUse, SessionStart)

**Interfaces:**
- Consumes: `/home/berk/.claude/hooks/verify-gate.js` from Task 6.
- Produces: hook active in all future sessions and subagents.

- [ ] **Step 1: Add registrations with a script (safer than hand-editing large JSON)**

```bash
python3 - <<'EOF'
import json
p = '/home/berk/.claude/settings.json'
with open(p) as f:
    d = json.load(f)
entry = [{
    "hooks": [{
        "type": "command",
        "command": '"/home/berk/.nvm/versions/node/v24.15.0/bin/node" "/home/berk/.claude/hooks/verify-gate.js"',
        "timeout": 5
    }]
}]
hooks = d.setdefault('hooks', {})
assert 'Stop' not in hooks and 'SubagentStop' not in hooks, "Stop hooks already exist — inspect before overwriting"
hooks['Stop'] = entry
hooks['SubagentStop'] = json.loads(json.dumps(entry))
with open(p, 'w') as f:
    json.dump(d, f, indent=2)
    f.write('\n')
print("registered")
EOF
```

Expected output: `registered`

- [ ] **Step 2: Verify JSON validity and that existing hooks survived**

Run: `python3 -c "import json; d=json.load(open('/home/berk/.claude/settings.json')); h=d['hooks']; print(sorted(h.keys())); print(len(h['PreToolUse']))"`
Expected: `['PostToolUse', 'PreToolUse', 'SessionStart', 'Stop', 'SubagentStop']` and PreToolUse count unchanged (5).

- [ ] **Step 3: Commit**

```bash
git -C /home/berk/.claude add settings.json
git -C /home/berk/.claude commit -m "Register verify-gate hook for Stop and SubagentStop

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 8: End-to-end verification

**Files:**
- Modify: none (verification only)

**Interfaces:**
- Consumes: all prior tasks.
- Produces: confirmation checklist; any failure loops back to the owning task.

- [ ] **Step 1: Static sanity sweep**

```bash
wc -l /home/berk/.claude/CLAUDE.md
for s in rigorous-reasoning disciplined-implementation grounded-claims; do
  head -2 /home/berk/.claude/skills/$s/SKILL.md | tail -1
done
echo '{"stop_hook_active":true}' | /home/berk/.nvm/versions/node/v24.15.0/bin/node /home/berk/.claude/hooks/verify-gate.js && echo "hook ok"
git -C /home/berk/.claude status --porcelain
```

Expected: ≤ 60 lines; three `name:` lines matching the escalation table exactly; `hook ok`; empty git status.

- [ ] **Step 2: Live checks (fresh session — requires Berk or a spawned subagent)**

These cannot be fully verified from inside the current session; run them in a NEW session and record results:

1. Start a new session (any model): the three new skills appear in the available-skills list, and CLAUDE.md rules are in context (ask "what operating rules were you given?").
2. In that session, make a trivial file edit and end the turn: the verify-gate reminder appears exactly once, and the session can end on the second attempt.
3. Ask a read-only question and end the turn: no reminder.
4. Spawn any subagent that edits a file: SubagentStop fires (subagent does a verification pass before returning).

- [ ] **Step 3: Record verification results**

Append a `## Verification results (2026-07-08)` section to the spec noting what passed, then:

```bash
git -C /home/berk/.claude add docs/superpowers/specs/2026-07-08-model-discipline-global-rules-design.md
git -C /home/berk/.claude commit -m "Record end-to-end verification results for model-discipline rollout

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```
