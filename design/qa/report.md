# QA report

Date: 2026-11-03
Branch: `feature/premium-redesign`
Scope: the five pages of the premium redesign (direction A3), built from `dist/`.

## Source truth

- Visual target: the approved direction A3 (`design/directions/a3.html`, render `design/directions/shots/a3/`), approved as "lets go with this for now".
- Reference lock: `design/lock.md`. Decisions: `design/ledger.md`. Tokens: `design/tokens.json`.
- References compared, all `opened` and `seen` in `design/research.md`:
  - e887d8c2 TidyCal therapist page: the services-as-rows pattern.
  - 3acf3200 Acne Studios private appointment: the Book page split.
  - f6ea8212 Acne Studios client services: the services blocks.
  - The primary reference, 589c0a33 Superpower, is a style record with no screen image, so the hero is compared against the approved A3 render instead.

## Implementation evidence

- Screenshots: `design/qa/shots.md`, 84 images at 390 and 1280. Every one was viewed, through per-page contact sheets.
- States: the mobile menu open, and the Book form submitted (the placeholder message appears and nothing is sent).
- Overflow: none on any page at either width.
- Side-by-sides: `design/qa/compare/`. This folder is gitignored because it holds third-party reference screenshots and the repo is public.
  - `hero-vs-a3.png`: the home hero against the A3 render.
  - `rows-vs-tidycal.png`: the home services rows against TidyCal.
  - `book-vs-acne.png`: the Book page against Acne 3acf3200.
  - `services-vs-acne.png`: a services section against Acne f6ea8212.

## Fonts

Inter and Space Mono loaded (FontFace status `loaded`) on every page at both widths. No fallback type appears in any shot.

## Token lint

`design/qa/token-lint.md`: PASS, 0 violations, across 12 files. The exceptions in use are the ones already recorded in `tokens.json`: crimson and its pressed state, the two letter-spacing values and the 128px section spacing.

## Comparison notes

- **Hero vs A3.**
  - Composition, type, scrim, crimson button and pulse line match the render.
  - The room is now the loop's first frame shown as a still: the curtain loop is paused because it read jerky (Justin, 2026-11-03), and ENH-392 tracks the fix.
  - The table layer sits where it does in A3.
- **Rows vs TidyCal.**
  - Borrowed as intended: full-width rows with a title, a one-line description and a thin arrow at the far right.
  - TidyCal's floating shadowed cards and serif type are not carried over. The lock rejects cards and shadows and keeps Superpower's sans, so this is not drift.
- **Book vs Acne 3acf3200.**
  - Matches the borrowed structure: the form in a white left column, filled grey fields with the labels inside, and a full-height photo on the right with no radius.
  - The headline is larger and the submit is a crimson pill rather than a black full-width bar. Both follow the lock's type scale and button rule, so this is intentional.
- **Services vs Acne f6ea8212.**
  - Same headed text block with an image beside it.
  - Images are contained with a 16px radius, not edge to edge, per the lock's imagery row.
  - There are no blue link labels: the site's only accent is crimson.

## Findings

| Severity | Where | Finding | Status | Fix |
|---|---|---|---|---|
| P2 | Book, Health Evaluation (390) | Fact-row labels wrapped one word per line ("In- / home / visits"), and the insurance chip touched its label | fixed | `.facts` rows are now `auto minmax(0, 1fr)`: the label keeps its width and the value wraps. Re-shot and re-viewed. |
| P3 | Book (390) | The phone number in the form note broke at a hyphen ("1- / 954…") | fixed | `a[href^="tel:"]` no longer wraps. |
| P3 | Health Evaluation (390) | The "Confirm rate" placeholder chip wraps to two lines next to the longest fee label | open | It disappears once Bruce confirms rates (T-182). |
| P3 | Home hero | The curtain loop is paused, so the hero is a still rather than the approved moving room | open | Deferred by Justin; ENH-392 smooths and re-enables it. |

No P0 or P1 findings.

Final result: passed
