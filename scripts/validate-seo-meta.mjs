#!/usr/bin/env node
/**
 * Static SEO validator for TanStack Start route files.
 *
 * Checks (per public/shareable route):
 *   - head() defines a <title> meta entry
 *   - head() defines a description meta entry
 *   - head() defines og:title and og:description
 *   - head() defines a canonical link (leaf routes only)
 *   - canonical / og:url use the canonical production origin
 *
 * Also validates JSON-LD blocks (scripts entries with type
 * "application/ld+json") parse as JSON and include @context + @type.
 *
 * Exits non-zero on failure so it can gate build / deploy.
 *
 *   node scripts/validate-seo-meta.mjs
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const ROUTES_DIR = join(ROOT, "src", "routes");
const CANONICAL_ORIGIN = "https://ambassador-melody-cloud.lovable.app";

// Routes that don't need full SEO metadata (private/auth/admin pages).
const NON_INDEXABLE = new Set([
  "admin.tsx",
  "dashboard.tsx",
  "my-uploads.tsx",
  "private-gallery.tsx",
  "profile.tsx",
  "upload.tsx",
  "login.tsx",
  "register.tsx",
]);

// Files that aren't page routes (server routes, layouts, etc.).
const SKIP = new Set(["__root.tsx", "sitemap[.]xml.ts"]);

const errors = [];
const warnings = [];

function listRouteFiles(dir) {
  return readdirSync(dir)
    .filter((f) => /\.(tsx|ts)$/.test(f))
    .map((f) => join(dir, f))
    .filter((p) => statSync(p).isFile());
}

function extractHeadBlock(src) {
  const idx = src.indexOf("head:");
  if (idx === -1) return null;
  // Walk braces from the first '{' after head:
  let i = src.indexOf("{", idx);
  if (i === -1) return null;
  let depth = 0;
  const start = i;
  for (; i < src.length; i++) {
    const ch = src[i];
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return src.slice(start, i + 1);
    }
  }
  return null;
}

function validateRoute(filePath) {
  const name = relative(ROOT, filePath);
  const src = readFileSync(filePath, "utf8");
  const base = filePath.split("/").pop();

  if (NON_INDEXABLE.has(base)) return; // not part of SEO surface

  const head = extractHeadBlock(src);
  if (!head) {
    errors.push(`${name}: missing head() definition`);
    return;
  }

  const checks = [
    { name: "title", re: /\btitle\s*:/ },
    { name: "description", re: /name:\s*["']description["']/ },
    { name: "og:title", re: /property:\s*["']og:title["']/ },
    { name: "og:description", re: /property:\s*["']og:description["']/ },
    { name: "og:url", re: /property:\s*["']og:url["']/ },
    { name: "canonical link", re: /rel:\s*["']canonical["']/ },
  ];
  for (const c of checks) {
    if (!c.re.test(head)) errors.push(`${name}: missing ${c.name}`);
  }

  // Origin consistency on canonical / og:url
  const urlMatches = head.match(/https?:\/\/[^"'`\s]+/g) ?? [];
  for (const u of urlMatches) {
    if (!u.startsWith(CANONICAL_ORIGIN)) {
      warnings.push(`${name}: non-canonical URL "${u}" (expected ${CANONICAL_ORIGIN})`);
    }
  }
}

function validateJsonLd(filePath) {
  const name = relative(ROOT, filePath);
  const src = readFileSync(filePath, "utf8");
  const re = /type:\s*["']application\/ld\+json["'][\s\S]*?children:\s*JSON\.stringify\(([\s\S]*?)\)\s*,?\s*}/g;
  let m;
  let count = 0;
  while ((m = re.exec(src)) !== null) {
    count++;
    const expr = m[1].trim();
    // Best-effort: try to eval the literal via Function. Safe-ish: only object/array literals.
    try {
      // Strip trailing commas that JSON.stringify accepts as JS but not JSON.
      const cleaned = expr.replace(/,(\s*[}\]])/g, "$1");
      const value = new Function(`return (${cleaned});`)();
      const graph = Array.isArray(value?.["@graph"]) ? value["@graph"] : [value];
      for (const node of graph) {
        if (!node || typeof node !== "object") {
          errors.push(`${name}: JSON-LD entry is not an object`);
          continue;
        }
        if (!value["@context"] && !node["@context"]) {
          errors.push(`${name}: JSON-LD missing @context`);
        }
        if (!node["@type"]) {
          errors.push(`${name}: JSON-LD entry missing @type`);
        }
      }
    } catch (e) {
      errors.push(`${name}: JSON-LD failed to parse — ${e.message}`);
    }
  }
  return count;
}

const files = listRouteFiles(ROUTES_DIR);
let jsonLdBlocks = 0;
for (const f of files) {
  const base = f.split("/").pop();
  if (!SKIP.has(base)) validateRoute(f);
  jsonLdBlocks += validateJsonLd(f);
}

console.log(`Scanned ${files.length} route files; validated ${jsonLdBlocks} JSON-LD block(s).`);

if (warnings.length) {
  console.warn("\nWarnings:");
  for (const w of warnings) console.warn(`  ⚠ ${w}`);
}

if (errors.length) {
  console.error("\nSEO validation failed:");
  for (const e of errors) console.error(`  ✗ ${e}`);
  console.error(`\n${errors.length} error(s).`);
  process.exit(1);
}

console.log("\n✓ SEO meta + JSON-LD validation passed.");
