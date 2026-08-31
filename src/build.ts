#!/usr/bin/env node
/**
 * Answer Ledger static site generator.
 *
 * Reads data/categories/*.json, writes docs/ (GitHub Pages source) and
 * answers/*.md (github.com crawl mirror). No framework, no bundler, no
 * dependencies. Deterministic: nothing in the output is derived from the
 * build clock, the filesystem order or the environment, so running this
 * twice on unchanged data produces a byte-identical tree.
 *
 *   npm run build    write the site
 *   npm run check    build in memory and fail if the committed site differs
 */
import { readdirSync, readFileSync, writeFileSync, mkdirSync, rmSync, statSync, existsSync } from "node:fs";
import { join, dirname, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

import { loadAll } from "./load.ts";
import { renderCategory, categoryPath } from "./render/category.ts";
import { renderHome } from "./render/home.ts";
import { renderMethod } from "./render/method.ts";
import { renderMarkdown } from "./render/markdown.ts";
import { renderPage } from "./render/shell.ts";
import { SITE, CANONICAL_ORIGIN, BASE_PATH, canonical, href, ENGINE_NAME_DENYLIST, INDEXNOW_KEY } from "./config.ts";
import { esc } from "./html.ts";
import type { LoadedCategory } from "./types.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "docs");        // GitHub Pages: branch main, folder /docs
const MD_OUT = join(ROOT, "answers");  // markdown mirror, crawled on github.com
/** Files under docs/ the generator does not own and must never delete. */
const PRESERVE = new Set(["CNAME"]);

type Tree = Map<string, string>; // repo-relative posix path -> contents

// ---------------------------------------------------------------------------
// guards
// ---------------------------------------------------------------------------

/**
 * ONE-WAY DOOR: pages are category-keyed, never brand-keyed. A title or meta
 * description that names a brand in the entry is a hard build failure, not a
 * style note. This is the rule that keeps us out of the reputation-extortion
 * business, so it is enforced by the compiler of the site, not by a reviewer.
 */
function assertNotBrandKeyed(cat: LoadedCategory, html: string): void {
  const title = /<title>([^<]*)<\/title>/.exec(html)?.[1] ?? "";
  const desc = /<meta name="description" content="([^"]*)"/.exec(html)?.[1] ?? "";
  const brands = new Set(cat.runs.flatMap((r) => r.brands.map((b) => b.name)));
  for (const brand of brands) {
    const re = new RegExp(`(^|[^\\w])${brand.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^\\w]|$)`, "i");
    for (const [field, value] of [["title", title], ["meta description", desc]] as const) {
      if (re.test(value)) {
        throw new Error(
          `BRAND-KEYED ${field.toUpperCase()} in /answers/${cat.slug}/: "${value}" names the brand "${brand}". ` +
          `Titles and descriptions must describe the category question only. Rewrite "question"/"summary" in data/categories/${cat.slug}.json.`,
        );
      }
    }
  }
}

/**
 * ENGINE HONESTY, enforced against the rendered bytes. If an answer page
 * contains the name of an assistant that no run on that page declares, the
 * build dies. This makes "we said ChatGPT for output that was not ChatGPT"
 * structurally impossible rather than merely discouraged.
 */
function assertEngineHonesty(cat: LoadedCategory, html: string): void {
  const declared = cat.runs
    .flatMap((r) => [r.engine, r.model, r.modelDisplay])
    .join(" ")
    .toLowerCase();
  const hay = html.toLowerCase();
  for (const name of ENGINE_NAME_DENYLIST) {
    if (hay.includes(name) && !declared.includes(name)) {
      throw new Error(
        `ENGINE HONESTY VIOLATION in /answers/${cat.slug}/: the page contains "${name}" but no run on it declares that engine. ` +
        `Never print the name of an assistant that did not produce the answer.`,
      );
    }
  }
}

/**
 * DELIST IS A PROMISE, NOT A GESTURE. If a name on the delist list survives
 * anywhere in the rendered bytes of any page, the build dies. This is the only
 * enforcement that actually holds, because it checks output, not intent.
 */
function assertDelisted(path: string, html: string, brandDelist: string[]): void {
  const hay = html.toLowerCase();
  for (const brand of brandDelist) {
    const re = new RegExp(`(^|[^\\w])${brand.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![\\w])`);
    if (re.test(hay)) {
      throw new Error(
        `DELIST VIOLATION in ${path}: "${brand}" is on the delist list but still appears in the rendered page. ` +
        `Redact it from the source data. We do not ship a page that names someone who asked to be removed.`,
      );
    }
  }
}

/** Cheap well-formedness check: tags balance, no stray unescaped angle brackets. */
function assertWellFormed(path: string, html: string): void {
  const VOID = new Set(["area","base","br","col","embed","hr","img","input","link","meta","source","track","wbr","!doctype"]);
  const stack: string[] = [];
  const re = /<(\/?)([a-zA-Z!][a-zA-Z0-9-]*)\b[^>]*?(\/?)>/g;
  let m: RegExpExecArray | null;
  // ignore contents of script/style, which legitimately contain angle brackets
  const scrubbed = html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "<script></script>")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "<style></style>");
  while ((m = re.exec(scrubbed))) {
    const [, close, rawTag, selfClose] = m;
    const tag = rawTag!.toLowerCase();
    if (VOID.has(tag) || selfClose === "/") continue;
    if (close === "/") {
      const open = stack.pop();
      if (open !== tag) throw new Error(`MALFORMED HTML ${path}: </${tag}> closes <${open ?? "nothing"}>`);
    } else {
      stack.push(tag);
    }
  }
  if (stack.length) throw new Error(`MALFORMED HTML ${path}: unclosed <${stack.join(">, <")}>`);
  for (const json of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try { JSON.parse(json[1]!); } catch (e) { throw new Error(`INVALID JSON-LD in ${path}: ${(e as Error).message}`); }
  }
}

// ---------------------------------------------------------------------------
// build
// ---------------------------------------------------------------------------

function render404(): string {
  return renderPage({
    path: "/404.html",
    title: `Not found | ${SITE.name}`,
    description: "That page is not in the record.",
    body: `<p class="kicker">404</p>
<h1>That page is not in the record.</h1>
<p class="lede">It may never have existed, or it may have been removed at the owner&#39;s request &mdash; we honour delist requests by deleting the page, not by hiding it.</p>
<p><a href="${href("/")}">Go to the index &rarr;</a></p>`,
  });
}

function buildTree(): { tree: Tree; cats: LoadedCategory[]; delisted: string[] } {
  const { categories, delistedSlugs, brandDelist } = loadAll(join(ROOT, "data"));
  const tree: Tree = new Map();

  const indexed = categories.filter((c) => SITE.includeProvisionalInSitemap || !c.provisional);

  for (const cat of categories) {
    const html = renderCategory(cat);
    const path = `docs/answers/${cat.slug}/index.html`;
    assertNotBrandKeyed(cat, html);
    assertEngineHonesty(cat, html);
    assertWellFormed(path, html);
    assertDelisted(path, html, brandDelist);
    tree.set(path, html);
    tree.set(`answers/${cat.slug}.md`, renderMarkdown(cat));
  }

  const home = renderHome(categories);
  assertWellFormed("docs/index.html", home);
  assertDelisted("docs/index.html", home, brandDelist);
  tree.set("docs/index.html", home);

  const method = renderMethod(categories);
  assertWellFormed("docs/method/index.html", method);
  tree.set("docs/method/index.html", method);

  const notFound = render404();
  assertWellFormed("docs/404.html", notFound);
  tree.set("docs/404.html", notFound);

  // sitemap: index + method + every non-delisted, indexable answer page
  const urls = [
    { loc: canonical("/"), lastmod: indexed.map((c) => c.lastmod).sort().at(-1) ?? null, priority: "1.0" },
    { loc: canonical("/method/"), lastmod: null, priority: "0.5" },
    ...indexed.map((c) => ({ loc: canonical(categoryPath(c.slug)), lastmod: c.lastmod, priority: "0.8" })),
  ];
  tree.set("docs/sitemap.xml",
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls.map((u) =>
      `  <url>\n    <loc>${esc(u.loc)}</loc>\n` +
      (u.lastmod ? `    <lastmod>${u.lastmod.slice(0, 10)}</lastmod>\n` : "") +
      `    <priority>${u.priority}</priority>\n  </url>\n`).join("") +
    `</urlset>\n`);

  tree.set("docs/robots.txt",
    `User-agent: *\nAllow: /\n\nSitemap: ${canonical("/sitemap.xml")}\n`);

  // IndexNow key file. Served publicly by design; see INDEXNOW_KEY in config.ts.
  // Body must be the key and nothing else — a trailing newline is tolerated by
  // the spec's reference implementations, but we emit the bare key so that a
  // byte-exact `curl | diff` check in scripts/indexnow-submit.sh is meaningful.
  tree.set(`docs/${INDEXNOW_KEY}.txt`, INDEXNOW_KEY);

  // Pages must not run Jekyll over generated output.
  tree.set("docs/.nojekyll", "");

  return { tree, cats: categories, delisted: delistedSlugs };
}

// ---------------------------------------------------------------------------
// io
// ---------------------------------------------------------------------------

function walk(dir: string, base: string, acc: string[] = []): string[] {
  if (!existsSync(dir)) return acc;
  for (const name of readdirSync(dir).sort()) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, base, acc);
    else acc.push(relative(base, p).split(sep).join("/"));
  }
  return acc;
}

function existingFiles(): string[] {
  return [...walk(OUT, ROOT), ...walk(MD_OUT, ROOT)].sort();
}

function writeTree(tree: Tree): { written: number; deleted: number } {
  let written = 0, deleted = 0;
  for (const stale of existingFiles()) {
    if (tree.has(stale)) continue;
    if (PRESERVE.has(stale.split("/").pop()!)) continue;
    rmSync(join(ROOT, stale));
    deleted++;
  }
  for (const [p, content] of [...tree].sort(([a], [b]) => a.localeCompare(b))) {
    const abs = join(ROOT, p);
    if (existsSync(abs) && readFileSync(abs, "utf8") === content) continue;
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, content, "utf8");
    written++;
  }
  // prune empty dirs left behind by deleted categories
  for (const root of [OUT, MD_OUT]) {
    if (!existsSync(root)) continue;
    for (const name of readdirSync(root)) {
      const p = join(root, name);
      if (statSync(p).isDirectory() && walk(p, ROOT).length === 0) rmSync(p, { recursive: true });
    }
    const answersDir = join(root, "answers");
    if (existsSync(answersDir)) {
      for (const name of readdirSync(answersDir)) {
        const p = join(answersDir, name);
        if (statSync(p).isDirectory() && walk(p, ROOT).length === 0) rmSync(p, { recursive: true });
      }
    }
  }
  return { written, deleted };
}

function checkTree(tree: Tree): string[] {
  const diffs: string[] = [];
  for (const [p, content] of tree) {
    const abs = join(ROOT, p);
    if (!existsSync(abs)) diffs.push(`missing: ${p}`);
    else if (readFileSync(abs, "utf8") !== content) diffs.push(`stale:   ${p}`);
  }
  for (const p of existingFiles()) {
    if (!tree.has(p) && !PRESERVE.has(p.split("/").pop()!)) diffs.push(`orphan:  ${p}`);
  }
  return diffs.sort();
}

// ---------------------------------------------------------------------------

function main(): void {
  const check = process.argv.includes("--check");
  const { tree, cats, delisted } = buildTree();
  const indexedCount = [...tree.keys()].filter((p) => p.startsWith("docs/answers/")).length;

  if (check) {
    const diffs = checkTree(tree);
    if (diffs.length) {
      console.error(`answer-ledger: committed site is OUT OF DATE with data/ (${diffs.length} file(s)):`);
      for (const d of diffs) console.error(`  ${d}`);
      console.error(`\nRun \`npm run build\` and commit the result.`);
      process.exit(1);
    }
    console.log(`answer-ledger: site is up to date (${indexedCount} answer pages).`);
    return;
  }

  const { written, deleted } = writeTree(tree);
  const sitemapUrls = (tree.get("docs/sitemap.xml")!.match(/<loc>/g) ?? []).length;
  console.log(
    `answer-ledger: ${cats.length} categories -> ${indexedCount} answer pages, ` +
    `${sitemapUrls} sitemap urls, ${delisted.length} delisted (${delisted.join(", ") || "none"}).`,
  );
  console.log(`answer-ledger: ${written} file(s) written, ${deleted} removed. Canonical: ${CANONICAL_ORIGIN}${BASE_PATH}/`);
}

main();
