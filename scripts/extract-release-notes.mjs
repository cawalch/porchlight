#!/usr/bin/env node
import fs from "node:fs";

const tag = process.argv[2] || process.env.GITHUB_REF_NAME || "";
const version = tag.replace(/^v/, "");

if (!version) {
  console.error("Error: version tag argument or GITHUB_REF_NAME required");
  process.exit(1);
}

const changelog = fs.readFileSync("CHANGELOG.md", "utf8");
const header = `## [${version}]`;
const startIndex = changelog.indexOf(header);

if (startIndex === -1) {
  console.error(`Error: Version ${version} header not found in CHANGELOG.md`);
  process.exit(1);
}

const contentAfter = changelog.slice(startIndex + header.length);
const endOfFirstLine = contentAfter.indexOf("\n");
const nextHeaderIndex = contentAfter.indexOf("\n## [");
const notes = contentAfter
  .slice(
    endOfFirstLine + 1,
    nextHeaderIndex !== -1 ? nextHeaderIndex : undefined,
  )
  .trim();

if (!notes) {
  console.error(`Warning: No notes found under ${header} in CHANGELOG.md`);
  process.exit(1);
}

process.stdout.write(`${notes}\n`);
