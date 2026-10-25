import type { APIRoute } from "astro";
import { getCollection, render } from "astro:content";
import { referenceTokens } from "../lib/token-reference";

export const GET: APIRoute = async () => {
  const base = import.meta.env.BASE_URL;
  const collections = await Promise.all(
    ["guides", "components", "tokens"].map(async (collection) => {
      const entries = await getCollection(
        collection as "guides" | "components" | "tokens",
      );
      return Promise.all(
        entries.map(async (entry) => {
          const { headings } = await render(entry);
          const route = `${base}${collection}/${entry.id}`;
          const sections = [
            {
              title: entry.data.title,
              href: route,
              text: "",
              kind: collection,
            },
          ];
          let section = sections[0];
          let fenced = false;
          let headingIndex = 0;
          for (const line of (entry.body ?? "").split("\n")) {
            if (line.trimStart().startsWith("import ")) continue;
            if (/^\s*(```|~~~)/.test(line)) fenced = !fenced;
            if (!fenced && /^#{2,3}\s/.test(line)) {
              const heading = headings.filter(
                (h) => h.depth === 2 || h.depth === 3,
              )[headingIndex++];
              if (heading) {
                section = {
                  title: `${entry.data.title} — ${heading.text}`,
                  href: `${route}#${heading.slug}`,
                  text: "",
                  kind: collection,
                };
                sections.push(section);
              }
            }
            section.text += ` ${line}`;
          }
          return sections.map((item) => ({
            ...item,
            text: item.text.replace(/\s+/g, " ").trim(),
          }));
        }),
      );
    }),
  );
  const tokenEntries = referenceTokens.map((token) => {
    const page = /^--pl-(brand|color|focus)-/.test(token.name)
      ? "color"
      : /^--pl-(font|text|leading)-/.test(token.name)
        ? "typography"
        : "spacing";
    return {
      title: token.name,
      text: token.value,
      href: `${base}tokens/${page}`,
      kind: "Token",
    };
  });
  return new Response(
    JSON.stringify([
      {
        title: "Guides",
        text: "Install, theme, and compose Porchlight.",
        href: `${base}guides`,
        kind: "Overview",
      },
      {
        title: "Components",
        text: "Browse controls, surfaces, and application patterns.",
        href: `${base}components`,
        kind: "Overview",
      },
      {
        title: "Token reference",
        text: "Color, typography, spacing, and motion values.",
        href: `${base}tokens`,
        kind: "Overview",
      },
      ...collections.flat(2),
      ...tokenEntries,
    ]),
    { headers: { "Content-Type": "application/json" } },
  );
};
