/** Source cited by the assistant for a given brand. */
export interface Source {
  /** Absolute URL as the assistant gave it. */
  url: string;
  /** Hostname, lowercased, no leading www. Derived if omitted at load time. */
  domain: string;
  /** Page title, or null if we do not have one. Never invented. */
  title: string | null;
}

/**
 * An editor's note attached to a brand after the fact. See `Brand.correction`.
 */
export interface Correction {
  /** What actually happened, in the editor's voice. Past tense, factual. */
  note: string;
  /** UTC instant the check was performed. Same "...Z" format as Run.ranAt. */
  checkedAt: string;
  /** Evidence. REQUIRED and must be non-empty — an unsourced correction is
   *  just a second opinion, and carries less authority than the answer it
   *  corrects. */
  sources: Source[];
}

/**
 * One named recommendation in one run, in the order the assistant named it.
 * "Brand" is loose: it may be a commercial vendor, an open-source project, or
 * "run it yourself on a VPS". The honest answer to several of our categories
 * names no vendor at all, and that must render as a normal page.
 */
export interface Brand {
  /** Display name, as the assistant wrote it. */
  name: string;
  /** 1-based position in the assistant's ordering. */
  rank: number;
  /** Verbatim or near-verbatim one-line justification from the answer. */
  note: string;
  /** Pricing model exactly as the assistant described it. Optional. */
  pricing?: string;
  /** "The one thing most likely to make me regret choosing it." Optional. */
  regret?: string;
  /**
   * The assistant's own stated uncertainty about THIS item — that it may no
   * longer exist, that pricing may have moved, that it is unsure. RENDERED
   * VISIBLY, never dropped. This is the one claim a vendor listicle cannot
   * make, so it is treated as content, not as an apology.
   */
  caveat?: string;
  /** Sources the assistant cited for this brand. Empty array is legal and
   *  is rendered honestly as "cited no sources". Never pad this. */
  sources: Source[];
  /**
   * EDITORIAL, NOT THE ASSISTANT'S VOICE. A dated, sourced note added by a
   * human/verification pass after the run, recording that the world moved:
   * the product was renamed, archived, acquired, or relicensed.
   *
   * This is the one field on the page that is NOT part of the record of what
   * the model said. It exists because the ledger must stay verbatim AND must
   * not send a reader to an archived repo. It is rendered in a visually
   * distinct block, labelled as an editor's note with its own check date, and
   * it is never allowed to read as though the assistant said it.
   *
   * Unlike the run, a correction IS retrieved, so it carries real sources and
   * is deliberately exempt from the retrieval:false => no-sources rule.
   */
  correction?: Correction;
}

/**
 * One (engine x prompt) execution. `runs` is an ARRAY so that adding a second
 * engine later is an append to data, never a rewrite of templates or of the
 * other 99 files. This is the "per-engine column reserved from commit one".
 */
export interface Run {
  /** Short engine key. Free text, but keep it stable: "claude", "openai", ... */
  engine: string;
  /** EXACT model id as invoked. Required. Build fails if absent or empty. */
  model: string;
  /** Human-facing model name, e.g. "Claude Opus 5 (Anthropic)". Required. */
  modelDisplay: string;
  /** The VERBATIM prompt sent. Required. Rendered on the page as-is. */
  prompt: string;
  /** UTC instant of the run. Must end in "Z". Required. */
  ranAt: string;
  /** Whether the assistant had live web/retrieval access during this run.
   *  false => sources are expected to be empty and the page says so. */
  retrieval: boolean;
  /** Verbatim opening of the answer. Not a paraphrase. */
  answerExcerpt: string;
  /**
   * Named recommendations, in the assistant's order. MAY BE EMPTY: several
   * categories are built with constraints that disqualify every vendor, and
   * "self-host and pay nobody" is a correct answer. When this is empty,
   * `verdict` is required so the page reads as a finding rather than a fault.
   */
  brands: Brand[];
  /**
   * The bottom line of the answer in one or two sentences. Required when
   * `brands` is empty; optional otherwise. This is what carries a
   * "no vendor qualifies" entry.
   */
  verdict?: string;
  /**
   * Run-level uncertainty the assistant stated for the answer as a whole
   * (stale pricing, products it is unsure still exist, refusals to guess).
   * Rendered as its own visible block. Never summarised away.
   */
  caveats?: string[];
}

export interface Category {
  schemaVersion: 1;
  /** URL slug. Must match ^[a-z0-9]+(-[a-z0-9]+)*$ and equal the filename. */
  slug: string;
  /** The human, category-keyed question. NEVER brand-keyed. */
  question: string;
  /** One-sentence description used in <meta name="description">. */
  summary: string;
  /** Owner asked for removal. true => no page, no sitemap row, no md mirror. */
  delisted: boolean;
  /** Scaffold-era placeholder vertical; renders a "provisional" banner. */
  provisional?: boolean;
  runs: Run[];
}

/** A category as it exists after delist filtering, ready to render. */
export interface LoadedCategory extends Category {
  /** Count of brand entries stripped by the brand delist list. Rendered as a
   *  neutral completeness notice. The removed names are never shown. */
  redactions: number;
  /** Newest ranAt across runs, ISO Z. Used for sitemap lastmod. */
  lastmod: string;
}
