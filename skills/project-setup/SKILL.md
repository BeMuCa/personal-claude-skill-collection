---
name: project-setup
description: Use when the user asks to set up, update, align, or "bring up to my standards" a project's CLAUDE.md and conventions — new project, existing codebase, or inherited repo with or without an existing CLAUDE.md
---

# Project Setup

Bring any repo up to the user's working standards by explicit choice, not automatic assessment. You present a menu; the user decides.

**Hard rules:**
- Do NOT analyze the codebase. At most: check whether `./CLAUDE.md` or `./.claude/CLAUDE.md` exists, top-level `ls`, and detect languages via `git ls-files | sed 's/.*\.//' | sort | uniq -c | sort -rn | head` (extensions only — never bulk-read file contents).
- Never duplicate global `~/.claude/CLAUDE.md` rules into the project file. Project CLAUDE.md carries project-specific conventions only.
- Existing CLAUDE.md → merge mode: propose additions as an explicit diff; never delete or rewrite existing instructions without asking.

## Flow

**1. Situate.** Run the three cheap checks above. Note git state (uncommitted changes → ask before committing later).

**2. Menu walkthrough.** One AskUserQuestion per item, in this order (light → heavy). For each: state what it adds, why, and its cost. Answers: yes / no / yes-with-changes. Do not skip items; do not bundle questions.

| # | Item | Deploys |
|---|---|---|
| 1 | Task list | `notes/1_Planning.md`: Planned / Deferred / Done sections. CLAUDE.md: "Track planning here; check when asked 'what's next?'; update after each milestone." |
| 2 | Learnings file | `notes/0_Learnings.md` with ToC. CLAUDE.md: "Capture learnings — identified from the user's questions and advanced concepts/libraries encountered — with ToC maintained." |
| 3 | Explanation offers | CLAUDE.md: "After each new script/function or significant change, ask if the user wants an explanation; describe small changes inline." |
| 4 | Python header blocks — **personal preference: recommend skipping for shared repos** | CLAUDE.md: the exact header template below. |
| 5 | System architecture notes | `notes/2_System_Arch.md`: local-vs-deployment diagram + per-service breakdown (function + why indispensable). CLAUDE.md: "Maintain notes/2_System_Arch.md when architecture changes." |
| 6 | Spec tree (heavy — long-lived multi-module projects) | See "Spec tree" below. |

**3. Propose.** Assemble the project CLAUDE.md from chosen items only. No existing file → show the full proposed file. Existing file → show only the additions/changes as a diff. Apply after approval.

**4. Scaffold.** Create chosen `notes/` files with headers and empty sections. Commit if the repo uses git (ask first if the tree was dirty in step 1).

## Python header template (item 4)

```
# ============================================================
# Author:  <user>
# Created: <date>
# Purpose: One-line description of what the script does.
# Role:    1-3 lines on where this fits in the larger codebase.
#
# Functions:            <- or Models / Fields / Test classes
# - func_name(args) — one-liner
# ============================================================
```

## Spec tree (item 6)

Deploy three conventions plus a CLAUDE.md instruction:
- `PROJECT-SPEC.md` (root): goal, feature list, constraints.
- `<module>/SPEC.md`: co-located with the code it describes.
- `SPEC-TREE.md` (root): one entry per spec:
  ```
  ## <path/to/SPEC.md>
  scope: one-line what it covers
  read-when: task types / trigger phrases that require reading it
  status: CURRENT | DRAFT
  ```
- CLAUDE.md instruction: "Before starting any task, read SPEC-TREE.md and open only the specs whose read-when matches. When changing code covered by a spec, update the spec and its tree entry in the same turn."

The global `spec-guard` hook activates automatically once `SPEC-TREE.md` exists — no registration needed.

**Retrofit (existing codebases):** list candidate module dirs (from `ls`, not file reads); user confirms the list; draft each `SPEC.md` skeleton with `status: DRAFT` frontmatter by delegating per-module analysis to Explore subagents (or suggest `gsd-map-codebase` first). User reviews drafts before they count.

## Red flags

| Thought | Reality |
|---|---|
| "I'll quickly scan the repo to pick the right items" | Explicitly forbidden. The user picks; you present. |
| "Their existing CLAUDE.md is outdated, I'll rewrite it" | Merge mode. Propose a diff; touch nothing without approval. |
| "Small project, I'll skip the menu and just do the light items" | The menu IS the contract. Ask every item. |
