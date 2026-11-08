# vhwpt.com: rules for Claude in this repo

This is the website for Valencia Health & Wellness. Bruce Valencia (DPT) owns the practice and
the site. Justin Hunter (GitHub `JAAH923`) built it, maintains it and reviews changes before
they go live. Run `git config user.name`: if it isn't Justin's, you are working with Bruce.

## How a change goes live

| Branch | Where it shows | Who merges |
|---|---|---|
| `develop` | Staging, https://jaah923.github.io/vhwpt-site/ (hidden from Google) | Bruce or Justin, once the build check passes |
| `main` | www.vhwpt.com | Justin only |

1. Start every change on a new branch from the latest `develop`:
   `git switch develop && git pull && git switch -c change/<short-name>`.
2. Make the change, then run `pnpm build`. If it fails, fix it, or stop and explain. Never open
   a pull request on a failing build.
3. Push the branch and open a pull request into `develop`, with `--base develop`. Describe what
   changed and why in plain words.
4. GitHub runs the `build` check. When it passes and the person you're working with is happy,
   merge into `develop` with `gh pr merge <number> --merge`. Staging updates about two minutes
   later. Give them the link to the
   page that changed (the staging address plus the page path, e.g. `/vhwpt-site/about/`).
5. Going live is Justin's step: he opens and approves the pull request from `develop` into
   `main`. If you're working with Bruce, never open, approve or merge anything into `main`.

Never commit on `main` or `develop`, push to them, force-push, or rewrite history that's
already pushed. GitHub blocks these. The hook in `.claude/hooks/git-guard.mjs` stops them
earlier, and asks before commands that throw away work (`git reset --hard`, `git clean`).

## What Bruce can change, and what needs Justin

**Bruce can change these freely**, still on a branch and through a pull request:
- Practice details and service text in `src/data/site.ts`: phone, email, hours, areas,
  credentials, service descriptions.
- Answers on the Questions page in `src/data/questions.ts`. An answer with a `confirm` field
  is a draft fact. When Bruce confirms or corrects it, fix the wording and delete `confirm`.
- Text inside `src/pages/**/*.astro`, as long as the markup around it stays the same.
- Photos in `public/assets/photos/`: short lowercase names with hyphens, `.webp` or `.jpg`,
  under 500 KB each.

**These need Justin's review.** GitHub won't merge them until he approves (see
`.github/CODEOWNERS`). Make the change, open the pull request, say in it that Justin needs to
review, and tell Bruce it's waiting on Justin:
- Layout, styles, fonts, colours and spacing: `src/components/`, `src/layouts/`, `src/styles/`,
  `src/scripts/`, `design/`. The palette and type are locked in `design/tokens.json`.
- The booking form and its endpoint: `src/components/BookingForm.astro`, `public/api/`.
- Redirects, `robots.txt`, `sitemap.xml`, `astro.config.mjs`, `package.json`,
  `pnpm-lock.yaml`.
- `.github/`, `.claude/`, `CLAUDE.md`, `setup/`, `deploy/`, `scripts/`.
- Anything about prices, insurance or Medicare coverage, clinical claims, or a promised
  result, wherever it lives. Point it out in the pull request even if the file isn't on this
  list.

## Never

- Put a patient's name, photo, story or health details in any file, commit, branch name or
  pull request, even if asked. A testimonial needs the patient's written OK first, so ask
  Justin.
- Put API keys, passwords or tokens in any file. The booking form's keys live only on the
  server, in `private/vhwpt-contact.php`, which is not in this repo. Don't ask for it or
  recreate it.
- Install, remove or upgrade packages unless Justin asked.
- Delete files you didn't create in this change.
- Change GitHub settings, or connect to the web server. Merges to `main` deploy by themselves.
  Server work is Justin's.

## Working with Bruce

Bruce is a physical therapist, not a developer. Use plain words and skip git jargon. Repeat
back what he wants before you change anything. When you're done, tell him in a sentence or two
what changed and give him the staging link to check. If part of a request is on the "needs
Justin" list, do the safe part, open the pull request, and tell him Justin will review it.

## Commands

```sh
pnpm install     # once, after cloning
pnpm dev         # local preview at http://localhost:4321
pnpm build       # must pass before every pull request
```

How the staging and review copies deploy is in `README.md`. How Bruce's computer and GitHub
are set up is in `setup/README.md`.
