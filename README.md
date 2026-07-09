# Claude Discipline Layer

Global rules, skills, and hooks that make every Claude Code model/agent work with
verified evidence, right-sized code changes, and mechanical verification gates.
Full component descriptions: `docs/SETUP.md`. Design history: `docs/superpowers/`.

## Install (global effect)

Copy into `~/.claude/` on the target machine:

| From this repo | To | Effect |
|---|---|---|
| `CLAUDE.md` | `~/.claude/CLAUDE.md` | Always-on operating rules, every session, every model. If one already exists, merge — don't overwrite. |
| `skills/*` | `~/.claude/skills/` | Seven skills (rigorous-reasoning, disciplined-implementation, grounded-claims, project-setup, spec-sync, quality-run, exploration-router), auto-discovered. |
| `hooks/*.js` | `~/.claude/hooks/` | verify-gate (verification reminder after code-changing turns) and spec-guard (spec-update reminder; self-disabling outside spec-tree repos). |
| `settings.snippet.json` | merge keys into `~/.claude/settings.json` | Registers both hooks (Stop + SubagentStop) and disables Claude commit/PR attribution. Replace `NODE` with `which node` output — hook commands need an absolute interpreter path. |

## Verify the install

```bash
echo '{"stop_hook_active":true}' | node ~/.claude/hooks/verify-gate.js && echo hook-ok
claude --model haiku -p 'Quote the first sentence under "Operating Rules (Mandatory)" from your context.'
```

Then start a session, edit any file, end the turn: the verification reminder must
appear exactly once.

## Notes

- The two `superpowers:*` rows in CLAUDE.md's escalation table need the
  superpowers plugin (claude-plugins-official); harmless if absent.
- Subagents don't receive the global CLAUDE.md — they're covered by the skills
  and the SubagentStop hooks (see docs/SETUP.md, Known limitations).
