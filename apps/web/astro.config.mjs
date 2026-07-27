import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import cloudflare from "@astrojs/cloudflare";

// https://astro.build/config
export default defineConfig({
  // Static everywhere except src/pages/api/waitlist.ts, which opts out with
  // prerender = false — that single route is why an adapter is still needed.
  site: "https://team-tally.app",
  output: "static",
  adapter: cloudflare(),
  integrations: [sitemap()],
  build: {
    inlineStylesheets: "auto",
  },
  compressHTML: true,
});
