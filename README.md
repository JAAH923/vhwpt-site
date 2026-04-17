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

The site deploys through GitHub Actions on pushes to `main`.

The workflow sets `GITHUB_PAGES=true`, which makes Astro build with the `/vhwpt-site` base path for GitHub Pages while keeping local development paths unchanged.
