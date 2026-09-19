# Client review page

The generator now lives in the global skill at `~/.claude/skills/site-review/`,
because it is reusable across client sites. This file only records what is
specific to this repo.

    pnpm build
    python3 ~/.claude/skills/site-review/build_review.py <config.json> -o out.html

Config for this site: `~/.claude/skills/site-review/example-config.json`
(five pages, three shared layout blocks, seven open decisions).

Published review page: https://claude.ai/code/artifact/2c1ae741-4d12-4b00-8df6-a41ad2c8ce73

## Why the interior sections carry ids

`what-happens`, `who-it-suits`, `fees`, `credentials`, `why-both`, `request`,
`what-you-book` and `start-here` exist so the review config can target exactly
one section per matcher. `<section class="page-section">` appears twice on some
pages, and the generator refuses an ambiguous matcher rather than guessing. The
ids are useful anchors on the live site too.
