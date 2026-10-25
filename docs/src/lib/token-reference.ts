import tokensCss from "@cawalch/porchlight/src/02-tokens.css?raw";
import themesCss from "@cawalch/porchlight/src/03-themes.css?raw";
import { parseTokens } from "./tokens";

export const tokenDocument = parseTokens(tokensCss);
export const referenceTokens = tokenDocument.groups.flatMap(
  (group) => group.tokens,
);
const defaults = Object.fromEntries(
  referenceTokens.map((token) => [token.name, token.value]),
);

export const densityPresets = [
  ...themesCss.matchAll(
    /:where\(\[data-pl-density="(\w+)"\]\)\s*\{([\s\S]*?)\n\s*\}/g,
  ),
].map((match) => {
  const values = Object.fromEntries(
    [...match[2].matchAll(/(--pl-[\w-]+)\s*:\s*([^;]+);/g)].map(
      (declaration) => [declaration[1], declaration[2].trim()],
    ),
  );
  return { name: match[1], values: { ...defaults, ...values } };
});
