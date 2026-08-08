// @ts-check
import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";

// GitHub Pages hosts Porchlight at https://cawalch.github.io/porchlight/.
// PR previews are nested one level deeper (/pr/<n>/), so the base path is
// parameterised via ASTRO_BASE at build time. Both workflows set it explicitly.
const site = "https://cawalch.github.io";
const base = process.env.ASTRO_BASE ?? "/porchlight/";

export default defineConfig({
  site,
  base,
  trailingSlash: "ignore",
  integrations: [mdx()],
  build: { format: "directory" },
  vite: {
    build: {
      target: "es2022",
      // Match the framework's own lightningcss targets (chrome 149, which
      // supports light-dark() natively). vite 8 minifies CSS with
      // lightningcss for server builds and defaults cssTarget to an old
      // esbuild baseline, which rewrites light-dark() into broken
      // color-scheme conditionals (see --lightningcss-light artifacts).
      cssTarget: "chrome149",
    },
  },
});
