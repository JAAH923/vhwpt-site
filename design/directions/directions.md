
---

# Round 2 · Motion (2026-11-07)

Justin: "Ignore the previous idea of using the flowing window. I want motion like we did for
Donovanhunter.com and EverFit, but something that is unique." Then, on seeing the first cut of A:
"his ideal customer is more of a younger crowd possible to add some windmill stretches vs the
senior citizen ones being first". So every direction leads with athletic movement; none opens
with a guarded walk or a chair test. Copy is the mock file's hero and About (Desktop/
vhwpt-copy-final-MOCK.md); nothing marked "(mock)" is used. All three are hand-built canvas or
DOM on one shared kinematic body (`directions/motion/body.js`), no libraries, paused off screen,
with a still frame under reduced motion.

## Motion A · Movement lab
- Primary reference: 93290969 · Luma AI motion-capture viewer (seen), with 0cdbf9c2 · Augen Pro (opened) for the instrument readouts.
- Traits: a body drawn only as motion-capture markers and bones on a measured walkway (0.1 / 0.5 / 1 m ticks), leaving a Marey chronophotograph trail; three sets in order, 01 Mobility (standing windmills, raised three-quarter view, the ghost arms fan like blades), 02 Stride (side-on walk, no foot slip), 03 Strength (kettlebell swings); one live measure in crimson (hand-to-foot gap, then knee, then hip); mono readouts and stage tracks you can click.
- Rejects: photos or video in the hero, WebGL, a logo object, any second accent, a senior or guarded opener.
- Shots: directions/shots/motion-a/

## Motion B · The warm-up
- Primary reference: a0f473eb · Operate (opened) for oversized ink type on white, with 35b8bf2a · Anam (seen) for the live-state rows.
- Traits: the headline is the body. Every letter is a spring standing on the baseline; it stands up off the floor on load, then runs a warm-up as a ripple across the lines: squats (squash), windmills (each letter turns a full circle), jumps (load, hang, soft landing); letters lean away from the pointer and stretch with scroll speed; rep counters under three tracks.
- Token exceptions it would need: headline up to 176px (lock tops out at 66px) and -0.035em tracking.
- Rejects: canvas, figures, imagery in the hero, letters leaving their line.
- Shots: directions/shots/motion-b/

## Motion C · The scan
- Primary reference: 35b8bf2a · Anam avatar creation (seen), with 93290969 · Luma (seen) for the turntable platform.
- Traits: a body of 2,600 points (1,500 on phones) doing overhead squats on a slowly turning platform; a crimson ring sweeps down and up it, and points it has passed turn from grey to ink; the ring's height is labelled; one ink tag measures the near knee; readouts for hip height, knee, trunk and reps under a "live" status.
- Rejects: dark canvas, glow, particles drifting off the body, a chair-stand or balance test.
- Shots: directions/shots/motion-c/

- Spacing fix (Justin: "spacing on option c is a bit off, alot of space between graphic and the animation"): the body now stands just past the copy's longest line instead of half way across the leftover width.

## Motion D · Warm-up scan (B + C)
- Asked for by Justin: "possible to give it a combo of B and c I like the animation of the letters in B, maybe delay of the person graphic until the work graphics have settled".
- Primary reference: as C (35b8bf2a Anam, seen; 93290969 Luma, seen), with a0f473eb Operate (opened) for the type.
- Traits: B's headline, letter springs and pointer lean, set a little smaller so the body fits beside it; the C body stands on the last line's baseline, right after the widest line. Order: the letters stand up (0 to 1.6 s); once they settle, the crimson ring rises from the floor and scans the body in (2.1 to 4.0 s); then the warm-up starts. Each move's ripple runs through the type and lands in the body, which does the same move: overhead squat, windmill (one side per rep), countermovement jump. The ring keeps sweeping between the ankles and the hands; the near knee is tagged, and the live line above the move tracks reads the knee too. On phones the body gets its own band between the headline and the sub.
- Token exceptions it would need: headline up to 168px and -0.035em tracking (same issue as B).
- Rejects: grey "unscanned" points after the scan-in (too busy beside moving type), the body moving while the letters stand up.
- Shots: directions/shots/motion-d/

## Motion E · Smoosh and scan
- Asked for by Justin: "the wide graphic of B from the original with a smoosh once static to shift to the left and then bring in the scan".
- Primary reference: as D (35b8bf2a Anam, seen; 93290969 Luma, seen; a0f473eb Operate, opened).
- Traits: the headline stands up stretched wide across the stage (B's squat frame, held still), then smooshes to the left: the right-hand letters set off first and squeeze into the left ones, over-narrow and bulge, then settle at natural width (2.4 to 3.5 s). In the room that opens, the platform fades in and the crimson ring scans the body in (3.7 to 5.6 s); from 6.1 s the warm-up runs as in D. On phones the type already fills the width, so the stretch is small and the body gets its own band.
- Token exceptions it would need: headline up to 176px and -0.035em tracking (as B).
- Rejects: a centred start that slides over (the first build; it lost B's wide letterforms), the label moving with the type.
- Shots: directions/shots/motion-e/

Scaling pass (Justin: "make sure the animation is scalable"), checked at 390, 483, 768, 1024, 1280, 1440 and 1920 wide with no overlap or sideways scroll: A and C stack below 1024px with the figure in its own band between the copy and the readouts; B, D and E size the headline by width as well as height, and below 1024px the sub and the move tracks stack instead of squeezing the sub into a narrow column. On a short window (about 565px tall) the hero runs past the fold and scrolls; nothing overlaps.

Round 2 pick: Bruce decides. Justin leans C: "I like C but we should leave it to him" (2026-11-07). D is the B + C combo Justin asked for after that; E is his wide-type smoosh variant of D.
