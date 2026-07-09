---
name: quality-run
description: Use when the user asks for a full quality pass over recent work — critique, test coverage, optimization, validation ("quality-run this", "run the quartet", "check everything you just built") — on ad-hoc or non-GSD changes. NOT for GSD phase work — if the repo has a .planning/ directory and the change belongs to a GSD phase, use /gsd:code-review, /gsd:verify-work, or /gsd:add-tests instead
---

# Quality Run

Orchestrate four stages over a change: **Critique → Test → Optimizer → Validator**. The yardstick is the ORIGINAL REQUEST, not just the diff. Stages 1–3 find AND fix (approval-gated); the Validator only reports. You are the orchestrator: dispatch each stage as a subagent, keep bulk artifacts in files, pause for user approval between stages.

## Step 0 — GSD deference (MANDATORY FIRST ACTION — before anything else)

Your FIRST tool call is: `test -d .planning -o -d "$(git rev-parse --show-toplevel 2>/dev/null)/.planning" && echo GSD-PROJECT || echo not-gsd`.

- **Output is `GSD-PROJECT`** → this is a GSD project. STOP. Output exactly this decision and nothing about the stages: "This repo uses GSD. The GSD pipeline covers this: `/gsd:code-review` (critique), `/gsd:add-tests` (tests), `/gsd:verify-work` (validation). Is this change outside the GSD workflow (untracked hotfix, experiment)? Only then should quality-run proceed." WAIT for the user's answer. You may not run Step 1 before the user explicitly confirms.
- **No directory** → proceed to Step 1 without comment.

There is no exception to this check. "The user explicitly asked for quality-run" is NOT an exception — they may not know this repo is GSD-managed.

## Step 1 — Scope

Establish three inputs before any stage:
1. **The request** — what was originally asked, verbatim. From this conversation, or ask the user if unavailable. Every stage prompt carries it.
2. **The diff** — default `git diff` + `git diff --staged`; or `git diff <base>..HEAD` if the user names a base. Write commit list + stat + full diff (`-U10`) to one scratch file; stages read the file path, never inline diff text.
3. **The test command** — detect (package.json scripts, pytest.ini, Makefile...) or ask. If the tree was dirty before the run, ask before any stage commits.

## Stage prompts — common contract

Every stage subagent gets: the request (verbatim), the diff file path, the test command, and this contract: report findings with file:line evidence; severity Critical / Warning / Info with a concrete fix each; run the covering tests after applying fixes and paste output verbatim; never claim without running; return a structured report, not narration.

**Models:** Critique + Validator → strong model (opus-tier). Test + Optimizer → mid model (sonnet-tier). User overrides win.

## Step 2 — Critique (fixes: yes)

Stage prompt must include:
- Adversarial stance: "Assume this implementation contains defects — your starting hypothesis is that it has bugs, request violations, or security gaps. Surface what you can prove." Guard against going soft: don't stop at surface issues; trace edge cases (nulls, empties, boundaries); "compiles/tests pass" is not correctness; don't downgrade severity to be polite.
- **Request compliance** (primary lens): compare the diff against the request — **Missing** (asked, not built), **Extra** (built, not asked), **Misunderstood** (built wrong). Evidence per item.
- Correctness: logic errors, unhandled edge cases, error-handling gaps, injection/secrets/validation basics.
- After user approves the findings: apply Critical + approved Warning fixes, re-run covering tests, paste output.

**Gate:** present the report; user approves fixes and the move to Step 3.

## Step 3 — Test (fixes: yes)

Stage prompt must include:
- Audit coverage OF THE DIFF: list each changed behavior with no test.
- **Test plan gate:** propose per gap — unit / E2E / skip (with reason) — and STOP for user approval before writing any test.
- **Contract-level only:** tests assert public behavior (inputs → outputs, visible effects). Forbidden: implementation-detail tests, mock choreography, private internals — those punish later refactoring.
- RED-GREEN evidence per new test (show it fails when the behavior is broken/reverted, then passes), full covering suite at the end, output verbatim.

**Gate:** user approves before Step 4.

## Step 4 — Optimizer (fixes: yes)

Stage prompt must include:
- Simplification: duplication, dead branches, needless abstraction, wrong altitude — smallest code that does the job.
- Performance IN THE DIFF: algorithmic wins, hot-path waste. Guard: no speculative optimization; no added complexity without a measured or clearly-argued win.
- **Test rules (hard):** all tests stay green. NEVER silently edit a test — if a test's asserted contract seems wrong, flag it to the user (that's redesign, out of this lane). If an unused helper is deleted, its dedicated unit test goes with it — flagged in the report.
- Full covering suite after changes, output verbatim.

**Gate:** user approves before Step 5.

## Step 5 — Validator (READ-ONLY)

Stage prompt must include:
- Derive observable truths from the request: "what must be TRUE for this to be done?" (3–7 testable behaviors).
- Check each truth's artifacts at four levels: **exists** → **substantive** (not a stub: no placeholder returns, empty handlers, hardcoded-empty data, `return Response.json([])` with no query) → **wired** (imported AND used) → **data flows** (rendered/returned values trace to a real source, not static fallbacks).
- **Run it:** for every runnable truth, execute the entry point and observe behavior — code reading alone never verifies a runnable truth.
- Verdict per truth: VERIFIED (evidence) / FAILED (what's wrong) / UNCERTAIN (why a human is needed). No fixes, no writes.

## Step 6 — Final report

One summary: per stage — findings, fixes applied, test evidence; the Validator truth table; flagged items (contract questions, deleted tests, UNCERTAIN truths); overall verdict ready / not ready. One commit per fixing stage (only with the user's go from Step 1).

## Red flags

| Thought | Reality |
|---|---|
| "The diff looks clean, skip Critique's request check" | Request compliance IS the point. Missing features hide in clean diffs. |
| "I'll write a quick mock-based test, it's easier" | Implementation-detail tests die at the next refactor. Contract-level only. |
| "This test is now wrong after optimizing — I'll just update it" | Silently editing tests defeats the net. Flag it. |
| "Code reading shows it works, skip running it" | Runnable truths get run. gsd-verifier skips this; the Validator must not. |
| "It's a GSD repo but the user said quality pass" | Step 0: name the GSD equivalents first; proceed only on explicit confirmation. |
