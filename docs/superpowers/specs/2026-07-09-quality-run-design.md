# quality-run Skill — Design

**Date:** 2026-07-09
**Status:** Approved in brainstorming (Berk, 2026-07-08/09).
Builds on the model-discipline layer and the grounded comparison against
existing capabilities (gsd-code-reviewer, gsd-verifier, gsd-add-tests read in
full; code-review / simplify / verify / review-gate are harness built-ins,
compared at description level).

## Goal

One on-demand skill that runs Berk's quality quartet — Critique → Test →
Optimizer → Validator — over a change, for ad-hoc / non-GSD work. It judges
the implementation against the ORIGINAL REQUEST, not just the diff, and each
stage applies its fixes under approval gates.

## Decisions locked during brainstorming

1. **On-demand only.** Invoked by the user after a task/feature lands. No
   hook, no auto-run.
2. **Orchestrator skill only.** No new agent files; four stage prompts
   composed by the skill, dispatched as subagents with per-stage models.
3. **Stage order: Critique → Test → Optimizer → Validator.** Bugs fixed
   first; contract-level tests added BEFORE optimization so the Optimizer
   works inside a safety net; Validator is a read-only final gate.
4. **Fix authority:** Critique, Test, Optimizer find AND apply fixes,
   re-running covering tests and reporting verbatim. Validator only reports.
5. **Approval gates between stages:** after each stage's report, the user
   approves before the next stage runs.
6. **Test-obsolescence rules:** the Test stage writes contract-level tests
   only (public behavior, inputs → outputs; no implementation-detail or
   mock-choreography tests). The Optimizer must keep tests green and may
   never silently edit a test — a changed test contract is flagged to the
   user as redesign, out of its lane. A helper deleted by the Optimizer
   takes its dedicated unit test with it, flagged in the report.
7. **GSD deference (trigger design):** GSD projects keep using GSD.
   quality-run must not shadow /gsd:code-review, gsd-verifier, or
   gsd-add-tests — see "Trigger & GSD deference".
8. **Borrow, don't call:** proven techniques from GSD agents are copied
   into stage prompts; the skill never invokes GSD workflows or writes to
   `.planning/`.

## Trigger & GSD deference

Frontmatter description (the routing surface):

> Use when the user asks for a full quality pass over recent work — critique,
> test coverage, optimization, validation — on ad-hoc or non-GSD changes
> ("quality-run this", "run the quartet", "check everything you just built").
> NOT for GSD phase work: if the repo has a `.planning/` directory and the
> change belongs to a GSD phase, use /gsd:code-review, /gsd:verify-work, or
> /gsd:add-tests instead.

Flow Step 0 enforces this at runtime:
- If `.planning/` exists in the repo root: state that this looks like a GSD
  project and name the GSD equivalents. Proceed only if the user explicitly
  confirms the change is outside the GSD workflow (e.g. a hotfix not tracked
  as a phase) or insists.
- If no `.planning/`: proceed without comment.

## Flow

**Step 0 — GSD deference check** (above).

**Step 1 — Scope.** Establish three inputs:
- **The request:** what was originally asked. Default: the user's task
  statement from this conversation; ask for it if unavailable (e.g. fresh
  session). This is the yardstick for Critique and Validator.
- **The diff:** default `git diff` + `git diff --staged` (working tree);
  or `git diff <base>..HEAD` when the user names a base. Written to a scratch
  file (review-package style) — stage subagents read the file; the diff never
  sits in the orchestrator's context.
- **The test command:** detect (package.json scripts, pytest, etc.) or ask.

**Step 2 — Critique stage** (strong model; judgment).
Prompt composed from:
- Adversarial stance borrowed from gsd-code-reviewer: "assume the
  implementation contains defects; your job is to prove it" + its
  go-soft failure-modes list.
- **Request compliance** (the gap nothing existing covers): compare diff
  against the request — Missing / Extra / Misunderstood, each with evidence.
- Correctness: logic errors, edge cases (nulls, empties, boundaries),
  security basics (injection, secrets, validation gaps).
- Severity contract borrowed from gsd-code-reviewer: every finding
  Critical/Warning/Info with file:line + concrete fix.
Fixes: applies Critical + Warning fixes approved by the user, re-runs
covering tests, reports verbatim. Gate: user approves before Step 3.

**Step 3 — Test stage** (mid model; mechanical with judgment edges).
- Audit coverage OF THE DIFF: which changed behaviors have no test?
- Classification gate borrowed from gsd-add-tests: propose a test plan —
  per gap: unit / E2E / skip (with reason) — user approves the plan before
  any test is written.
- Write contract-level tests only (decision 6). RED-GREEN evidence: each
  new test shown failing against a reverted behavior or trivially validated,
  then passing. Run the full covering suite at the end; report verbatim.
Gate: user approves before Step 4.

**Step 4 — Optimizer stage** (mid model).
- Simplification: dead branches, duplication, needless abstraction,
  altitude (borrowed intent from the `simplify` built-in — reimplemented in
  the prompt, not invoked).
- Performance: algorithmic wins and hot-path waste IN THE DIFF — the lens
  gsd-code-reviewer explicitly excludes. Guard: no speculative optimization,
  no added complexity without a measured or clearly-argued win (must not
  fight Simplicity First).
- Test rules from decision 6. Runs full covering suite after changes;
  verbatim output. Gate: user approves before Step 5.

**Step 5 — Validator stage** (strong model; READ-ONLY).
- Goal-backward method borrowed from gsd-verifier, decoupled from GSD:
  derive observable truths from THE REQUEST ("what must be true for this to
  be done?"), map each truth to artifacts, check each at four levels —
  exists → substantive (not a stub; use gsd-verifier's stub-detection
  patterns) → wired (imported AND used) → data flows (no hardcoded-empty
  props / static returns).
- Plus what gsd-verifier deliberately skips: RUN the affected flow
  end-to-end (the `verify` built-in's philosophy) — execute the entry
  point, drive the behavior, observe output. Never claims a truth from
  code reading alone when it is runnable.
- Verdict per truth: VERIFIED (evidence) / FAILED (what's wrong) /
  UNCERTAIN (needs human — say why). Final verdict: ready / not ready,
  with the failed-truth list.

**Step 6 — Final report.** One summary: per stage — findings, fixes applied,
test evidence; Validator's truth table; anything deferred or flagged
(contract changes, deleted tests, UNCERTAIN items). Committed nothing itself
unless the user asked; fixes land as one commit per stage (ask if tree was
dirty at Step 1).

## Model & cost defaults

Critique + Validator: strong model (judgment). Test + Optimizer: mid model.
User can override ("quality-run with opus everywhere"). Stages run
sequentially by design (each consumes the previous stage's output state);
within a stage, subagents may parallelize (e.g. Validator truth checks).

## Out of scope

- Any write into `.planning/` or invocation of GSD workflows.
- Auto-triggering (hook or post-implementation).
- Replacing per-task SDD reviews (superpowers pipeline keeps its own gates).
- New agent definition files.

## Verification plan

- Frontmatter routing: fresh session, ask for a "quality pass" in a repo
  with `.planning/` → skill defers to GSD by name; in a repo without →
  proceeds.
- Dry run on a sandbox repo with a seeded task: plant one request-compliance
  gap (missing feature), one bug, one coverage hole, one obvious
  simplification, one stub (wired but returns hardcoded empty). Expect:
  Critique catches gap + bug; Test catches hole with contract test;
  Optimizer simplifies without breaking tests; Validator catches the stub
  via 4-level check and fails the relevant truth.
- Confirm approval gates: each stage pauses for user input before the next.
