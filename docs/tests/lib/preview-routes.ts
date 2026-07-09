import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

const previewDirectory = fileURLToPath(
  new URL("../../src/pages/preview/", import.meta.url),
);

const previewFiles = readdirSync(previewDirectory)
  .filter((file) => file.endsWith(".astro"))
  .sort();

export const previewRoutes = previewFiles
  .filter(
    (file) =>
      !readFileSync(`${previewDirectory}/${file}`, "utf8").includes(
        "Astro.redirect(",
      ),
  )
  .map((file) => {
    const slug = file.replace(/\.astro$/, "");
    return slug === "index" ? "/preview/" : `/preview/${slug}`;
  });

export const previewRedirectRoutes = previewFiles
  .filter((file) =>
    readFileSync(`${previewDirectory}/${file}`, "utf8").includes(
      "Astro.redirect(",
    ),
  )
  .map((file) => `/preview/${file.replace(/\.astro$/, "")}`);
