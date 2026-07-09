import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

/**
 * Content collections for the Porchlight docs.
 * Astro 5 "Content Layer" API: each collection loads its own glob of source
 * files and validates frontmatter with zod. Component/token/guide pages are
 * added in later PRs; the schemas here are the contract those pages must meet.
 */

const components = defineCollection({
  loader: glob({ pattern: "**/*.mdx", base: "./src/content/components" }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    kind: z.enum(["component", "pattern"]).default("component"),
    status: z.enum(["stable", "experimental", "planned"]).default("planned"),
    since: z.string().optional(),
  }),
});

const tokens = defineCollection({
  loader: glob({ pattern: "**/*.mdx", base: "./src/content/tokens" }),
  schema: z.object({
    title: z.string(),
    category: z.enum([
      "color",
      "type",
      "space",
      "radius",
      "motion",
      "elevation",
      "control",
    ]),
  }),
});

const guides = defineCollection({
  loader: glob({ pattern: "**/*.mdx", base: "./src/content/guides" }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    order: z.number().default(0),
  }),
});

export const collections = { components, tokens, guides };
