---
name: spec-sync
description: Use when the user asks to reconcile specs with the code — spec drift review, before milestones, after large changes, or when SPEC-TREE.md may be stale
---

# Spec Sync

Semantic drift review between specs and code — the judgment pass the mechanical `spec-guard` hook cannot do.

## Flow

1. **Scope.** Read `SPEC-TREE.md`. Default: all listed specs; honor a user-given subset ("just the auth specs"). No `SPEC-TREE.md` → tell the user this repo doesn't use the convention and offer `project-setup`.
2. **Compare.** For each spec in scope, dispatch one subagent (isolated context): read the spec, read the code it covers, return per claim: ACCURATE | DRIFTED (what the code actually does now) | ORPHANED (described code no longer exists). Run subagents in parallel; they read code, you don't.
3. **Report.** One table: spec, verdict, drift summary. Include specs still marked `status: DRAFT` as "needs first review".
4. **Fix.** For each DRIFTED/ORPHANED spec, propose the edit as a diff — never rewrite a spec wholesale without showing it. Apply approved edits; update the spec's `SPEC-TREE.md` entry (scope, read-when, status) in the same change. If features changed, update `PROJECT-SPEC.md` too.
5. **Commit** the reconciliation as one commit (ask first if the tree was already dirty).

## Rules

- A spec that says WHY something exists is not drifted just because the HOW changed — flag only contract/behavior mismatches, not refactors.
- Never delete a spec without asking; ORPHANED specs are proposed for removal, not removed.
- Verdicts must cite evidence (file:line) — an unverified ACCURATE is worthless.
