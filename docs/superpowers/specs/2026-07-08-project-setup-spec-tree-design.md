# project-setup Skill, Spec-Tree System & spec-guard Hook — Design

**Date:** 2026-07-08
**Status:** Approved in brainstorming (Berk, 2026-07-08); builds on the
model-discipline layer (see 2026-07-08-model-discipline-global-rules-design.md).

## Goal

Give Berk a repeatable, invocation-driven way to bring ANY repo — new, existing,
or inherited — up to his working standards, right-sized by explicit choice
rather than automatic assessment; plus a spec-tree convention for large
projects so fresh sessions read only the specs a task needs, kept honest by a
self-disabling global hook and an on-demand sync skill.

## Decisions locked during brainstorming

1. **No repo assessment by the skill.** On big repos, analysis would flood
   context. The skill presents a fixed menu and Berk decides. At most a cheap
   `ls`-level glance (top-level entries, detected languages by extension) to
   phrase questions — never reading file contents in bulk.
2. **Menu-driven, light → heavy, one item at a time**, each answered
   yes / no / yes-with-changes (AskUserQuestion, one question per item).
3. **Works on any repo state**: fresh project, existing code without
   CLAUDE.md, or existing CLAUDE.md (merge mode — propose a diff, never
   silently overwrite).
4. **spec-guard is global and self-disabling** ("smart toggle"): registered
   once alongside verify-gate; exits silently unless the repo actually has
   specs. No per-project hook installation.
5. **Python header blocks are a personal preference**: menu item flagged
   "skip for shared repos".
6. **Project CLAUDE.md never duplicates global rules** — it carries only
   project-specific conventions.
7. Berk's four-section behavioral block now lives verbatim in the global
   CLAUDE.md (commit c60f3bf) — it is NOT part of the project templates.

## Deliverable 1: `~/.claude/skills/project-setup/SKILL.md`

Trigger (frontmatter description): "Use when the user asks to set up, update,
or align a project's CLAUDE.md and project conventions — new project, existing
codebase, or inherited repo."

Flow:
1. **Situate** (cheap): does `./CLAUDE.md` or `./.claude/CLAUDE.md` exist?
   Top-level `ls`; detect languages by extension sampling (`git ls-files |
   sed 's/.*\.//' | sort | uniq -c | sort -rn | head`), NOT by reading files.
2. **Menu walkthrough**, one AskUserQuestion per item, light → heavy. Each
   item states what it adds, why, and its cost. Items in order:
   a. **Reporting & comment conventions** (light): project-specific concision
      notes if any; "never touch user comments" is already global — only asks
      if the project needs stricter/looser variants.
   b. **Task list** — `notes/1_Planning.md`: planned / deferred / done
      sections; "check when asked 'what's next?'; update after each
      milestone."
   c. **Learnings file** — `notes/0_Learnings.md` with ToC; CLAUDE.md
      instruction: capture learnings identified from Berk's questions and
      advanced concepts/libraries encountered.
   d. **Explanation offers**: after each new script/function or code change,
      offer an explanation (small changes: describe inline).
   e. **Python header blocks** (flagged: personal preference — skip for
      shared repos): the exact header format (Author / Created / Purpose /
      Role / Functions list) copied verbatim from Berk's template.
   f. **System architecture notes** — `notes/2_System_Arch.md`: local-vs-
      deployment diagram + per-service breakdown ("what it does, why it's
      indispensable").
   g. **Spec tree** (heavy): deploys the convention of Deliverable 3. For
      existing codebases, offers retrofit (see below).
3. **Propose**: assemble the project CLAUDE.md from chosen items.
   - No existing CLAUDE.md → show the full proposed file for approval.
   - Existing CLAUDE.md → show an explicit merge diff (additions/changes
     only); apply only what Berk approves; never delete existing
     instructions without asking.
4. **Apply**: write CLAUDE.md and scaffold chosen notes/ files with headers
   and empty sections. Git-commit if the repo uses git (ask if uncommitted
   changes are present).
5. **Retrofit (only if spec tree chosen on an existing codebase)**: for each
   major module directory (Berk confirms the list), draft `SPEC.md` skeletons
   with `status: DRAFT` frontmatter. Drafting may delegate per-module
   analysis to subagents (Explore) or suggest `gsd-map-codebase` first —
   the skill itself still reads no bulk code.

## Deliverable 2: `~/.claude/skills/spec-sync/SKILL.md`

Trigger: "Use when the user asks to reconcile specs with the code — spec
drift review, before milestones, or after large changes."

Flow: read `SPEC-TREE.md`; for each listed spec (or a user-scoped subset),
compare spec claims against current code (subagent per spec for isolation);
report per spec: ACCURATE / DRIFTED (what changed) / ORPHANED (code gone);
propose edits; apply approved ones; update SPEC-TREE.md entries (paths,
scopes, "read when" triggers) and the root PROJECT-SPEC.md if features
changed. Never rewrites a spec wholesale without showing the diff.

## Deliverable 3: spec-tree convention (deployed by project-setup)

- **`PROJECT-SPEC.md`** (repo root): goal, feature list, constraints — the
  "big ground-level spec".
- **`<module>/SPEC.md`**: co-located with the code it describes.
- **`SPEC-TREE.md`** (repo root): one entry per spec —
  ```markdown
  ## <path/to/SPEC.md>
  scope: one-line what it covers
  read-when: trigger phrases / task types that require reading it
  status: CURRENT | DRAFT
  ```
- Project CLAUDE.md snippet (only in repos with the tree): "Before starting
  any task, read SPEC-TREE.md and open only the specs whose read-when
  matches the task. When changing code covered by a spec, update the spec
  and its SPEC-TREE.md entry in the same turn."

## Deliverable 4: `~/.claude/hooks/spec-guard.js` (global, self-disabling)

Registered in `~/.claude/settings.json` under `Stop` and `SubagentStop`,
after verify-gate. Same proven mechanics as verify-gate: one-shot
(`stop_hook_active` pass-through), fail-open (any error → exit 0 silent).

Logic per stop attempt:
1. If `stop_hook_active` → exit 0.
2. Read transcript; collect file paths from `Edit`/`Write`/`NotebookEdit`
   tool_use inputs in the current turn (same turn-boundary scan as
   verify-gate). Bash is NOT scanned (paths aren't reliably extractable
   from commands) — accepted coverage gap.
3. **Smart toggle:** resolve the repo root of each changed file (walk up to
   `.git`, capped at 20 levels). If the repo has no `SPEC-TREE.md` at root,
   stay silent. Repos without the convention never see this hook.
4. If any changed file has an ancestor `SPEC.md` (walk up from the file to
   repo root) and neither that `SPEC.md` nor `SPEC-TREE.md` was also
   touched this turn → block once: "Code under <dir> changed but <spec>
   was not updated. Update the spec and its SPEC-TREE.md entry, or state
   why no update is needed."
5. Specs/notes/docs-only turns never trigger (changed files that are
   themselves .md files under a spec path count as spec updates).

Failure direction is always a benign one-shot reminder — never a trap, never
a loop, never active in repos without SPEC-TREE.md.

## Out of scope

- Automatic tier/size detection of repos (explicitly rejected).
- Duplicating global rules into project CLAUDE.md files.
- Editing GSD-managed files; replacing /init or gsd-map-codebase.
- Auto-generating spec content without DRAFT marking and user review.

## Verification plan

- project-setup: run in three sandbox repos (empty; code without CLAUDE.md;
  code with an existing CLAUDE.md) — menu behaves, merge mode shows a diff
  and preserves existing lines, chosen scaffolds appear, unchosen don't.
- spec-guard: fixture tests like verify-gate's (block when code changed
  under a SPEC.md without spec touch; silent when: no SPEC-TREE.md, spec
  updated same turn, docs-only turn, stop_hook_active, garbage input);
  live check in a sandbox repo with the convention; confirm silence in
  ~/.claude repo itself (no SPEC-TREE.md).
- spec-sync: run against a sandbox repo with a deliberately drifted spec;
  confirm DRIFTED detection and tree update.
