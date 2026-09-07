---
name: bild-builder-trio
description: Use when the user marks up a reference image (a drawn outline, a circled area, an arrow) and wants geometry, UI, or a diagram rebuilt to match it — anything judged by eye rather than by tests. Runs a briefing/building/critique loop of three agents until a critic scores the result at the user's bar, committing every round for rollback.
---

# Bild-Builder-Trio

Three agents in a ring, plus you as orchestrator. Built for the case where the
acceptance criterion is **a picture the user drew on**, not a test suite.

Proven 2026-09-03 on an ice dragon's eye-socket bone: 72 % → 85 % → 91 % in
three rounds against a client bar of 90 %.

## When this applies

The user hands you an image with something marked on it and says "make it look
like this". Nothing in that sentence is machine-checkable. The trio exists to
turn it into something that is.

Do **not** use it for work with a real test suite — that is cheaper and more
reliable. Do not use it for a single obvious fix.

## What you need from the user — and nothing else

Three things. Ask only for what is missing; do not make them format anything.

| | | default if unstated |
|---|---|---|
| **1. The marked image** | a path, a paste, or "the one I just sent" | the most recent image in the conversation |
| **2. What they want, in their own words** | one sentence is enough; vagueness is expected | — must be asked for |
| **3. The bar** | "until it's 90 %" | **90 %** |

Everything else is yours: naming the rounds, writing the briefs, running the
agents, measuring, committing, naming the image paths. **Never ask the user to
supply a criterion, a coordinate, or a threshold** — deriving those from the
mark is the Auftraggeber's entire job, and the user drawing on a picture is
precisely their way of avoiding that work.

⛔ **Copy the user's sentence VERBATIM into the brief.** Every round. It is the
only thing in the loop that cannot drift, and both the Auftraggeber and the
Kritiker are measured against it, not against the previous round's brief.

## Round budget and the stall rule

- **Cap at 6 rounds.** If the bar is not met, stop and report honestly where it
  stands and what is blocking — do not keep going.
- ⛔ **Stall rule: if a round moves the score by less than 3 points, stop and
  go back to the user.** A stalled score means the brief or the bar is wrong,
  not that the modeller needs another try. Rounds are expensive; this run cost
  three session limits.
- Typical shape: the first round moves a lot, the second moves the real defect,
  the third is fine tuning. If round 2 does not move, something upstream is wrong.

## File layout, so a later session can resume

```
<scratch>/<loopname>/brief_rN.md · model_rN.md · critic_rN.md
renders/<area>/<loopname>_rN/          the round's images
renders/<area>/<loopname>_target.png   the user's marked image, committed first
```
Copy brief/critique into the repo alongside the code so the loop survives a
context reset. Commit the target image **before round 1** — it is the contract.

## The ring

**1. Auftraggeber (briefing agent).** Takes the user's words *verbatim*, opens
the marked image, and writes a build order a modeller could follow without ever
seeing the picture: the marked region described in coordinates, what the vague
phrase means geometrically, the concrete build order, and **numeric acceptance
criteria**. Writes to `brief_rN.md`. Never builds.

**2. Modellierer (building agent).** Reads the brief, builds, renders, and runs
every criterion itself. Writes `model_rN.md` with each number, pass/fail, and
before/after. Never commits — that is yours.

**3. Kritiker (critique agent).** Opens the user's image and the new renders,
compares feature by feature, and emits **one percentage** plus a numbered fix
list. Writes `critic_rN.md`. Gets no ability to run anything: looking is the job.

Then back to the Auftraggeber with the critique, and round again. Stop when the
critic reaches the user's bar.

## Your job as orchestrator

- **Verify the load-bearing numbers yourself.** Do not relay an agent's gate as
  fact. Every round, re-run the cheap decisive checks.
- **Commit every round separately** — brief, build, critique. The user rolls
  back to a round, and a batched commit destroys exactly that.
- **Name every image path.** The user accepts on pictures and must be able to
  open them.
- **Give each agent a budget line.** Heavy agents die on session limits
  mid-thought. Tell the critic: no new images, no builds, just look.
- ⛔ **When the critic and the brief disagree, MEASURE before building.** Make
  this a step, not a virtue: the modeller checks each demand against the image
  before touching geometry. Twice in one run this stopped a passing gate from
  being broken.
- **An agent that dies on a session limit gets RESUMED, not restarted.** Send it
  a message with its own last words quoted; it keeps its findings. Restarting
  makes it redo the diagnosis and costs another round.
- **Only an agent's FINAL message reaches you.** Tell each one: reply with one
  line, or write the report to a file. Otherwise long reports vanish and you get
  only their self-verification notes.

## ⛔ The three findings that make this worth keeping

**1. Every number green, and the thing still wrong.** Round 1 passed all twelve
criteria — coverage 0.992 against a 0.90 bar — and the critic gave 72 %:
*"Outline yes. Surface no."* Coverage measures the silhouette; it cannot see
whether the surface is calm. **Build an image criterion, not only a geometry
one** — and never conclude from green numbers that the user will accept it.

**2. The critic will be wrong, and measuring catches it.** Round 1: three of its
seven edge corrections were false — one would have pulled bone across the lens
and broken a passing gate, one aimed past the end of the user's own stroke, one
chased a notch the drawing never had. Round 2: it demanded a "pinch" be resolved
that is *in the drawing*. Both times the fix was to **measure the demand before
building against it**. Treat critique as input, never as instruction. Across the
whole run, 8 of the 19 points gained were the critic withdrawing its own errors.

**3. Check the bar before the work.** Two thresholds failed repeatedly and
measured nothing: one was never tested on real geometry and proved structurally
impossible; another was exceeded *by the perfect null case itself*. **A
threshold a flawless result cannot pass is not a criterion.** When a criterion
fails, ask first whether it can be passed at all.

## The user's own framing, kept verbatim

> "Lass einen sehr guten Auftraggeber-Agent starten der mit meiner Erklärung
> startet und sie sehr genau und detailliert und runtergebrochen für einen sehr
> guten Modellier-Agenten beschreibt und weitergibt. Der Modellier-Agent
> modelliert und gibt weiter an einen Kritiker, der Kritiker-Agent vergleicht den
> Ist-Zustand mit dem eingezeichneten gewünschten Bereich im Bild und bricht
> runter inwiefern es nicht passt. Dann gibt er es wieder weiter an den
> Auftraggeber-Agent welcher das wieder in Worte fasst und Zielgebung und dem
> Modellierer den Auftrag weitergibt. Loop geht so lange bis der Kritiker sagt
> dass es zu 90 % passt. Nach jeder Loop werden Bilder generiert und der Zustand
> committet für potentiellen Rollback später."

Two things to add that the framing does not say, both learned the hard way:
**the orchestrator re-measures**, and **a failing criterion is suspect before
the work is**.
