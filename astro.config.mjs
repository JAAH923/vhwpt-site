import { defineConfig } from "astro/config";

const isGitHubPages = process.env.GITHUB_PAGES === "true";

export default defineConfig({
  site: isGitHubPages ? "https://jaah923.github.io" : "https://www.vhwpt.com",
  base: isGitHubPages ? "/vhwpt-site" : undefined,
  vite: {
    server: {
      allowedHosts: ["justins-mac-mini.tail4bfb07.ts.net"],
    },
  },
});
