/**
 * Token parser — turns the raw primitive-token CSS into a structured doc.
 *
 * Invoked at build time by the tokens reference page (the CSS is imported with
 * Vite's `?raw` suffix, so this always reflects the current source — no
 * hand-written token tables to drift).
 */
export interface Token {
  name: string;
  value: string;
}

export interface TokenGroup {
  name: string;
  tokens: Token[];
}

export interface RegisteredProp {
  name: string;
  syntax: string;
  inherits: boolean;
  initialValue: string;
}

export interface TokenDoc {
  registered: RegisteredProp[];
  groups: TokenGroup[];
}

function compact(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

/** Parse primitive tokens from the 02-tokens.css source text. */
export function parseTokens(css: string): TokenDoc {
  // 1) Registered properties: @property --pl-x { syntax; inherits; initial-value; }
  const registered: RegisteredProp[] = [];
  const propRe = /@property\s+(--pl-[\w-]+)\s*\{([^}]*)\}/g;
  let m: RegExpExecArray | null;
  while ((m = propRe.exec(css)) !== null) {
    const body = m[2];
    registered.push({
      name: m[1],
      syntax: compact(body.match(/syntax:\s*"?([^;"]+)"?;/)?.[1] ?? ""),
      inherits: /inherits:\s*true/.test(body),
      initialValue: compact(body.match(/initial-value:\s*([^;]+);/)?.[1] ?? ""),
    });
  }

  // 2) :root declarations, grouped by the nearest preceding /* Section */ comment.
  const root = css.match(/:root\s*\{([\s\S]*?)\n\s*\}/)?.[1] ?? "";
  const marks: { idx: number; section: string }[] = [];
  const commentRe = /\/\*\s*([^*\n]+?)\s*\*\//g;
  let c: RegExpExecArray | null;
  while ((c = commentRe.exec(root)) !== null) {
    marks.push({ idx: c.index, section: c[1].trim() });
  }

  const groups: TokenGroup[] = [];
  const declRe = /(--pl-[\w-]+)\s*:\s*([\s\S]*?);/g;
  let d: RegExpExecArray | null;
  while ((d = declRe.exec(root)) !== null) {
    let section = "Other";
    for (const mk of marks) {
      if (mk.idx < d.index) section = mk.section;
      else break;
    }
    let group = groups.find((g) => g.name === section);
    if (!group) {
      group = { name: section, tokens: [] };
      groups.push(group);
    }
    group.tokens.push({ name: d[1], value: compact(d[2]) });
  }

  return { registered, groups };
}

/**
 * Heuristic for whether a token value is a color we can render as a swatch.
 * Shadows begin with a numeric offset, so they are correctly excluded.
 */
export function isColorValue(value: string): boolean {
  return /^(oklch|#|rgb|hsl|light-dark|color-mix|canvas|highlight|transparent|white|black)\b/i.test(
    value,
  );
}
