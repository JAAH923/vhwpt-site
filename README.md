# Valencia Health & Wellness Site

Modern Astro rebuild for Valencia Health & Wellness.

## Local Development

```sh
pnpm install
pnpm dev -- --port 4321
```

## Build

```sh
pnpm build
```

## GitHub Pages

The site deploys through GitHub Actions on pushes to `develop`.

The workflow sets `GITHUB_PAGES=true`, which makes Astro build with the `/vhwpt-site` base path for GitHub Pages while keeping local development paths unchanged.

## Review copy on pho-gate

`develop` is also served at <https://review.donovanhunter.com/vhwpt/>, the link to send Bruce.
After a merge to `develop`, deploy it from a terminal:

```sh
ssh pho-gate /opt/pho/sites/vhwpt-review/repo/deploy/pho-gate.sh
```

The script builds with the `/vhwpt` base and only swaps the live copy once the key pages exist;
it explains rollback in its header. The Caddy rule is `deploy/Caddyfile.vhwpt.conf`. pho-gate has
no PHP, so the booking form's endpoint is not run there (the form only sends from vhwpt.com).
