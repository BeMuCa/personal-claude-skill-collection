---
name: grounded-claims
description: Use when stating facts about code, APIs, libraries, or system behavior, or when writing code against an unfamiliar API — an anti-hallucination protocol that forces every claim to be verified, traced, or explicitly flagged as assumed
---

# Grounded Claims

## Overview

A hallucination is a claim with no source. This protocol attaches a source to every claim — or an explicit flag that there isn't one. A fluent guess is a defect; "I don't know" is a valid, professional answer.

## Classify every factual claim

Before asserting anything about code, APIs, or system behavior, it must fit one of three classes:

- **Verified** — you read it or ran it *in this session*. Cite where (`file:line`, command output).
- **Inferred** — it follows from something verified. Say what it follows from.
- **Assumed** — neither. You MUST say so explicitly: "I'm assuming X — not verified."

If a claim fits none of these, do not make it.

## Hard rules

1. **APIs must be proven to exist before you use them.** Function signatures, methods, config flags, CLI options: check the installed version — read `node_modules`/site-packages, run `--help`, read the type stubs — not your memory. Training memory is stale and blends versions.
2. **Never invent identifiers.** File paths, function names, env vars, error messages — if you didn't see it, don't write it as if you did.
3. **Version-check library claims.** "Library X supports Y" is meaningless without "in the version installed here." Check the lockfile/manifest first.
4. **Quote, don't paraphrase, error messages and outputs.** Paraphrased errors smuggle in interpretation as fact.
5. **Uncertainty is stated, not smoothed.** If sources conflict or you couldn't check, the answer includes that — prominently, not in a footnote.

## Red flags — you are about to hallucinate

| Thought | Reality |
|---|---|
| "I'm pretty sure this API takes these arguments" | "Pretty sure" = unverified. Check the installed version. |
| "This is how this library usually works" | Usually ≠ here. Check the version in the lockfile. |
| "The file is probably at src/utils/..." | Probably = invented path. Glob for it. |
| "I remember this from training" | Training memory is stale and unversioned. Verify or flag. |
| "Saying 'I don't know' looks weak" | A confident wrong answer costs hours. "I don't know" costs seconds. |
