# Claude Code Setup Inventory (Berk)

What this repo tracks, what it depends on, and how to port it to another machine.
Updated: 2026-07-08.

## Tracked by this repo (the model-discipline layer)

| Component | Path | Purpose |
|---|---|---|
| Global rules | `CLAUDE.md` | Always-on operating rules for every model/agent: Think Before Coding, Simplicity First, Surgical Changes, Goal-Driven Execution, Evidence, Scope, Multi-part prompts, Reporting + mandatory skill escalation table |
| Skill | `skills/rigorous-reasoning/` | 5-step protocol vs pattern-matched answers |
| Skill | `skills/disciplined-implementation/` | Read-first, convention-matching, right-sized code changes |
| Skill | `skills/grounded-claims/` | Anti-hallucination: verified / inferred / assumed |
| Skill | `skills/project-setup/` | Menu-driven project CLAUDE.md + conventions setup (any repo state) |
| Skill | `skills/spec-sync/` | Semantic spec-vs-code drift review for spec-tree repos |
| Hook | `hooks/verify-gate.js` | Stop/SubagentStop: one-shot verification reminder after code-changing turns; fail-open |
| Hook | `hooks/spec-guard.js` | Stop/SubagentStop: one-shot spec-update reminder; self-disabling in repos without `SPEC-TREE.md`; fail-open |
| Settings | `settings.json` | Hook registrations (Stop/SubagentStop ×2 each) + `attribution: {commit:"", pr:""}` (no Claude commit/PR attribution) + pre-existing GSD/gitnexus hooks |
| Design docs | `docs/superpowers/specs/`, `docs/superpowers/plans/` | Specs and implementation plans for the above |

Also tracked as baseline (managed by their own installers — do not hand-edit):
`agents/gsd-*.md`, `skills/gsd-*`, `skills/gitnexus-*`, `hooks/gsd-*`.

## External components NOT in this repo (install separately)

| Component | What | Install |
|---|---|---|
| superpowers plugin v6.1.1 | brainstorming, writing-plans, subagent-driven-development, TDD, systematic-debugging, verification-before-completion, etc. | Claude Code plugin marketplace (`claude-plugins-official`) |
| GSD (get-shit-done) | ~70 `gsd-*` skills, 33 agents, hooks, statusline | GSD installer; state in `gsd-install-state.json` |
| GitNexus | `gitnexus-*` skills, hook, MCP server (code knowledge graph) | GitNexus installer |
| Serena / semble / repomix | Optional exploration tools (LSP symbols / semantic search / repo outlines) — benchmarked 2026-07-10; see the repo README's external-dependency table for verified install commands and when to use each | `uv tool install -p 3.13 serena-agent` · `uv tool install semble` · `npm i -g repomix` |

## Porting to another machine

1. Clone this repo to `~/.claude` (or copy `CLAUDE.md`, `skills/`, `hooks/`, and merge `settings.json` keys `hooks.Stop`, `hooks.SubagentStop`, `attribution` into the existing file).
2. **Fix the node path**: hook commands reference `/home/berk/.nvm/versions/node/v24.15.0/bin/node`. Point them at that machine's node (`which node`).
3. Install the external components above if wanted — the discipline layer works without them, except the CLAUDE.md escalation table's two `superpowers:*` rows (harmless if absent).
4. Verify: `echo '{"stop_hook_active":true}' | <node> ~/.claude/hooks/verify-gate.js && echo ok`, then start a session, edit a file, and confirm the one-shot reminder fires.

## Known limitations (by design)

- Non-fork subagents (general-purpose, custom agents) DO receive the global CLAUDE.md, per Claude Code docs and verified by a clean re-test. The built-in Explore and Plan agents are the exception — they skip CLAUDE.md for speed. AGENTS.md is not loaded by Claude Code.
- verify-gate triggers on any Bash use, including read-only commands; benign one-shot.
- spec-guard cannot see file changes made via Bash commands (only Edit/Write/NotebookEdit).
