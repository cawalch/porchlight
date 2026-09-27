// @ts-check
import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";

// GitHub Pages hosts Porchlight at https://cawalch.github.io/porchlight/.
// PR previews are nested one level deeper (/pr-preview/pr-<n>/), so the base path is
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
      // Preserve native modern CSS, including light-dark(), as the framework
      // build does. This transform target is not a tested browser-support floor.
      cssTarget: "chrome149",
    },
  },
});
