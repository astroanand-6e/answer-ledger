/**
 * The ONLY place the canonical host appears.
 *
 * GitHub Pages accepts a custom domain on the same site, preserving every URL
 * path. When we own a domain, change CANONICAL_ORIGIN here, add
 * `docs/CNAME`, rebuild, commit. Nothing else moves. Every internal link in
 * this site is root-relative precisely so that this is a one-line change.
 */
export const CANONICAL_ORIGIN = "https://astroanand-6e.github.io";

/**
 * Path prefix the site is served under. A GitHub Pages *project* site lives at
 * `<owner>.github.io/<repo>/`, so it needs a prefix; a custom domain (or a
 * user/org Pages site) is served at the root, so it needs "".
 *
 * ATTACHING A CUSTOM DOMAIN LATER: set CANONICAL_ORIGIN to the new host, set
 * BASE_PATH to "", add `docs/CNAME`, `npm run build`, commit. Every path below
 * BASE_PATH is preserved verbatim, which is the entire reason this is a
 * two-way door. Do not hardcode either value anywhere else.
 */
export const BASE_PATH = "/answer-ledger";

/** Root-relative href for an in-site path. Always use this, never a literal. */
export const href = (path: string): string => {
  if (!path.startsWith("/")) throw new Error(`href() needs an absolute path, got ${path}`);
  return `${BASE_PATH}${path}`;
};

/** Absolute canonical URL for an in-site path. Sitemap + <link rel=canonical>. */
export const canonical = (path: string): string => `${CANONICAL_ORIGIN}${href(path)}`;

/** Site identity. Copy lives here, not scattered through templates. */
export const SITE = {
  name: "Answer Ledger",
  /**
   * POSITIONING SENTENCE — verbatim from docs/research/cycle4-corpus-vertical.md.
   * It passed the Differentiation Sentence Test. Do not paraphrase it, do not
   * shorten it, and note "an AI assistant", SINGULAR: we run one engine, and
   * "AI assistants" / "leading AI models" would be an overclaim. If a second
   * engine is ever added, this sentence changes at the same commit and not
   * one commit earlier.
   */
  positioning:
    "Answer Ledger is a dated, permanent public record of what an AI assistant answers when a buyer asks it to recommend software \u2014 every page prints the exact prompt, the model that answered, and the timestamp, and nothing here is for sale to the vendors it names.",
  tagline: "A dated, permanent public record of what an AI assistant answers when a buyer asks it to recommend software.",
  /** One vertical. One. See HARD_PAGE_CAP. */
  vertical: "Developer and SaaS infrastructure tooling, bought by small bootstrapped teams",
  /** Mid-sentence form. Do NOT .toLowerCase() `vertical` — it eats "SaaS". */
  verticalMidSentence: "developer and SaaS infrastructure tooling, bought by small bootstrapped teams",
  /** CEO ruling, cycle 4: 100 pages, one vertical, then stop and read the meter. */
  hardPageCap: 100,
  /** research-thompson delivered 20, ordered best-first. Build for 100, expect 20. */
  expectedCategories: 20,
  /** Repo used by the delist + request-a-category issue links. */
  repo: "astroanand-6e/answer-ledger",
  /** Provisional (scaffold-era) entries still get a sitemap row. Flip to false
   *  the moment the real vertical lands if you want them out of the index. */
  includeProvisionalInSitemap: true,
} as const;

export const issueUrl = (template: string, title: string): string =>
  `https://github.com/${SITE.repo}/issues/new?template=${template}&title=${encodeURIComponent(title)}`;

/**
 * Engine names that must never appear in a generated answer page unless a run
 * on that page actually declares them. This is the structural guard against
 * ever printing "ChatGPT" over output that did not come from ChatGPT.
 * Enforced in build.ts against the final rendered HTML, not against source.
 */
export const ENGINE_NAME_DENYLIST = [
  "chatgpt", "openai", "gpt-4", "gpt-5", "gemini", "perplexity",
  "copilot", "grok", "llama", "mistral", "deepseek",
] as const;
