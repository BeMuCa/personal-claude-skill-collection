# Claude Discipline Layer

Global rules, skills, and hooks that make every Claude Code model/agent work with
verified evidence, right-sized code changes, and mechanical verification gates.
Full component descriptions: `docs/SETUP.md`. Design history: `docs/superpowers/`.
Measured effect (A/B benchmark, 3 models): `docs/superpowers/2026-07-10-discipline-layer-benchmark.md`.

## Install (global effect)

Copy into `~/.claude/` on the target machine:

| From this repo | To | Effect |
|---|---|---|
| `CLAUDE.md` | `~/.claude/CLAUDE.md` | Always-on operating rules, every session, every model. If one already exists, merge — don't overwrite. |
| `skills/*` | `~/.claude/skills/` | Ten skills (rigorous-reasoning, disciplined-implementation, grounded-claims, project-setup, spec-sync, quality-run, exploration-router, portable-module, db-schema-sync, bild-builder-trio), auto-discovered. |
| `hooks/*.js` | `~/.claude/hooks/` | verify-gate (verification reminder after code-changing turns), spec-guard (spec-update reminder; self-disabling outside spec-tree repos), and db-schema-guard (DB-SCHEMA.md-update reminder when a schema file changes; self-disabling in repos without a DB-SCHEMA.md). |
| `settings.snippet.json` | merge keys into `~/.claude/settings.json` | Registers all three hooks (Stop + SubagentStop) and disables Claude commit/PR attribution. Replace `NODE` with `which node` output — hook commands need an absolute interpreter path. |

## Verify the install

```bash
echo '{"stop_hook_active":true}' | node ~/.claude/hooks/verify-gate.js && echo hook-ok
claude --model haiku -p 'Quote the first sentence under "Operating Rules (Mandatory)" from your context.'
```

Then start a session, edit any file, end the turn: the verification reminder must
appear exactly once.

## External dependencies (optional — the core layer works without them)

The discipline layer above is self-contained. These external tools are *referenced*
by it and enhance it; install the ones you want. Commands below are the verified
non-interactive CLI (`claude plugin ...`) as reported by `claude plugin --help`.

| Tool | Why the layer references it | Install |
|---|---|---|
| **superpowers** (recommended) | CLAUDE.md's escalation table points to `superpowers:verification-before-completion` and `superpowers:systematic-debugging`; `quality-run` borrows its review patterns | `claude plugin marketplace add anthropics/claude-plugins-official` then `claude plugin install superpowers@claude-plugins-official` (installs to user scope by default) |
| **frontend-design** (optional) | UI design skill from the same marketplace | `claude plugin install frontend-design@claude-plugins-official` |
| **GSD / get-shit-done** (optional) | `quality-run` defers to `/gsd:code-review`, `/gsd:verify-work`, `/gsd:add-tests` in GSD-managed repos | Repo: `github.com/gsd-build/get-shit-done` — follow its own install instructions (no verified one-liner). |
| **gitnexus** (optional) | The context-frugality routing table suggests it for impact/dependency queries; degrades to `grep` if absent | Almost certainly `github.com/abhigyanpatwari/GitNexus` (matching name, MCP toolset, and LICENSE) — ⚠️ **PolyForm Noncommercial 1.0.0**: free for personal use only; check before commercial use. No install-source metadata on the reference machine, so confirm the repo before automating. |
| **repomix** (optional, zero-install) | exploration-router's architecture-orientation tier runs `npx repomix --compress` — npx downloads it on demand, nothing to preinstall (verified v1.16.0); falls back to an Explore agent if unavailable | none needed (or permanent: `npm install -g repomix`) |
| **Serena** (optional — large codebases) | LSP-grade symbol definitions/references (MIT). Benchmarked working headless; note its line numbers are 0-indexed | `uv tool install -p 3.13 serena-agent`, then per project: `claude mcp add serena -- serena start-mcp-server --context claude-code --project "$(pwd)"`; set `SERENA_USAGE_REPORTING=false` (phones home by default) |
| **semble** (optional) | Local semantic code search CLI (MIT, CPU-only, ~64MB one-time model download). Benchmark showed the layer's grep-first rules cover synthetic vocabulary-mismatch already — install only if grep dead-ends on a large real repo | `uv tool install semble`; query: `semble search "<meaning>" <dir> --top-k 5` |

If none are installed, the CLAUDE.md rows and routing entries that reference them are
harmless no-ops.

## Notes

- Non-fork subagents **do** receive the global CLAUDE.md; the built-in Explore and
  Plan agents are the exception (they skip it for speed). `AGENTS.md` is not loaded
  by Claude Code — import it from CLAUDE.md if needed. See docs/SETUP.md.
