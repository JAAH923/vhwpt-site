# Brief

## Project
- Site / page: vhwpt.com, Valencia Health & Wellness. Full redesign of the five-page Astro build (Home, Services, Services/Health Evaluation, About, Book). Information architecture and copy stay; the visual system, layout and motion are what change.
- Audience: Adults in Broward and Palm Beach County recovering from an injury or an operation; older adults who want to stay steady and independent, and the adult children who often choose for them; people who want training from a clinician rather than a gym trainer. Virtual clients anywhere in the US.
- Offer: Physical therapy-informed rehabilitation, personal training and wellness from one practitioner, Dr. Bruce Valencia, DPT, in the client's home or over video. Every client starts with a 60-minute evaluation and leaves with a written plan.
- Primary action: Book an evaluation.
- CTA destination (real link or email): `/book` page, but its form posts to `#` (no handler, ENH-385). Working today: phone `tel:19542996536` (1-954-299-6536) and `mailto:info@vhwpt.com`.
- Constraints (stack, brand, deadline): Astro 5 static site, pnpm 10 via corepack; GitHub Pages preview at `/vhwpt-site` (base-aware links via `withBase`), noindex on preview. Five-page IA is a recorded decision. Brand: circular logo (kettlebell, barbell, red pulse line); crimson `#c41230` primary and deep green `#085041` secondary, confirmed by Bruce on 2026-08-29. Medical and nutrition disclaimers must stay in the footer. No unsourced claims; seven CONFIRM items (rates, phone hours, insurance) are still open with Bruce (T-182). No deadline given.

## Feel, in the user's words
> "I want to start from your recommended foundation. You have my donovanhunter.com site and its elegance, I don't want to copy it exactly but I want his site to feel as premium."

Reading of that, to be confirmed at the lock: donovanhunter.com's premium comes from restraint (one object, one light, very little text, slow confident motion, one idea taken from the subject), not from its black palette or WebGL. Bruce's site borrows the restraint and the discipline, not the look.

## Inputs checklist
Mark each `provided` (with file or text) or `missing`.

- Real copy: provided. Hero, About, services, evaluation steps and testimonials in `src/data/site.ts` and `src/pages/*.astro`.
- Real image or brand asset: provided. `public/assets/brand/bruce-headshot.webp` (1024x1024, lab coat), `bruce-in-session.png` (1402x1122, black and white, hands-on), `valencia-health-wellness-logo-full.png` (2048x2048). Thin for a premium site: two photos, and the headshot's embroidered name reads "Dose Valencia" (AI retouch artefact) that will show at large sizes.
- Proof point: provided. Credentials (DPT, CLT, ISSA-CPT, U.S. Navy veteran); client quotes in `site.ts`, including Olga Brannon's A1C 8.2 to 5.8.
- Signature moment: provided. The pulse line: the red heartbeat from the logo draws once across the hero, then settles into a calm steady line as you scroll (recovery as rhythm coming back). Chosen by user: "The pulse line (Recommended)".
- CTA destination: missing. The booking form has no handler; only phone and email work. Build a placeholder form that says plainly it is not connected yet and offers phone and email.

Accepted missing by user: "Placeholder form for now will be wired into his server"

Photography, in the user's words: "Use what we have now, generate some ai photography via enhancor overlay with AI photo so we don't forget to change". Every generated image carries a visible "AI photo" overlay until a real photo replaces it.
