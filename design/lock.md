# Reference lock

Chosen direction: A, built as the A3 room variant (`directions/a3.html`). Justin approved it
on 2026-11-03: "lets go with this for now". The one deliberate deviation from the primary
reference is the hero (trait 5): a light living room with ink type instead of a dark photo with
white type, because Justin asked for an animated room.

## Primary reference
- ID + name: 589c0a33-a38c-4f77-a7b0-bf0c602c937d · Superpower ("clinical precision, vibrant pulse")
- Signature traits to preserve:
  1. Monochrome base: ink `#18181b` on white, with a grey progression (`#52525b`, `#d4d4d8`, `#f4f4f5`; darkened from `#71717a` and `#e4e4e7` on 2026-11-07 because secondary text and hairlines read too white) doing all the hierarchy. No other colour in the interface.
  2. One saturated accent with one job. Superpower's vermillion becomes Bruce's crimson `#c41230` in the same role: the primary action, the active nav item, and the key highlight, which here is the pulse line and the after-number of the home A1C result (5.8; Justin, 2026-11-07: "I like A, lets commit to it"). Never a background, badge, border or section fill.
  3. One neo-grotesk family for everything (Inter, the reference's named substitute): 700 for headlines with tight tracking, 400 for body. A mono only for tiny labels.
  4. Pill buttons (9999px): filled crimson primary, white with hairline-border secondary. Cards 16px and only where something is clicked.
  5. An image-led opening, then white contained sections, mostly two columns, 64–96px apart. Superpower opens on a full-bleed dark photograph with a centred white headline; this site opens on a full-bleed light living room (curtains in the breeze from an open window, a portable treatment table standing still; the loop is paused for now, see ENH-392) with the ink headline left-aligned over a white scrim (user's room idea, 2026-11-03).

## Borrowed details
- e887d8c2-3b87-4511-9337-0c7f42cf4333 · TidyCal therapist page (seen) · services as full-width rows (title, one small uppercase line, thin arrow) instead of a card grid; the credential line as one small uppercase row under the name · Home services list and the Services page index only
- 3acf3200-2066-4491-bc58-e6635d976d89 · Acne Studios private appointment (seen) · borderless filled fields with the label inside · the booking form's contact step only. The 45/55 split with a full-height photograph was retired 2026-11-08: it squeezed the form, so Book now uses the standard page head and the form pops out
- user · donovanhunter.com's inquiry form (Justin, 2026-11-08: "a new form that has a similar flow as DonovanHunter.com") · one question at a time in a pop-out, single choices move on by themselves, progress bar and "n of 7", Enter to continue, Back, a thank-you by first name · every booking button on the site opens it
- user · donovanhunter.com, per Justin's feel words · one idea taken from the subject, very little text per screen, slow and confident motion · the pulse line is that one idea; it is the only animated element on the site

## Media strategy
- Hero: the movement lab (Justin, 2026-11-08: "only have hero A"). A canvas draws a body as motion-capture markers with a chronophotograph trail, working through 01 Recovery (windmills), 02 Balance & walking (a walk) and 03 Strength (kettlebell swings). The floor is the pulse line, beating under each step and rep; it is the only crimson in the motion. Tags and readouts are ink and grey in plain words. Reduced motion gets one still frame of the walk. One button, "Book your first visit", with Bruce beside it. Code: `src/components/MotionHero.astro`, `src/scripts/lab-hero.js`, `src/scripts/body.js`. The room photo hero and the seven-way comparison are retired (git history has them); `photos/ai/room-open.webp` stays for the Book page.
- Real photos first everywhere else. `bruce-in-session` (black and white, hands-on) opens the section under the hero on Home. `bruce-headshot.webp` appears once, on About, cropped above the chest so the garbled embroidered name never shows.
- Everything else is generated through Enhancor as black-and-white, single-window-light scenes in real South Florida homes: hands on a knee or shoulder, an older adult walking a hallway with a hand near the wall, a laptop on a coffee table mid-session, resistance bands on a door. Never Bruce's face and never a recognisable client. Each generated image that shows a person carries a visible "AI photo" tag until a real photo replaces it (user's instruction). Generated images and video with no person in frame (empty rooms, objects, the hero room) carry no tag (user, 2026-11-03: "remove the ai photo tag if there is no person in the frame").
- One grade for all images: black and white, soft contrast, so real and placeholder photos read as one set.
- The pulse line is code-native SVG, not an image.

## Rejects
- The current four-card service grid, the three icon "why" tiles and the dot-separated trust bar: decoration standing in for hierarchy.
- Playfair Display headlines and the calm-editorial serif look (anti-slop #4); the primary reference is a sans system.
- Deep green as a second accent: the primary allows one accent. Bruce confirmed green on 2026-08-29; Justin approved dropping it on 2026-11-03: "Drop green (Recommended)". Record the change in SITE_CONTEXT so Bruce sees it.
- Dark mode as the base, gradients, glows, drop shadows beyond the source's 2px card shadow, emoji, left accent stripes.
- Copying donovanhunter.com: no black canvas, no WebGL water or stars, no carousel of Apple-style cards, no SF Pro.

## What must not drift
canvas / typography / accent roles / layout / media / density
- Canvas stays white with ink type; the only dark surface is the footer. The hero room stays light and black and white.
- Crimson stays on: primary button, active nav, the pulse line, and the A1C result number on Home. Nowhere else.
- One sans family, two weights. Headlines tight, body never under 17px (older readers).
- One photograph per view at most; text columns stay narrow (about 60ch).
- Motion is the pulse line and the hero room loop only (the loop is paused until ENH-392 smooths it; a jerky loop never ships). Nothing standing on the floor moves, there is no pointer or scroll parallax, and both stop for reduced motion.

Lock approved by user: yes
Approved 2026-11-03: "Approve, render A/B/C (Recommended)"
Direction approved 2026-11-03: "lets go with this for now"
