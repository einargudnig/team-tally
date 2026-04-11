#!/usr/bin/env bun
/**
 * Rasterize source SVGs in assets/icons-src/ into PNGs in assets/images/.
 *
 * Uses @resvg/resvg-js (precompiled native Rust bindings) so there's no
 * Node-gyp or Cairo install drama. Run: `bun run icons`
 *
 * If you tweak the logo, edit the SVG in assets/icons-src/ and re-run.
 * Never hand-edit the PNGs — they get overwritten.
 */

import { Resvg } from "@resvg/resvg-js";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const mobileRoot = join(here, "..");
const webPublic = join(mobileRoot, "..", "web", "public");
const srcDir = join(mobileRoot, "assets", "icons-src");
const mobileOut = join(mobileRoot, "assets", "images");

interface Target {
  src: string;
  outPath: string;
  outLabel: string;
  size: number;
  background?: string;
  note: string;
}

const targets: Target[] = [
  {
    src: "icon.svg",
    outPath: join(mobileOut, "icon.png"),
    outLabel: "mobile/icon.png",
    size: 1024,
    note: "iOS app icon (full-bleed amber — iOS adds rounding)",
  },
  {
    src: "adaptive-icon.svg",
    outPath: join(mobileOut, "adaptive-icon.png"),
    outLabel: "mobile/adaptive-icon.png",
    size: 1024,
    note: "Android adaptive foreground (inset ~60% for safe zone)",
  },
  {
    src: "splash-icon.svg",
    outPath: join(mobileOut, "splash-icon.png"),
    outLabel: "mobile/splash-icon.png",
    size: 1024,
    note: "Splash screen mark on transparent",
  },
  {
    src: "favicon.svg",
    outPath: join(mobileOut, "favicon.png"),
    outLabel: "mobile/favicon.png",
    size: 48,
    note: "Web favicon (Expo web only)",
  },
  {
    // iOS home-screen bookmark icon for the Astro landing page.
    // Re-uses the full-bleed iOS icon SVG at 180x180.
    src: "icon.svg",
    outPath: join(webPublic, "apple-touch-icon.png"),
    outLabel: "web/apple-touch-icon.png",
    size: 180,
    note: "iOS home-screen icon for team-tally.app",
  },
  {
    // Open Graph social share preview — universal 1200x630 size.
    // Rendered once with macOS Helvetica Neue, committed to the repo.
    src: "og-image.svg",
    outPath: join(webPublic, "og.png"),
    outLabel: "web/og.png",
    size: 1200,
    note: "Social preview (Facebook, Twitter, LinkedIn, iMessage)",
  },
];

let ok = 0;
let failed = 0;

for (const t of targets) {
  const srcPath = join(srcDir, t.src);

  if (!existsSync(srcPath)) {
    console.error(`  ✗ ${t.outLabel.padEnd(30)} — source missing: ${t.src}`);
    failed++;
    continue;
  }

  try {
    const svg = readFileSync(srcPath);
    const resvg = new Resvg(svg, {
      fitTo: { mode: "width", value: t.size },
      background: t.background, // undefined = transparent
    });
    const png = resvg.render().asPng();
    writeFileSync(t.outPath, png);
    console.log(`  ✓ ${t.outLabel.padEnd(30)} ${String(t.size).padStart(4)}px  —  ${t.note}`);
    ok++;
  } catch (err) {
    console.error(`  ✗ ${t.outLabel.padEnd(30)} — ${(err as Error).message}`);
    failed++;
  }
}

console.log(`\n${ok} generated${failed ? `, ${failed} failed` : ""}.`);
process.exit(failed ? 1 : 0);
