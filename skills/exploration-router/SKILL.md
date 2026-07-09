---
name: exploration-router
description: Use when about to explore, search, or read source code to answer a question — before the first file Read. Triggers: "how does X work", "where is X defined/used", "what depends on X", tracing a feature or bug across files, or any task that starts with understanding unfamiliar code.
---

# Exploration Router

## Overview

Route each code question to the cheapest tool that answers it; escalate only after the cheaper tier actually failed. Unrouted agents answer a single feature-trace question by fully reading 9–10 files (~50k tokens); the same question routes to a handful of greps and ranged reads.

## The Recipe

1. Classify the question with the table below and run that tool first.
2. `grep -n` output gives line numbers — Read a range around the match (`offset`/`limit`), not the whole file.
3. Stop when the question is answered. Tests, type definitions, and neighboring modules are only on the path if the question asks about them.
4. Escalate to the next tier only when the current one failed to answer.

## Routing Table

| Question shape | Cheapest adequate tool |
|---|---|
| Where is symbol X defined / used? | `Grep -n` inline, then ranged Read around matches |
| Structure / API of a file or module? | claude-mem:smart-explore outline; fallback `grep -n "^export\|^function\|^class"` |
| How does feature X work across many files? | Explore agent on haiku, one batched question |
| What depends on X / safe to change? | gitnexus impact/query if repo is indexed; else Grep for callers |
| Which of many dirs/conventions contains X? | Explore agent, "very thorough" |
| Exact code needed for an edit | Ranged Read around the grep match; full Read only for small files or broad edits |

## Agent Briefs

When dispatching agents for exploration: set `model` explicitly (haiku unless the question needs judgment), batch all sub-questions into one dispatch, and require "conclusions + file:line references only — no file dumps".

## Common Mistakes (observed in baseline runs)

- Fully reading a 300+ line file when only 2–3 functions matter — grep the symbol first, read those ranges.
- Exempting the file that "feels central" from the recipe — it has the most lines to save; grep its symbols like any other file.
- Paging through a file in consecutive line ranges — that is a full read; target only the matched functions.
- Grepping for a symbol *after* having read every file — search is for navigating, so it comes first.
- Reading "context" files the question never mentioned (tests, constants, message types) for completeness.
