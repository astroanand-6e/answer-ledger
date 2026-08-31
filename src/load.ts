import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import type { Category, LoadedCategory, Run, Brand, Source, Correction } from "./types.ts";
import { SITE } from "./config.ts";

const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const UTC_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;

class DataError extends Error {
  constructor(file: string, msg: string) { super(`${file}: ${msg}`); }
}

const str = (file: string, v: unknown, field: string): string => {
  if (typeof v !== "string" || v.trim() === "") throw new DataError(file, `"${field}" is required and must be a non-empty string`);
  return v;
};

const normDomain = (url: string, file: string): string => {
  let h: string;
  try { h = new URL(url).hostname; } catch { throw new DataError(file, `source url is not a valid absolute URL: ${url}`); }
  return h.toLowerCase().replace(/^www\./, "");
};

function loadSource(file: string, raw: any): Source {
  const url = str(file, raw?.url, "source.url");
  return {
    url,
    domain: typeof raw.domain === "string" && raw.domain ? raw.domain.toLowerCase().replace(/^www\./, "") : normDomain(url, file),
    title: typeof raw.title === "string" && raw.title.trim() !== "" ? raw.title : null,
  };
}

/**
 * An editor's note is held to a HIGHER evidence bar than the answer it sits
 * beside. The model is allowed to have cited nothing; an editor is not. A
 * correction without sources is just a second opinion, so it fails the build.
 */
function loadCorrection(file: string, raw: any, brandName: string): Correction {
  const note = str(file, raw?.note, `brands["${brandName}"].correction.note`);
  const at = str(file, raw?.checkedAt, `brands["${brandName}"].correction.checkedAt`);
  if (!UTC_RE.test(at)) throw new DataError(file, `brands["${brandName}"].correction.checkedAt must be UTC "YYYY-MM-DDTHH:MM:SSZ", got "${at}"`);
  const sources: Source[] = Array.isArray(raw.sources) ? raw.sources.map((s: any) => loadSource(file, s)) : [];
  if (sources.length === 0) {
    throw new DataError(file, `brands["${brandName}"].correction must cite at least one source. An unsourced correction carries less authority than the answer it corrects.`);
  }
  return { note, checkedAt: at, sources };
}

function loadBrand(file: string, raw: any, i: number): Brand {
  const name = str(file, raw?.name, `brands[${i}].name`);
  return {
    name,
    rank: typeof raw.rank === "number" && raw.rank >= 1 ? raw.rank : i + 1,
    note: typeof raw.note === "string" ? raw.note : "",
    ...(typeof raw.pricing === "string" && raw.pricing.trim() ? { pricing: raw.pricing } : {}),
    ...(typeof raw.regret === "string" && raw.regret.trim() ? { regret: raw.regret } : {}),
    ...(typeof raw.caveat === "string" && raw.caveat.trim() ? { caveat: raw.caveat } : {}),
    sources: Array.isArray(raw.sources) ? raw.sources.map((s: any) => loadSource(file, s)) : [],
    ...(raw.correction ? { correction: loadCorrection(file, raw.correction, name) } : {}),
  };
}

/**
 * ENGINE HONESTY IS ENFORCED HERE. model, modelDisplay, prompt and a UTC
 * timestamp are hard requirements; a run missing any of them fails the build.
 * There is no default, no fallback and no placeholder. A page cannot be
 * produced that does not name what produced it.
 */
function loadRun(file: string, raw: any, i: number): Run {
  const at = str(file, raw?.ranAt, `runs[${i}].ranAt`);
  if (!UTC_RE.test(at)) throw new DataError(file, `runs[${i}].ranAt must be UTC "YYYY-MM-DDTHH:MM:SSZ", got "${at}"`);
  if (typeof raw.retrieval !== "boolean") throw new DataError(file, `runs[${i}].retrieval must be a boolean`);
  const brands: Brand[] = Array.isArray(raw.brands) ? raw.brands.map((b: any, j: number) => loadBrand(file, b, j)) : [];
  // DELIBERATE: this checks `b.sources` only — the sources the MODEL cited.
  // `b.correction.sources` are excluded on purpose. A correction is an editor's
  // note written later, by a retrieving human, and it is required to be
  // sourced. Widening this condition to include correction sources would make
  // every corrected brand on a retrieval:false run fail the build. Do not
  // "fix" it.
  if (!raw.retrieval && brands.some((b) => b.sources.length > 0)) {
    throw new DataError(file, `runs[${i}] declares retrieval:false but carries sources. A model without retrieval cannot cite. Fix one or the other.`);
  }
  const verdict = typeof raw.verdict === "string" && raw.verdict.trim() ? raw.verdict : undefined;
  // "No vendor qualifies" is a legitimate — and for several of our categories,
  // the expected — answer. It must never render as an empty, broken-looking
  // page, so we force the author to supply the bottom line instead.
  if (brands.length === 0 && !verdict) {
    throw new Error(`${file}: runs[${i}] names no brands, so "verdict" is required — say what the answer actually concluded (e.g. that nothing on the market satisfies the constraints).`);
  }
  const caveats = Array.isArray(raw.caveats)
    ? raw.caveats.map((c: any, j: number) => str(file, c, `runs[${i}].caveats[${j}]`))
    : [];
  return {
    engine: str(file, raw?.engine, `runs[${i}].engine`).toLowerCase(),
    model: str(file, raw?.model, `runs[${i}].model`),
    modelDisplay: str(file, raw?.modelDisplay, `runs[${i}].modelDisplay`),
    prompt: str(file, raw?.prompt, `runs[${i}].prompt`),
    ranAt: at,
    retrieval: raw.retrieval,
    answerExcerpt: str(file, raw?.answerExcerpt, `runs[${i}].answerExcerpt`),
    brands: brands.sort((a, b) => a.rank - b.rank || a.name.localeCompare(b.name)),
    ...(verdict ? { verdict } : {}),
    ...(caveats.length ? { caveats } : {}),
  };
}

function loadCategory(file: string, raw: any): Category {
  if (raw?.schemaVersion !== 1) throw new DataError(file, `schemaVersion must be 1`);
  const slug = str(file, raw?.slug, "slug");
  if (!SLUG_RE.test(slug)) throw new DataError(file, `slug "${slug}" must be lowercase-kebab-case`);
  if (`${slug}.json` !== file) throw new DataError(file, `slug "${slug}" must match the filename`);
  if (typeof raw.delisted !== "boolean") throw new DataError(file, `"delisted" must be a boolean (write false explicitly)`);
  if (!Array.isArray(raw.runs) || raw.runs.length === 0) throw new DataError(file, `"runs" must be a non-empty array`);
  return {
    schemaVersion: 1,
    slug,
    question: str(file, raw?.question, "question"),
    summary: str(file, raw?.summary, "summary"),
    delisted: raw.delisted,
    provisional: raw.provisional === true,
    runs: raw.runs.map((r: any, i: number) => loadRun(file, r, i)),
  };
}

export interface LoadResult {
  categories: LoadedCategory[];
  /** Slugs excluded because the owner asked to be delisted. */
  delistedSlugs: string[];
  /** Lowercased brand names / domains the owner asked us to remove. Exported
   *  so build.ts can assert none of them survived into the rendered bytes. */
  brandDelist: string[];
}

/** Marker left where a delisted name was removed from otherwise verbatim text.
 *  We redact rather than silently rewrite: an edited quote must look edited. */
export const REDACTION = "[removed at owner's request]";

const brandRe = (brand: string): RegExp =>
  new RegExp(`(^|[^\\w])(${brand.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})(?![\\w])`, "gi");

export function loadAll(dataDir: string): LoadResult {
  const brandDelistPath = join(dataDir, "delisted-brands.json");
  const brandDelist = new Set<string>(
    existsSync(brandDelistPath)
      ? (JSON.parse(readFileSync(brandDelistPath, "utf8")).brands ?? []).map((b: string) => b.toLowerCase().trim())
      : [],
  );

  const dir = join(dataDir, "categories");
  const files = readdirSync(dir).filter((f) => f.endsWith(".json")).sort();

  const categories: LoadedCategory[] = [];
  const delistedSlugs: string[] = [];

  for (const file of files) {
    const cat = loadCategory(file, JSON.parse(readFileSync(join(dir, file), "utf8")));
    if (cat.delisted) { delistedSlugs.push(cat.slug); continue; }

    let redactions = 0;
    for (const run of cat.runs) {
      const before = run.brands.length;
      run.brands = run.brands.filter((b) => !brandDelist.has(b.name.toLowerCase().trim()));
      redactions += before - run.brands.length;
      for (const b of run.brands) {
        b.sources = b.sources.filter((s) => !brandDelist.has(s.domain));
        // Delist beats editorial too: an editor's note may not be the loophole
        // that keeps a delisted domain on the page.
        if (b.correction) b.correction.sources = b.correction.sources.filter((s) => !brandDelist.has(s.domain));
      }
      // A delisted brand must also vanish from free prose, or the delist
      // promise is cosmetic. Redact visibly; never leave the name behind.
      for (const brand of brandDelist) {
        const re = brandRe(brand);
        const redact = (text: string): string => text.replace(re, (m, pre) => {
          redactions++;
          return `${pre}${REDACTION}`;
        });
        run.answerExcerpt = redact(run.answerExcerpt);
        if (run.verdict) run.verdict = redact(run.verdict);
        if (run.caveats) run.caveats = run.caveats.map(redact);
        for (const b of run.brands) {
          b.note = redact(b.note);
          if (b.pricing) b.pricing = redact(b.pricing);
          if (b.regret) b.regret = redact(b.regret);
          if (b.caveat) b.caveat = redact(b.caveat);
          if (b.correction) b.correction.note = redact(b.correction.note);
        }
      }
    }
    const lastmod = cat.runs.map((r) => r.ranAt).sort().at(-1)!;
    categories.push({ ...cat, redactions, lastmod });
  }

  if (categories.length > SITE.hardPageCap) {
    throw new Error(
      `HARD CAP: ${categories.length} categories exceeds the ${SITE.hardPageCap}-page cap set by the Cycle 4 ruling. ` +
      `Page 101 is not authorised before the Traffic Gate is read. Build refused.`,
    );
  }

  categories.sort((a, b) => a.slug.localeCompare(b.slug));
  delistedSlugs.sort();
  return { categories, delistedSlugs, brandDelist: [...brandDelist].sort() };
}
