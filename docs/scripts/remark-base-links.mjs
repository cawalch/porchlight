/**
 * Prefix root-relative Markdown links with the Astro base path.
 *
 * MDX list items containing multi-line JSX <a> elements are treated as block
 * content, which splits the link from its description. Ordinary Markdown links
 * stay inline, so rewrite them at build time instead of hand-writing base-aware
 * JSX in prose.
 */
export default function remarkBaseLinks({ base = "/" } = {}) {
  const prefix = base.replace(/\/$/, "");
  const walk = (node) => {
    if (!node || typeof node !== "object") return;
    if (
      node.type === "link" &&
      typeof node.url === "string" &&
      node.url.startsWith("/") &&
      !node.url.startsWith("//")
    ) {
      node.url = `${prefix}${node.url}`;
    }
    if (Array.isArray(node.children)) {
      for (const child of node.children) walk(child);
    }
  };

  return (tree) => walk(tree);
}
