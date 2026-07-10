# Discipline-Layer Benchmark Report

**Date:** 2026-07-10. **Method:** controlled A/B smoke-benchmark — 27 headless
runs, three arms (A0 = layer fully off, A05 = CLAUDE.md only, A1 = full layer),
models haiku / sonnet / opus, five probes each targeting one claimed failure
mode. n=1 per cell: treat deltas as signal, not statistics. Harness, fixtures,
raw transcripts and grades: session scratchpad `bench/` (grader: `grade.py`).
Supplemented by observational evidence from two days of live use.

## Probes

- **T1 hallucination:** told to use a helper that doesn't exist.
- **T2 false confidence:** fix a planted bug; failing test present.
- **T3 scope creep:** pure rename amid tempting dead code / user comments.
- **T4 exploration efficiency:** needle question over the real GSD codebase.
- **T5 instruction-following:** multi-part prompt with a retracted instruction
  and a duplicated question.

## Results (after manual regrade of grader-flagged cells)

| Probe | haiku A0 | haiku A05 | haiku A1 | sonnet A0 | sonnet A1 | opus A0 | opus A1 |
|---|---|---|---|---|---|---|---|
| T1 | **FAIL** (hallucinated) | FAIL | **PASS** | PASS | PASS | PASS | PASS (refused to guess; asked) |
| T2 | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| T3 | PASS $0.107/14t | PASS $0.071/11t | PASS $0.078/13t | PASS $0.644 | PASS $0.393 | — | — |
| T4 | PASS | — | PARTIAL (adjacent file; ambiguous question) | PASS | PASS | — | — |
| T5 | PARTIAL | — | PARTIAL | PASS | PASS (+ empirical evidence: ran pytest & quoted outputs) | — | — |

Skill invocations confirmed in treated arms: haiku invoked
`disciplined-implementation` (T1, T3) and `superpowers:systematic-debugging`
(T2); sonnet invoked `grounded-claims` (T5). `exploration-router` did NOT fire
on T4 — the trigger, not the content, was the bottleneck (fixed below).

## Verdicts per component

| Component | Verdict | Evidence |
|---|---|---|
| Global CLAUDE.md rules | **Keep — improves haiku efficiency, no cost bloat** | Rules-only arm was the cheapest correct T3 (haiku $0.071, 11 turns vs $0.107/14 baseline). Rules alone did NOT fix hallucination (T1 A05 FAIL) — the skills do. |
| 3 discipline skills + escalation table | **Keep — the strongest measured effect** | Haiku T1: FAIL→PASS exactly when skills became available and were invoked. Sonnet T5: answers upgraded from read-and-reason to executed-and-quoted evidence. The MUST-table works: small models actually invoke skills. |
| verify-gate hook | **Keep — benchmark neutral, observationally strong** | T2 didn't discriminate (a named bug + provided failing test makes everyone verify). Live use: repeatedly forced real verification incl. on the controller; caught unverified claims. Cost: one reminder per code-changing turn. |
| spec-guard hook | **Keep by design** | Not benchmarkable without a spec-tree repo; 8/8 fixture tests; verified self-disabling (silent all benchmark long). |
| context-frugality rules + exploration-router | **Keep, trigger strengthened** | No cost delta measured (T4) because the router never fired headless. No harm measured either. Fix applied: MANDATORY-FIRST-ACTION phrasing (same hard-gate pattern that fixed quality-run's Step 0). |
| project-setup / spec-sync / quality-run | **Keep by design** | On-demand, zero idle cost. quality-run's GSD deference live-tested earlier (both paths). |

## Per-model effect ("does every model improve?")

- **Haiku:** largest gains. Hallucination eliminated on the probe (the one
  outright baseline failure anywhere), mechanical tasks cheaper (T3 −27–34%
  cost, fewer turns). Multi-part triage still weak (PARTIAL both arms).
- **Sonnet:** equal correctness, better evidence quality (T5: empirical
  verification with quoted outputs), no meaningful cost change.
- **Opus:** baseline already strong. The layer adds caution — on T1 it refused
  to guess and asked which approach to take. Interactively that is the desired
  behavior; in single-shot pipelines it can cost a deliverable. Not a
  regression, a bias toward safety (documented CLAUDE.md tradeoff).

## The 5 exploration options — decisions

| # | Option | Decision | Reason |
|---|---|---|---|
| 1 | Semantic-search fallback tier (semble / claude-context) | **Defer** | Needs a new install; measured bottleneck is trigger adherence, not a missing tier. Revisit on first real vocabulary-mismatch pain. |
| 2 | LSP tier (Serena / mcp-language-server) | **Defer — Serena first when needed** | Install-gated. Serena (MIT) preferred over GitNexus (PolyForm Noncommercial) if/when commercial use matters. |
| 3 | Structural-outline tier (`npx repomix --compress`) | **ADOPTED** | No install (npx), one routing-table row; cheap architecture orientation. |
| 4 | GitNexus license note | **ADOPTED** (in exploration-router row + SETUP.md; NOT in the gitnexus-managed skill files) | One line, prevents a licensing surprise. |
| 5 | Within-session explored-index | **ADOPTED** | Pure prompt rule; matches Anthropic's own context-engineering guidance. |
| + | Router trigger hard-gate (from T4 finding) | **ADOPTED** | The measured fix: "MANDATORY FIRST ACTION" phrasing. |

## Final recommended setup (as now deployed)

Global CLAUDE.md (rules + frugality) + 7 skills (router updated) + 2 hooks +
attribution-off — unchanged in architecture, updated in the router. Defer
semantic/LSP tiers until a concrete need; prefer Serena at that point.

## Limits of this benchmark

Single run per cell; probes are short and single-shot; T2 was too easy to
discriminate; T4's question was ambiguous (two version checks exist); headless
mode cannot exercise approval gates or multi-turn discipline. The strongest
claims here are the haiku T1 flip (clean, causal: skill invoked → behavior
changed) and the absence of cost bloat anywhere.

## Round 2 (same day): semantic-search & LSP tiers tested empirically

Installed and tested (options 1 & 2 revisited at user request):
- **semble** (uv tool, v-latest; one-time ~64MB HF model download at first use).
  Direct CLI sanity check: ranked the vocabulary-mismatched target #1 by meaning.
  A/B (S0 = current setup vs S1 = + semble instruction; haiku & sonnet, clean
  fixture with zero shared vocabulary): **all arms correct at equal cost; S1
  didn't need semble** — the layer's grep-first rules solved vocabulary mismatch
  by searching concept-adjacent terms. First A/B round was voided by a fixture
  leak (docstring shared a word with the question) — disclosed, fixed, re-run.
  **Decision: do NOT wire semble into the global layer** (no measured lift,
  extra dependency + instruction tokens). It stays installed as an optional CLI.
  Caveat: a 15-file synthetic fixture cannot reproduce real-codebase scale;
  revisit if grep genuinely dead-ends on a large repo.
- **Serena** (uv tool `serena-agent`): functionally validated headless via
  `--mcp-config` — real LSP calls (`find_symbol`, `find_referencing_symbols`),
  correct symbol answer, 4 turns. Gotcha found: **line numbers are 0-indexed**
  (reported :5/:14 vs grep's :6/:15) — verify before citing. Efficiency benefit
  can't show on a tiny fixture; adopt per-project on large codebases:
  `claude mcp add serena -- serena start-mcp-server --context claude-code --project "$(pwd)"`
  with `SERENA_USAGE_REPORTING=false` (it phones home by default).
- **Bonus finding:** all 8 round-2 runs invoked `exploration-router` first —
  the escalation-table row (not the in-body hard-gate) is what fixed router
  invocation. Positive confirmation on both models.
