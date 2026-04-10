import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

// https://astro.build/config
export default defineConfig({
  site: "https://team-tally.app",
  integrations: [sitemap()],
  build: {
    inlineStylesheets: "auto",
  },
  compressHTML: true,
});
