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
