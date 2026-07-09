# Global Model-Discipline Rules & Skills — Design

**Date:** 2026-07-08
**Status:** Approved by Berk (brainstorming session, 2026-07-08)

## Goal

Make every agent that runs in this Claude Code installation — main sessions on any
model (Fable, Opus, Sonnet, Haiku) and all subagents (including the 33 GSD agents) —
apply the disciplined reasoning habits of a top-tier model.

**Honest framing:** prompting cannot add raw capability; Haiku will not become Fable.
What transfers is *discipline*: verifying assumptions before acting, reasoning from
evidence instead of pattern-matching, self-checking before declaring done, and
admitting ignorance instead of hallucinating. The goal is to close the judgment gap,
not the capability gap.

## Failure modes being targeted

1. **Shallow reasoning** — first plausible answer, pattern-matching, missed edge cases.
2. **Sloppy code** — ignores existing patterns, poor error handling, wrong-sized solutions.
3. **False confidence** — claims "done"/"works" without running anything; hides failures.
4. **Poor instruction-following** — scope drift, ignored constraints, stopping halfway.
5. **Hallucination** — invented APIs, flags, file paths, and confidently wrong facts.

## Architecture (Approach A: lean core + focused skills + deterministic hook)

Three layers, from always-on to on-demand to mechanical:

| Layer | Mechanism | Cost | Reliability on small models |
|---|---|---|---|
| Always-on rules | `~/.claude/CLAUDE.md` (~50 lines) | Every context window | High — always present |
| Depth on demand | 3 skills in `~/.claude/skills/` | Only when invoked | Medium — pushed by MUST table in CLAUDE.md |
| Mechanical gate | Stop/SubagentStop hook | Per code-changing turn | Deterministic — cannot be forgotten |

Explicitly rejected: patching GSD agent files (GSD updates would wipe the edits) and
a single mega-skill (monolithic prose degrades on small models; focused checklists work).

## Deliverable 1: `~/.claude/CLAUDE.md` (new file, ~50 lines)

Framing: "Mandatory operating rules for every task, every model, every agent,
including subagents." No mention of model tiers — the rules are universal and models
told they are "the cheap one" perform worse.

Five rule blocks, written as short checkable imperatives:

- **Before acting** (anti-shallow-reasoning): restate the task in one sentence with its
  success criterion; list assumptions; verify codebase assumptions by reading before
  relying on them; consider ≥2 approaches for non-trivial tasks.
- **Evidence discipline** (anti-hallucination): never assert a file/function/API/flag/
  behavior exists unless read or run this session; mark uncertain recall as uncertain
  or verify it; "I don't know" / "I couldn't verify" are correct answers, a confident
  guess is a wrong answer.
- **Code discipline** (anti-sloppy-code): read surrounding code and imports before
  editing; match existing patterns, naming, and error-handling style; smallest change
  that fully solves the problem; no drive-by refactors or speculative generality.
- **Completion discipline** (anti-false-confidence): never claim something works
  without running it; report failures verbatim; done = verified done. These rules are
  self-sufficient — they do NOT depend on any skill being invoked.
- **Scope discipline** (anti-drift): re-read the original request before declaring
  done; confirm every stated constraint honored, nothing unrequested added; if blocked
  or out of depth, say so instead of producing a plausible wrong answer.

Plus a **skill escalation table** (rule-shaped, "you MUST invoke"):

| Situation | Skill |
|---|---|
| Non-trivial problem, design decision, ambiguous request | `rigorous-reasoning` |
| Writing or modifying code | `disciplined-implementation` |
| Stating facts about unfamiliar code/APIs/libraries | `grounded-claims` |
| About to claim work is complete | `superpowers:verification-before-completion` |
| Debugging | `superpowers:systematic-debugging` |

## Deliverable 2: three global skills

Location: `~/.claude/skills/<name>/SKILL.md`. Style: short mandatory checklists,
concrete good/bad examples, red-flag rationalization tables (the superpowers pattern
that demonstrably lands on small models). Each frontmatter `description` states one
clear trigger, since that is what the model sees when deciding to invoke.

### `rigorous-reasoning`
Trigger: any non-trivial problem, design decision, debugging, or ambiguous request.
Five-step protocol:
1. Restate the problem and success criterion in your own words — if you can't, you
   don't understand it yet.
2. List assumptions; verify each code-related assumption by reading before proceeding.
3. Generate ≥2 genuinely different approaches; state why the rejected one loses.
4. Ask "what would make this wrong?" — steelman the failure case before acting.
5. Trace second-order effects: callers, dependents, what breaks downstream.
Red-flags table: "the first idea feels right" → first ideas are pattern-matches;
"this is obviously simple" → simple-looking tasks hide the most assumptions; etc.

### `disciplined-implementation`
Trigger: writing or modifying any code.
Protocol: read the file and its neighbors before editing; identify and follow the
codebase's existing convention for what you're about to do; smallest complete change;
handle errors where the operation can actually fail; no speculative abstraction
(YAGNI); after editing, re-read your own diff as a stranger's PR. Includes a
right-sizing test: does every line earn its place, and does the change fully solve
the stated problem?

### `grounded-claims`
Trigger: stating facts about code, APIs, libraries, or system behavior; writing code
against unfamiliar APIs.
Protocol: classify every claim as **verified** (read/ran this session), **inferred**
(follows from something verified — say from what), or **assumed** (say so explicitly).
APIs, signatures, config flags, CLI options must be verified to exist — against the
installed version, not memory — before use. Never invent file paths, function names,
or error messages. "I don't know" is a first-class answer; a fluent guess is a defect.

Not building: a debugging skill (`superpowers:systematic-debugging` covers it) or a
verification skill (superpowers + always-on rules + the hook cover it).

## Deliverable 3: Stop/SubagentStop hook — `~/.claude/hooks/verify-gate.js`

Model-agnostic (name deliberately neutral). Node script matching the existing GSD
hook style. Registered in `~/.claude/settings.json` under **both** `Stop` and
`SubagentStop`.

Behavior:
1. **Noise control:** scan the current turn's transcript for state-changing tool use
   (`Edit`, `Write`, `NotebookEdit`, `Bash`). Turns with none of these end silently.
   Note: any Bash use counts — including read-only commands like `git status` — so
   most tool-using turns trigger the reminder once; this is an accepted tradeoff
   (command-content inspection was rejected as fragile). The scan may also
   over-trigger when harness-injected messages blur the turn boundary; the failure
   direction is always a benign one-shot reminder, never a trap or loop.
2. **One reminder per turn:** on the first stop attempt after a code-changing turn
   (input `stop_hook_active` is false), block with: *"Before ending: did you
   run/verify what you changed or claimed? If tests/commands weren't run, run them
   now. Report any failure verbatim. Explicitly mark anything you could not verify."*
   When `stop_hook_active` is true, exit 0 unconditionally — no loops.
3. **Fail-open:** any internal error (unreadable transcript, unexpected format)
   exits 0. A broken hook must never trap an agent.

Registration entries added to the existing `hooks` object in settings.json without
disturbing the GSD/gitnexus PreToolUse, PostToolUse, and SessionStart entries.

## Deliverable 4: version `~/.claude` config in git

Initialize a git repo in `~/.claude` with a whitelist-style `.gitignore`: ignore
everything by default, track only `CLAUDE.md`, `docs/`, `skills/`, `hooks/`,
`agents/`, `settings.json`. Runtime/noise dirs (projects, sessions, cache, telemetry,
shell-snapshots, history.jsonl, etc.) stay untracked. Commit this spec and each
deliverable as it lands.

## Verification plan

- CLAUDE.md: start a fresh session on Haiku or Sonnet, confirm the rules appear in
  context and observably shape behavior on a small task (e.g. it restates the task
  and verifies an assumption before editing).
- Skills: invoke each with the Skill tool; confirm frontmatter parses and the skill
  appears in the available-skills list of a fresh session.
- Hook: run a session that edits a file and one that only answers a question; confirm
  the reminder fires exactly once for the former and not at all for the latter, and
  that a malformed transcript does not block stopping. Verify a GSD subagent also
  triggers SubagentStop.

## Out of scope

- Editing GSD agent definitions or GSD skills.
- Model-conditional rules (rules apply identically on every model).
- Any claim of matching Fable's raw capability — this ships discipline, not IQ.

## Verification results (2026-07-08)

Static: CLAUDE.md 39 lines (≤60); skill frontmatter names match the escalation
table exactly; hook fail-open path exits 0; working tree clean.

Live:
- Fresh main session on Haiku loads CLAUDE.md and quotes it verbatim
  (headless `claude -p` check) — always-on rules reach the weakest tier.
- All three skills registered and visible in main-session and subagent
  available-skills lists (quoted verbatim by a subagent probe).
- Stop hook: fired exactly once on the controller session after a
  code-changing turn; the following stop passed through (no loop). Fixture
  suite 6/6 (block, read-only allow, stop_hook_active pass, garbage
  fail-open, missing-transcript fail-open, previous-turn no-trigger).
- SubagentStop hook: fired on a Haiku subagent probe after a Write; the
  probe complied by re-reading the file to verify before finishing —
  the intended behavior, observed end-to-end.

Known limitation (confirmed by two independent probes, Haiku and Sonnet):
Agent-tool subagents do NOT receive the global CLAUDE.md text in context.
Subagent coverage therefore rests on the skills (visible to them) and the
SubagentStop gate (active). If per-agent rules are wanted later, they must
go into each agent definition's own prompt — rejected for GSD agents since
GSD updates overwrite those files.

Deviation from plan: the Task 6 hook code was amended post-review
(`process.exit(0)` → `process.exitCode = 0`) to guarantee the block
decision flushes to stdout before exit; 6/6 tests re-passed and the
no-hang property was verified on the block path with `timeout 5`.
