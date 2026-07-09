---
name: disciplined-implementation
description: Use when writing or modifying any code — enforces reading before writing, matching existing conventions, right-sizing the change, and reviewing your own diff before declaring it done
---

# Disciplined Implementation

## Overview

Sloppy code is rarely a typing problem; it is a not-looking problem. This protocol makes you look — at the existing code before writing, and at your own diff after.

## Before writing

1. **Read the file you are about to change, and its neighbors.** Look at its imports, its error-handling style, its naming. You are a guest in this codebase.
2. **Find the existing convention for what you are about to do.** Adding a route? Read two existing routes. Adding a test? Read two existing tests. Copy the house style, not your habits.
3. **Right-size the plan.** The correct change is the smallest one that fully solves the stated problem. Both failure directions are defects: under-engineering (ignores edge cases the problem statement implies) and over-engineering (abstractions, options, and generality nobody asked for).

## While writing

- Handle errors where the operation can actually fail — I/O, parsing, external calls — in the style the codebase already uses. Do not add blanket try/catch wallpaper.
- No speculative generality: no parameters, hooks, or abstractions for hypothetical future needs (YAGNI).
- No drive-by refactors. If you see unrelated code worth improving, note it in your summary instead of touching it.
- Comments only for constraints the code cannot express. Never narrate what the next line does.

## After writing — the self-review gate

Re-read your full diff as if reviewing a stranger's PR:

- Does every changed line earn its place? Delete any that don't.
- Does the change fully solve the stated problem, including the implied edge cases?
- Did you break a caller? (You checked callers before editing shared code — confirm the contract still holds.)
- Would the file's original author recognize this as their style?

## Red flags — you are rationalizing

| Thought | Reality |
|---|---|
| "I know how this framework works" | This codebase may use it differently. Read the neighbors. |
| "I'll clean this other thing up while I'm here" | Scope creep. Note it, don't touch it. |
| "A wrapper/abstraction would make this cleaner" | If only one caller exists, it's speculation. Don't add it — write the code inline. |
| "Error handling can come later" | Later never comes. Handle it where it can fail, now. |
| "My diff is fine, I just wrote it" | That is exactly why you can't see its flaws. Re-read it cold. |
