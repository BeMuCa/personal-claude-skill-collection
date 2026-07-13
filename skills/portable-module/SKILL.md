---
name: portable-module
description: Use when the user asks to make a directory/feature modular, portable, self-contained, reusable, or copy-pasteable into another codebase — or to plug such a module into the current codebase. Produces a decoupled dir + a MODULE.md I/O contract (PRODUCE mode), or reads a dropped-in module's MODULE.md and wires it in (RECEIVE mode). Does NOT fire on general coding.
---

# Portable Module

Make a directory drop-in portable, or plug a portable one in. Two modes — pick by the request: "make X modular/portable/copy-pasteable" → PRODUCE; "plug this module in / wire up this dropped-in dir" → RECEIVE.

This skill only runs when asked. It is the one sanctioned exception to Simplicity First / YAGNI: here, a defined interface and spec ARE the request. Everywhere else, don't modularize speculatively.

Follow `disciplined-implementation` for every edit. Offer `quality-run` after a PRODUCE refactor.

## The contract: `MODULE.md` (written inside the module dir)

A receiving agent must be able to integrate the module from this file alone:

- **Purpose** — one line: what it does.
- **Interface / I/O** — each public entry point: inputs (name, type, meaning), outputs (type, meaning), errors/exceptions raised. This is the ONLY surface callers touch.
- **Dependencies** — external packages + version constraints; language/runtime requirements.
- **Configuration** — env vars / config keys needed, with defaults.
- **Host expectations** — anything the module assumes the surrounding codebase provides (a logger, a DB handle, etc.), each satisfiable through the interface.
- **Integration steps** — install deps → wire the entry point → supply config.
- **Example usage** — a minimal, runnable snippet.

## PRODUCE mode

1. **Target** — identify the dir from the request; if ambiguous, ask.
2. **Map the boundary** — find everything crossing the dir edge (exploration-router discipline): imports/references reaching OUT to the host, and host code reaching IN. List each as a coupling.
3. **Propose decoupling** — for each coupling, the plan to sever it: inject external deps through the interface, parametrize globals/config, vendor a tiny helper, or promote it to a declared dependency. **Approval gate — stop here.** Do not refactor before the user approves.
4. **Refactor** (approved plan only) — apply the changes; collapse the public surface to one clean entry point (e.g. `__init__.py` / index re-exports). Nothing outside the dir should be needed except declared dependencies.
5. **Spec + verify** — write `MODULE.md`; run the dir's tests if any exist; do a portability smoke check (import/execute the entry point from a clean path, not relying on host state). Report results verbatim.

## RECEIVE mode

1. **Read `MODULE.md`** in the dropped-in dir. If absent, say so and offer to run PRODUCE on it first.
2. **Dependency check** — compare its Dependencies against the host's lockfile/manifest; flag anything missing or version-incompatible before wiring.
3. **Wire** — follow the Integration steps; place the entry-point call where the user wants it, matching host conventions (disciplined-implementation).
4. **Verify in host** — run the Example usage or a smoke test against the real host. Never report "plugged in" without running it.

## Red flags

| Thought | Reality |
|---|---|
| "I'll just document it as-is" (PRODUCE) | If host couplings remain, it is not portable. Map the boundary and decouple, or say plainly it isn't drop-in yet. |
| "Refactor looks obvious, skip the approval gate" | The gate is mandatory — decoupling changes structure; the user decides. |
| "The spec can stay high-level" | A receiving agent has only MODULE.md. Vague I/O = a module nobody can plug in. Types and errors are required, not optional. |
| "It imports fine here, so it's portable" (RECEIVE) | "Here" has the host's state. Verify against the target with a real run. |
| "Make everything modular going forward" | No — this skill is opt-in per request. Speculative modularization is the YAGNI violation the rest of the layer forbids. |
