#!/usr/bin/env node
// check-citations.mjs — mechanise the reading that caught Cycle 8's four defects.
//
// Specification: docs/qa/cycle8-correction-sourcing.md, section
// "The check I propose — scripts/check-citations.mjs", steps 1-6. Written by qa-bach.
//
// Zero runtime dependencies: node: builtins only, Node >= 22.
//
//   node scripts/check-citations.mjs --refresh     # step 1 fetches, then all steps
//   node scripts/check-citations.mjs               # offline, against the committed cache
//   node scripts/check-citations.mjs --steps=4,6   # the two offline steps, for the build path
//
// Exit 0 only when every step passes. Any FAIL or UNVERIFIED result exits 1
// (pass --allow-unverified to tolerate lookups that failed for network reasons).

import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
// Overridable so the check itself can be tested against fixtures without ever
// editing data/, docs/ or the committed cache.
const DATA_DIR = process.env.AL_DATA_DIR ? resolve(process.env.AL_DATA_DIR) : join(ROOT, "data", "categories");
const EVIDENCE_DIR = process.env.AL_EVIDENCE_DIR ? resolve(process.env.AL_EVIDENCE_DIR) : join(ROOT, "metrics", "evidence");
const MARKETING_DIR = process.env.AL_MARKETING_DIR ? resolve(process.env.AL_MARKETING_DIR) : resolve(ROOT, "..", "..", "docs", "marketing");

const UA = "answer-ledger-citation-check/1 (+https://github.com/astroanand-6e/answer-ledger)";
const FETCH_TIMEOUT_MS = 25_000;
const MAX_TEXT = 300_000;
const FETCH_FRESH_DAYS = 90;
const PUBLISHED_FRESH_DAYS = 180;

// ---------------------------------------------------------------------------
// argv
// ---------------------------------------------------------------------------
const argv = process.argv.slice(2);
const REFRESH = argv.includes("--refresh");
const ALLOW_UNVERIFIED = argv.includes("--allow-unverified");
const VERBOSE = argv.includes("--verbose");
const stepsArg = argv.find((a) => a.startsWith("--steps="));
const STEPS = new Set(
  stepsArg ? stepsArg.slice("--steps=".length).split(",").map((s) => Number(s.trim())) : [1, 2, 3, 4, 5, 6],
);

// ---------------------------------------------------------------------------
// results
// ---------------------------------------------------------------------------
const results = [];
let counts = { PASS: 0, FAIL: 0, UNVERIFIED: 0, INFO: 0 };

function record(level, step, subject, message, detail = []) {
  counts[level]++;
  results.push({ level, step, subject, message, detail });
  if (level === "PASS") return; // passes are summarised, not printed line by line
  const line = `${level.padEnd(10)} [${step}] ${subject} :: ${message}`;
  console.log(line);
  for (const d of detail) console.log(`               ${d}`);
}
function pass(step, subject, message) {
  counts.PASS++;
  results.push({ level: "PASS", step, subject, message, detail: [] });
  if (VERBOSE) console.log(`${"PASS".padEnd(10)} [${step}] ${subject} :: ${message}`);
}

// ---------------------------------------------------------------------------
// text normalisation
// ---------------------------------------------------------------------------
const ENTITIES = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", ndash: "–",
  mdash: "—", hellip: "…", rsquo: "’", lsquo: "‘",
  ldquo: "“", rdquo: "”", middot: "·", times: "×", copy: "©",
};
function decodeEntities(s) {
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => safeCp(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => safeCp(parseInt(d, 10)))
    .replace(/&([a-z]+);/gi, (m, name) => ENTITIES[name.toLowerCase()] ?? m);
}
function safeCp(n) {
  try { return String.fromCodePoint(n); } catch { return ""; }
}

/** Whitespace + entity + quote normalisation. Case and dashes preserved. */
function norm(s) {
  return decodeEntities(String(s ?? ""))
    .replace(/[     ]/g, " ")
    .replace(/[​‌‍﻿]/g, "")
    .replace(/[‘’ʼ′]/g, "'")
    .replace(/[“”″]/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}
/** norm() + lowercase + every dash variant folded to "-". For loose containment. */
function normLoose(s) {
  return norm(s).toLowerCase().replace(/[‐-―−]/g, "-");
}

// ---------------------------------------------------------------------------
// HTML extraction
// ---------------------------------------------------------------------------
function stripTags(html) {
  return html.replace(/<[^>]*>/g, " ");
}
function extractHtml(html) {
  const titleM = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleM ? norm(stripTags(titleM[1])) : null;

  const h1 = [];
  for (const m of html.matchAll(/<h1[\s\S]*?>([\s\S]*?)<\/h1>/gi)) {
    const t = norm(stripTags(m[1]));
    if (t) h1.push(t);
  }

  // Metadata blob: meta tags and JSON-LD. Kept separate from body text but
  // searched alongside it, because publication dates and vendor descriptions
  // live here and a claim sourced to them is still sourced to the page.
  const metaBits = [];
  for (const m of html.matchAll(/<meta\b[^>]*>/gi)) {
    const tag = m[0];
    const name = tag.match(/\b(?:name|property|itemprop)\s*=\s*["']([^"']+)["']/i);
    const content = tag.match(/\bcontent\s*=\s*["']([^"']*)["']/i);
    if (name && content) metaBits.push(`${name[1]}: ${norm(content[1])}`);
  }
  for (const m of html.matchAll(/<script[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    metaBits.push(norm(m[1]).slice(0, 20_000));
  }
  // Next.js / Nuxt style embedded payloads carry publication dates too.
  for (const m of html.matchAll(/"date(?:Published|Modified)?"\s*[,:]\s*"([^"]{4,40})"/g)) {
    metaBits.push(`embedded-date: ${m[1]}`);
  }
  const metaText = metaBits.join(" | ").slice(0, MAX_TEXT);

  const body = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ");
  const text = norm(stripTags(body)).slice(0, MAX_TEXT);

  let publishedAt = null;
  const pubPatterns = [
    /"datePublished"\s*:\s*"([^"]+)"/i,
    /\bproperty\s*=\s*["']article:published_time["'][^>]*\bcontent\s*=\s*["']([^"']+)["']/i,
    /\bcontent\s*=\s*["']([^"']+)["'][^>]*\bproperty\s*=\s*["']article:published_time["']/i,
    /"date"\s*,\s*"(\d{4}-\d{2}-\d{2}[^"]*)"/i,
  ];
  for (const re of pubPatterns) {
    const m = html.match(re);
    if (m && !Number.isNaN(Date.parse(m[1]))) { publishedAt = new Date(m[1]).toISOString(); break; }
  }
  return { title, h1, text, metaText, publishedAt };
}

// ---------------------------------------------------------------------------
// Step 1 — evidence cache
// ---------------------------------------------------------------------------
const sha256 = (s) => createHash("sha256").update(s, "utf8").digest("hex");
const cachePath = (url) => join(EVIDENCE_DIR, `${sha256(url)}.json`);

function readCache(url) {
  const p = cachePath(url);
  if (!existsSync(p)) return null;
  try { return JSON.parse(readFileSync(p, "utf8")); } catch { return null; }
}

async function httpGet(url, headers = {}) {
  return await fetch(url, {
    redirect: "manual",
    headers: { "user-agent": UA, accept: "*/*", ...headers },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
}

/** Parse github.com/<owner>/<repo>[/issues/<n>] out of a URL. */
function githubTarget(url) {
  let u;
  try { u = new URL(url); } catch { return null; }
  if (u.hostname.replace(/^www\./, "") !== "github.com") return null;
  const parts = u.pathname.split("/").filter(Boolean);
  if (parts.length < 2) return null;
  const [owner, repo] = parts;
  if (parts.length >= 4 && (parts[2] === "issues" || parts[2] === "pull") && /^\d+$/.test(parts[3])) {
    return { owner, repo, kind: parts[2], number: parts[3] };
  }
  return { owner, repo, kind: "repo" };
}

async function fetchGithubExtras(url) {
  const t = githubTarget(url);
  if (!t) return null;
  const headers = { accept: "application/vnd.github+json" };
  if (process.env.GITHUB_TOKEN) headers.authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  const out = { api: `https://api.github.com/repos/${t.owner}/${t.repo}` };
  try {
    const r = await httpGet(out.api, headers);
    out.repoStatus = r.status;
    if (r.status === 200) {
      const j = await r.json();
      out.archived = j.archived;
      out.disabled = j.disabled;
      out.pushed_at = j.pushed_at;
      out.updated_at = j.updated_at;
      out.license = j.license?.spdx_id ?? null;
      out.description = j.description ?? null;
      out.full_name = j.full_name;
    }
  } catch (e) { out.repoError = String(e?.message ?? e); }
  if (t.kind === "issues" || t.kind === "pull") {
    out.issueApi = `https://api.github.com/repos/${t.owner}/${t.repo}/issues/${t.number}`;
    try {
      const r = await httpGet(out.issueApi, headers);
      out.issueStatus = r.status;
      if (r.status === 200) {
        const j = await r.json();
        out.issue = {
          title: j.title, created_at: j.created_at, closed_at: j.closed_at,
          state: j.state, user: j.user?.login ?? null, body: String(j.body ?? "").slice(0, 60_000),
        };
      }
    } catch (e) { out.issueError = String(e?.message ?? e); }
  }
  return out;
}

const hostOf = (u) => { try { return new URL(u).hostname.toLowerCase().replace(/^www\./, ""); } catch { return ""; } };

async function refreshOne(url) {
  const entry = {
    url,
    sha256: sha256(url),
    fetchedAt: new Date().toISOString(),
    ok: false,
    status: null,
    finalUrl: url,
    location: null,
    redirectChain: [],
    contentType: null,
    title: null,
    h1: [],
    publishedAt: null,
    text: "",
    metaText: "",
    github: null,
    error: null,
    // Recorded so a reviewer can see what the fetcher chose not to do:
    followedRedirects: "same-host only; a cross-host redirect is the fact, and its target's body is not stored under this URL",
  };
  let current = url;
  try {
    for (let hop = 0; hop < 6; hop++) {
      const res = await httpGet(current);
      const loc = res.headers.get("location");
      if (hop === 0) { entry.status = res.status; entry.location = loc; }
      entry.redirectChain.push({ url: current, status: res.status, location: loc ?? null });
      entry.finalUrl = current;
      if (res.status >= 300 && res.status < 400 && loc) {
        const next = new URL(loc, current).toString();
        if (hostOf(next) !== hostOf(current)) {
          // Cross-host redirect: the cited page is gone. Do not launder the
          // target's body into this URL's evidence.
          entry.ok = true;
          entry.finalUrl = next;
          break;
        }
        current = next;
        continue;
      }
      entry.contentType = res.headers.get("content-type");
      const bodyText = await res.text();
      if (res.status >= 200 && res.status < 300) {
        entry.ok = true;
        const ex = extractHtml(bodyText);
        entry.title = ex.title;
        entry.h1 = ex.h1;
        entry.text = ex.text;
        entry.metaText = ex.metaText;
        entry.publishedAt = ex.publishedAt;
      } else {
        entry.ok = false;
        entry.error = `HTTP ${res.status}`;
        entry.text = norm(stripTags(bodyText)).slice(0, 2000);
      }
      break;
    }
  } catch (e) {
    entry.ok = false;
    entry.error = String(e?.message ?? e);
  }
  try {
    entry.github = await fetchGithubExtras(url);
  } catch (e) {
    entry.github = { error: String(e?.message ?? e) };
  }
  mkdirSync(EVIDENCE_DIR, { recursive: true });
  writeFileSync(cachePath(url), JSON.stringify(entry, null, 2) + "\n");
  return entry;
}

// ---------------------------------------------------------------------------
// load corrections
// ---------------------------------------------------------------------------
function loadCorrections() {
  const out = [];
  for (const file of readdirSync(DATA_DIR).filter((f) => f.endsWith(".json")).sort()) {
    const cat = JSON.parse(readFileSync(join(DATA_DIR, file), "utf8"));
    for (const [ri, run] of (cat.runs ?? []).entries()) {
      for (const brand of run.brands ?? []) {
        if (!brand.correction) continue;
        out.push({
          file, slug: cat.slug, runIndex: ri, brand: brand.name,
          subject: `${cat.slug}/${brand.name}`,
          note: brand.correction.note,
          checkedAt: brand.correction.checkedAt,
          sources: brand.correction.sources ?? [],
        });
      }
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Step 2 — mechanical assertion extraction
// ---------------------------------------------------------------------------
const MONTHS = ["january", "february", "march", "april", "may", "june", "july",
  "august", "september", "october", "november", "december"];
const MONTH_ALT = MONTHS.join("|");
const ABBR_ALT = "jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec";

const PATTERNS = [
  { kind: "date", re: new RegExp(String.raw`\b(\d{1,2})\s+(${MONTH_ALT})\s+(\d{4})\b`, "gi") },
  { kind: "date", re: new RegExp(String.raw`\b(${MONTH_ALT}|${ABBR_ALT})\.?\s+(\d{1,2}),\s*(\d{4})\b`, "gi") },
  { kind: "date", re: /\b(\d{4})-(\d{2})-(\d{2})\b/g },
  { kind: "date", re: new RegExp(String.raw`\b(${MONTH_ALT})\s+(\d{4})\b`, "gi") },
  { kind: "http", re: /\bHTTP\s+(\d{3})\b(?:[^.]{0,40}?\bto\s+((?:[a-z0-9-]+\.)+[a-z]{2,}))?/gi },
  { kind: "archive", re: /\b(is not archived|still archived|was archived|archived by the owner|is archived|no longer maintained)\b/gi },
  { kind: "licence", re: /\b(AGPL(?:[- ]?v?\d(?:\.\d)?)?|LGPL(?:[- ]?v?\d(?:\.\d)?)?|GPL(?:[- ]?v?\d(?:\.\d)?)?|MIT|Apache(?:[- ]2\.0)?|BSD(?:[- ]\d[- ]Clause)?|MPL(?:[- ]2\.0)?|Elastic License(?:\s*2\.0)?|BUSL(?:[- ]1\.1)?)\b/g },
  { kind: "version", re: /\bv\d+(?:\.\d+)*\b/g },
  { kind: "repo", re: /\b(?:github\.com|gitlab\.com|codeberg\.org)\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+(?:\/issues\/\d+)?/g },
  { kind: "host", re: /\b(?:[a-z0-9-]+\.)+(?:com|io|org|net|dev|app|co|ai|sh|diy|cloud|me|eu)\b/g },
];

function sentencesOf(note) {
  const parts = note.split(/(?<=[.:;])\s+(?=[A-Z"'“(])/);
  return parts.length ? parts : [note];
}
function sentenceFor(note, index) {
  let cursor = 0;
  for (const s of sentencesOf(note)) {
    const start = note.indexOf(s, cursor);
    if (start < 0) continue;
    if (index >= start && index < start + s.length) return s;
    cursor = start + s.length;
  }
  return note;
}

function extractAssertions(note) {
  const found = [];
  const taken = []; // [start, end) ranges already claimed, longest-first wins

  // quoted strings first — they are the highest-value assertion and must not
  // be shredded into their component dates.
  for (const m of note.matchAll(/["“]([^"“”]{2,})["”]/g)) {
    found.push({ kind: "quote", text: m[1], raw: m[0], index: m.index });
    taken.push([m.index, m.index + m[0].length]);
  }
  const overlaps = (a, b) => taken.some(([s, e]) => a < e && b > s);

  const candidates = [];
  for (const { kind, re } of PATTERNS) {
    for (const m of note.matchAll(re)) {
      candidates.push({ kind, text: m[0], groups: m.slice(1), index: m.index });
    }
  }
  // Longest match at the earliest position wins, so "14 January 2026" is taken
  // in preference to the "January 2026" inside it.
  candidates.sort((a, b) => b.text.length - a.text.length || a.index - b.index);
  for (const c of candidates) {
    const end = c.index + c.text.length;
    if (overlaps(c.index, end)) continue;
    taken.push([c.index, end]);
    found.push(c);
  }
  // Dedupe identical (kind, text) pairs, keep first occurrence.
  const seen = new Set();
  const out = [];
  for (const a of found.sort((x, y) => x.index - y.index)) {
    const key = `${a.kind}::${normLoose(a.text)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    // A date that is the object of the note's own dating clause ("Checked
    // again on 31 August 2026: ...") is not a claim about the source — it is
    // the escape hatch step 5 asks for, and by construction no cited page can
    // contain it. It is reclassified, not dropped: step 5 checks it against
    // checkedAt instead.
    const before = note.slice(Math.max(0, a.index - 40), a.index);
    const kind = a.kind === "date" && OBSERVED_ON_RE.test(before) ? "observation-date" : a.kind;
    out.push({ ...a, kind, sentence: sentenceFor(note, a.index) });
  }
  return out;
}

const OBSERVED_ON_RE = /\b(checked(?: again)?|re-?checked|verified|confirmed|observed|as)\s+(on|at|of)\s+$/i;

// ---------------------------------------------------------------------------
// Step 3 — containment
// ---------------------------------------------------------------------------
function haystack(entry) {
  return [
    entry.title ?? "", (entry.h1 ?? []).join(" · "), entry.text ?? "", entry.metaText ?? "",
    entry.finalUrl ?? "", entry.location ?? "", entry.url ?? "",
    entry.github ? JSON.stringify(entry.github) : "",
  ].join("\n");
}

function dateVariants(assertion) {
  const t = norm(assertion.text);
  let y, mo, d = null;
  let m;
  if ((m = t.match(new RegExp(String.raw`^(\d{1,2})\s+(${MONTH_ALT})\s+(\d{4})$`, "i")))) {
    d = +m[1]; mo = MONTHS.indexOf(m[2].toLowerCase()) + 1; y = +m[3];
  } else if ((m = t.match(new RegExp(String.raw`^(${MONTH_ALT}|${ABBR_ALT})\.?\s+(\d{1,2}),\s*(\d{4})$`, "i")))) {
    const key = m[1].toLowerCase().replace(/\.$/, "");
    mo = MONTHS.findIndex((x) => x.startsWith(key.slice(0, 3))) + 1; d = +m[2]; y = +m[3];
  } else if ((m = t.match(/^(\d{4})-(\d{2})-(\d{2})$/))) {
    y = +m[1]; mo = +m[2]; d = +m[3];
  } else if ((m = t.match(new RegExp(String.raw`^(${MONTH_ALT})\s+(\d{4})$`, "i")))) {
    mo = MONTHS.indexOf(m[1].toLowerCase()) + 1; y = +m[2]; d = null;
  } else {
    return [t];
  }
  const M = MONTHS[mo - 1];
  const Mc = M[0].toUpperCase() + M.slice(1);
  const abbr = Mc.slice(0, 3);
  const pad = (n) => String(n).padStart(2, "0");
  if (d === null) {
    return [`${Mc} ${y}`, `${abbr} ${y}`, `${abbr}. ${y}`, `${y}-${pad(mo)}`];
  }
  return [
    `${d} ${Mc} ${y}`, `${pad(d)} ${Mc} ${y}`,
    `${Mc} ${d}, ${y}`, `${Mc} ${pad(d)}, ${y}`,
    `${abbr} ${d}, ${y}`, `${abbr}. ${d}, ${y}`, `${abbr} ${pad(d)}, ${y}`,
    `${d} ${abbr} ${y}`, `${d} ${abbr}. ${y}`,
    `${y}-${pad(mo)}-${pad(d)}`, `${pad(d)}/${pad(mo)}/${y}`, `${pad(mo)}/${pad(d)}/${y}`,
    `${Mc} ${d}${d % 10 === 1 && d !== 11 ? "st" : d % 10 === 2 && d !== 12 ? "nd" : d % 10 === 3 && d !== 13 ? "rd" : "th"}, ${y}`,
  ];
}

function licenceVariants(text) {
  const t = norm(text);
  const base = t.replace(/\s+/g, "");
  const v = new Set([t, base, t.replace(/\s+/g, "-"), base.replace(/(\d)\.0$/, "$1"), base.replace(/-/g, "")]);
  const m = t.match(/^([A-Za-z]+)[- ]?v?(\d)(?:\.(\d))?$/);
  if (m) {
    const [, fam, maj, min] = m;
    v.add(`${fam}-${maj}.${min ?? 0}`); v.add(`${fam} ${maj}.${min ?? 0}`);
    v.add(`${fam}v${maj}`); v.add(`${fam}-${maj}`); v.add(`${fam} ${maj}`);
  }
  return [...v];
}

/** Does a cached source satisfy this assertion? Returns null or a reason string. */
function satisfies(assertion, entry) {
  const hay = normLoose(haystack(entry));
  const gh = entry.github ?? {};
  switch (assertion.kind) {
    case "quote": {
      const wantExact = norm(assertion.text);
      const haystackExact = norm(haystack(entry));
      if (haystackExact.includes(wantExact)) return "exact match in source text";
      const loose = normLoose(assertion.text);
      if (hay.includes(loose)) return "MATCH-LOOSE"; // case/dash differ — caller decides
      return null;
    }
    case "date": {
      for (const v of dateVariants(assertion)) if (hay.includes(normLoose(v))) return `date form "${v}"`;
      return null;
    }
    case "http": {
      const code = Number(assertion.groups?.[0]);
      const target = assertion.groups?.[1] ? assertion.groups[1].toLowerCase() : null;
      if (entry.status !== code) return null;
      if (!target) return `cache metadata: status ${code}`;
      const locHost = hostOf(entry.location ? new URL(entry.location, entry.url).toString() : entry.finalUrl);
      if (locHost && (locHost === target || locHost.endsWith(`.${target}`) || target.endsWith(`.${locHost}`))) {
        return `cache metadata: status ${code}, location host ${locHost}`;
      }
      return null;
    }
    case "archive": {
      const a = normLoose(assertion.text);
      if (a === "is not archived") return gh.archived === false ? "cache metadata: github archived=false" : null;
      if (a === "still archived" || a === "is archived" || a === "was archived" || a === "archived by the owner") {
        if (gh.archived === true) return "cache metadata: github archived=true";
        return hay.includes("archived by the owner") ? "source text: 'archived by the owner'" : null;
      }
      if (a === "no longer maintained") return hay.includes("no longer maintained") || hay.includes("unmantained") || hay.includes("unmaintained") ? "source text" : null;
      return hay.includes(a) ? "source text" : null;
    }
    case "licence": {
      for (const v of licenceVariants(assertion.text)) if (hay.includes(normLoose(v))) return `licence form "${v}"`;
      if (gh.license && normLoose(gh.license).includes(normLoose(assertion.text).replace(/[ .]/g, ""))) return `github api license ${gh.license}`;
      return null;
    }
    case "repo":
    case "host": {
      const t = normLoose(assertion.text);
      if (normLoose(entry.url).includes(t) || normLoose(entry.finalUrl ?? "").includes(t)) return "cited URL itself";
      if (entry.location && normLoose(new URL(entry.location, entry.url).toString()).includes(t)) return "redirect target";
      return hay.includes(t) ? "source text" : null;
    }
    default:
      return hay.includes(normLoose(assertion.text)) ? "source text" : null;
  }
}

// ---------------------------------------------------------------------------
// Step 5 helpers — is this assertion phrased in the present tense?
//
// Tense is judged on the CLAUSE containing the assertion, not the whole
// sentence, and quoted spans are removed first: a quotation's tense belongs to
// the source that wrote it, not to us. "The maintainer's closing issue, opened
// 9 January 2026, states 'X is now unmaintained'" is a past-tense claim about a
// dated artefact, and holding it to a 90-day freshness bar would be wrong.
// ---------------------------------------------------------------------------
const PRESENT_RE = /\b(now|is|are|returns?|continues?|remains?|still|currently|no longer|exists?|redirects?|presents?)\b/i;
const PAST_RE = /\b(was|were|had|announced|opened|renamed|archived|acquired|joined|stopped|moved|reached|published|relicensed|closed|dated|became|shut)\b/i;

function clauseFor(sentence, assertionText) {
  const clauses = sentence.split(/[,;:—–]|\s+-\s+/);
  return clauses.find((c) => c.includes(assertionText)) ?? sentence;
}
function isPresentTense(a) {
  const clause = clauseFor(a.sentence, a.text).replace(/["“][^"”]*["”]/g, " ");
  if (PAST_RE.test(clause)) return false;
  return PRESENT_RE.test(clause);
}

// ---------------------------------------------------------------------------
// Step 4 — title check
// ---------------------------------------------------------------------------
const SEP_SPLIT = /\s+[|·–—•]\s+|\s+-\s+/;
function titleCandidates(entry) {
  const out = new Set();
  for (const h of entry.h1 ?? []) {
    if (!h) continue;
    out.add(h);
    // GitHub renders an issue h1 as "<title> #487". The issue's actual title
    // is the API's, which is what a citation should carry.
    const stripped = h.replace(/\s+#\d+$/, "");
    if (stripped !== h) out.add(stripped);
  }
  if (entry.github?.issue?.title) out.add(norm(entry.github.issue.title));
  if (entry.title) {
    out.add(entry.title);
    // Candidates are produced by TRUNCATING the original string, never by
    // rejoining it, so a candidate is always a verbatim prefix of the page's
    // own <title> and the exact comparison below stays meaningful.
    const seps = [...entry.title.matchAll(new RegExp(SEP_SPLIT.source, "g"))];
    if (seps.length) {
      out.add(entry.title.slice(0, seps.at(-1).index));  // drop trailing site-name segment
      out.add(entry.title.slice(0, seps[0].index));      // drop everything after the first
    }
  }
  return [...out].map((s) => norm(s)).filter(Boolean);
}
/** Whitespace/entity-normalised only: case and dash characters still count. */
const titleKeyExact = (s) => norm(s);
/** Additionally case- and dash-folded, used only to DIAGNOSE a near miss. */
const titleKey = (s) => normLoose(s).replace(/\s+/g, " ").replace(/^[\s\-|·]+|[\s\-|·]+$/g, "");

// ---------------------------------------------------------------------------
// Step 6 — round-trip against docs/marketing/**
// ---------------------------------------------------------------------------
function walkMd(dir) {
  const out = [];
  if (!existsSync(dir)) return out;
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...walkMd(p));
    else if (e.name.endsWith(".md")) out.push(p);
  }
  return out.sort();
}
function textFences(md) {
  const out = [];
  const re = /^```text[ \t]*\r?\n([\s\S]*?)^```[ \t]*$/gm;
  for (const m of md.matchAll(re)) out.push({ body: m[1], index: m.index });
  return out;
}
function fenceSources(fence) {
  const lines = fence.split(/\r?\n/);
  const urls = [];
  let started = false;
  for (const line of lines) {
    if (/^Sources?:/.test(line)) {
      started = true;
      const u = line.replace(/^Sources?:/, "").trim();
      if (u) urls.push(u);
      continue;
    }
    if (started) {
      const t = line.trim();
      if (/^https?:\/\/\S+$/.test(t) && /^\s/.test(line)) urls.push(t);
      else break;
    }
  }
  return urls;
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------
const DAY = 86_400_000;

async function main() {
  const corrections = loadCorrections();
  console.log(`answer-ledger citation check — ${corrections.length} correction(s), steps ${[...STEPS].join(",")}${REFRESH ? ", --refresh" : ", offline"}`);
  console.log("");

  const urls = [...new Set(corrections.flatMap((c) => c.sources.map((s) => s.url)))];

  // ---- Step 1 -------------------------------------------------------------
  const cache = new Map();
  if (STEPS.has(1) && REFRESH) {
    for (const url of urls) {
      process.stdout.write(`fetching ${url} ... `);
      const e = await refreshOne(url);
      console.log(e.ok ? `${e.status}${e.location ? ` -> ${e.location}` : ""}` : `FAILED (${e.error})`);
      cache.set(url, e);
    }
    console.log("");
  }
  for (const url of urls) {
    if (!cache.has(url)) cache.set(url, readCache(url));
  }
  if (STEPS.has(1)) {
    for (const url of urls) {
      const e = cache.get(url);
      if (!e) record("FAIL", "step1-cache", url, "no cached evidence — run with --refresh", [`expected ${cachePath(url)}`]);
      else if (!e.ok) record("UNVERIFIED", "step1-cache", url, `unverified — lookup failed (${e.error ?? "unknown"})`, [`fetchedAt ${e.fetchedAt}`]);
      else pass("step1-cache", url, `cached ${e.status}`);
    }
  }

  const now = Date.now();

  for (const c of corrections) {
    const entries = c.sources.map((s) => ({ src: s, entry: cache.get(s.url) ?? readCache(s.url) }));
    const anyLookupFailed = entries.some((x) => !x.entry || !x.entry.ok);
    const failedUrls = entries.filter((x) => !x.entry || !x.entry.ok).map((x) => x.src.url);
    const citedList = entries.map((x) => `cited: ${x.src.url}${x.entry ? (x.entry.ok ? ` [${x.entry.status}]` : ` [LOOKUP FAILED: ${x.entry.error}]`) : " [NO CACHE]"}`);

    // ---- Steps 2 + 3 ------------------------------------------------------
    if (STEPS.has(2) || STEPS.has(3)) {
      const assertions = extractAssertions(c.note);
      if (STEPS.has(2)) pass("step2-extract", c.subject, `${assertions.length} assertions`);
      if (STEPS.has(3)) {
        for (const a of assertions) {
          if (a.kind === "observation-date") {
            // Not a claim about a source. Checked against checkedAt below.
            const d = dateVariants(a).find((v) => /^\d{4}-\d{2}-\d{2}$/.test(v));
            const obs = d ? Date.parse(`${d}T23:59:59Z`) : NaN;
            const chk = Date.parse(c.checkedAt);
            if (Number.isNaN(obs)) { pass("step5-observation", c.subject, `observation date ${a.text} (unparsed)`); continue; }
            if (obs < chk - DAY || obs > chk + DAY) {
              record("FAIL", "step5-observation", c.subject,
                `the note says the observation was made on ${a.text} but checkedAt is ${c.checkedAt}`,
                [`sentence: ${a.sentence}`]);
            } else {
              pass("step5-observation", c.subject, `observation date ${a.text} agrees with checkedAt`);
            }
            continue;
          }
          let hit = null, loose = null;
          for (const { src, entry } of entries) {
            if (!entry || !entry.ok) continue;
            const why = satisfies(a, entry);
            if (why === "MATCH-LOOSE") { loose ??= { url: src.url }; continue; }
            if (why) { hit = { url: src.url, why }; break; }
          }
          const label = `${a.kind} ${JSON.stringify(a.text)}`;
          if (hit) {
            pass("step3-containment", c.subject, `${label} <- ${hit.url}`);
            a.satisfiedBy = hit.url;
          } else if (loose) {
            record("FAIL", "step3-containment", c.subject,
              `quoted string differs from the source in case or dash characters — a quotation must be exact`,
              [`assertion: ${label}`, `sentence:  ${a.sentence}`, `near-match in: ${loose.url}`, ...citedList]);
          } else if (anyLookupFailed) {
            record("UNVERIFIED", "step3-containment", c.subject,
              `${label} not found in any fetchable cited source; unverified — lookup failed for ${failedUrls.join(", ")}`,
              [`sentence: ${a.sentence}`, ...citedList]);
          } else {
            record("FAIL", "step3-containment", c.subject, `${label} is not contained in any cited source`,
              [`sentence: ${a.sentence}`, ...citedList]);
          }
        }

        // ---- Step 5 (per-assertion recency) -------------------------------
        if (STEPS.has(5)) {
          const datedRe = /\b(checked(?: again)? on|as of|as at|at the time of checking|verified on)\b/i;
          for (const a of assertions) {
            if (!a.satisfiedBy) continue;
            if (!isPresentTense(a)) continue;
            const e = cache.get(a.satisfiedBy) ?? readCache(a.satisfiedBy);
            const fetchAgeDays = e?.fetchedAt ? (now - Date.parse(e.fetchedAt)) / DAY : Infinity;
            const pubAgeDays = e?.publishedAt ? (now - Date.parse(e.publishedAt)) / DAY : null;
            const fetchFresh = fetchAgeDays <= FETCH_FRESH_DAYS;
            const pubFresh = pubAgeDays === null || pubAgeDays <= PUBLISHED_FRESH_DAYS;
            const label = `${a.kind} ${JSON.stringify(a.text)}`;
            if (fetchFresh && pubFresh) {
              pass("step5-recency", c.subject, `${label} fresh evidence`);
            } else if (datedRe.test(a.sentence)) {
              pass("step5-recency", c.subject, `${label} present tense but the note dates the observation`);
            } else {
              record("FAIL", "step5-recency", c.subject,
                `present-tense assertion rests on stale evidence and the note does not date the observation`,
                [`assertion: ${label}`,
                 `sentence:  ${a.sentence}`,
                 `source:    ${a.satisfiedBy}`,
                 `fetchedAt ${e?.fetchedAt ?? "n/a"} (${Math.round(fetchAgeDays)}d ago, limit ${FETCH_FRESH_DAYS}d)`,
                 `published ${e?.publishedAt ?? "undated article"}${pubAgeDays === null ? "" : ` (${Math.round(pubAgeDays)}d ago, limit ${PUBLISHED_FRESH_DAYS}d)`}`,
                 `fix: add "Checked again on <date>: ..." to the sentence, or cite a current source`]);
            }
          }
        }
      }
    }

    // ---- Step 4 — titles --------------------------------------------------
    if (STEPS.has(4)) {
      for (const { src, entry } of entries) {
        if (src.title == null || src.title === "") { pass("step4-title", c.subject, `${src.url} has no title to check`); continue; }
        if (!entry) { record("FAIL", "step4-title", c.subject, `no cached evidence for ${src.url} — run with --refresh`); continue; }
        if (!entry.ok) {
          record("UNVERIFIED", "step4-title", c.subject,
            `unverified — lookup failed (${entry.error}); the cited title of ${src.url} is unaudited`,
            [`cited title: ${JSON.stringify(src.title)}`]);
          continue;
        }
        const cands = titleCandidates(entry);
        if (cands.some((x) => titleKeyExact(x) === titleKeyExact(src.title))) {
          pass("step4-title", c.subject, `${src.url} title matches`);
        } else if (cands.some((x) => titleKey(x) === titleKey(src.title))) {
          // qa-bach's step 4 is required to catch the Forminit em dash, so a
          // dash or case difference is a failure, not a tolerance. The fold is
          // used to name the difference precisely, never to excuse it.
          record("FAIL", "step4-title", c.subject,
            `cited title differs from the page's own title only in case or dash characters — a title is transcribed, not composed`,
            [`cited: ${JSON.stringify(src.title)}`,
             `page:  ${cands.map((x) => JSON.stringify(x)).join(" | ")}`]);
        } else {
          record("FAIL", "step4-title", c.subject, `cited title matches neither the h1 nor the <title> of ${src.url}`,
            [`cited:   ${JSON.stringify(src.title)}`,
             `h1:      ${(entry.h1 ?? []).length ? entry.h1.map((h) => JSON.stringify(h)).join(" | ") : "(none)"}`,
             `<title>: ${entry.title ? JSON.stringify(entry.title) : "(none)"}`,
             ...(cands.length ? [`accepted candidates: ${cands.map((x) => JSON.stringify(x)).join(" | ")}`] : [])]);
        }
      }
    }

    // ---- Step 5 — checkedAt sanity ---------------------------------------
    if (STEPS.has(5)) {
      const stamps = entries.map((x) => x.entry?.fetchedAt).filter(Boolean).map((s) => Date.parse(s));
      if (stamps.length) {
        const newest = Math.max(...stamps);
        if (Date.parse(c.checkedAt) < newest - DAY) {
          record("INFO", "step5-checkedat", c.subject,
            `checkedAt ${c.checkedAt} predates the newest cached fetch ${new Date(newest).toISOString()}`,
            ["this is expected right after a --refresh: the cache is newer than the human check.",
             "It becomes a FAIL only when checkedAt predates evidence that existed when it was written."]);
        } else {
          pass("step5-checkedat", c.subject, "checkedAt is not older than its evidence");
        }
      }
    }
  }

  // ---- Step 6 — round-trip ------------------------------------------------
  if (STEPS.has(6)) {
    const files = walkMd(MARKETING_DIR);
    let fenceCount = 0;
    const matchedCorrections = new Set();
    for (const file of files) {
      const md = readFileSync(file, "utf8");
      for (const f of textFences(md)) {
        const urlsInFence = fenceSources(f.body);
        if (urlsInFence.length === 0) continue; // not a correction notice
        fenceCount++;
        const line = md.slice(0, f.index).split("\n").length;
        const where = `${file.replace(MARKETING_DIR + "/", "")}:${line}`;
        const fenceNorm = norm(f.body);

        // Match the fence to a correction by quoted note first, then by URLs.
        let match = corrections.find((c) => fenceNorm.includes(`"${norm(c.note)}"`));
        let quoteExact = !!match;
        if (!match) match = corrections.find((c) => fenceNorm.includes(norm(c.note)));
        if (!match) {
          match = corrections.find((c) => c.sources.map((s) => s.url).join("\n") === urlsInFence.join("\n"))
            ?? corrections.find((c) => c.sources.some((s) => urlsInFence.includes(s.url)));
        }
        if (!match) {
          record("FAIL", "step6-roundtrip", where, "text fence quotes a correction that matches no entry in data/",
            [`fence sources: ${urlsInFence.join(", ")}`]);
          continue;
        }
        matchedCorrections.add(match.subject);

        if (quoteExact) {
          pass("step6-roundtrip", where, `quote matches ${match.subject}`);
        } else if (fenceNorm.includes(norm(match.note))) {
          record("FAIL", "step6-roundtrip", where,
            `the note appears but is not delimited by quotation marks as a verbatim block (${match.subject})`);
        } else {
          const noteN = norm(match.note);
          let i = 0;
          while (i < noteN.length && fenceNorm.includes(noteN.slice(0, i + 1))) i++;
          record("FAIL", "step6-roundtrip", where,
            `quoted correction does not equal the data/ note under whitespace normalisation (${match.subject})`,
            [`diverges after ${i} chars`,
             `data/  ...${noteN.slice(Math.max(0, i - 60), i + 60)}`,
             `notice: first mismatch at the character above`]);
        }

        const want = match.sources.map((s) => s.url);
        if (want.join("\n") === urlsInFence.join("\n")) {
          pass("step6-roundtrip", where, `Sources: list matches ${match.subject} in order`);
        } else {
          record("FAIL", "step6-roundtrip", where, `Sources: list does not equal data/ sources[].url in order (${match.subject})`,
            [`notice: ${JSON.stringify(urlsInFence)}`, `data/:  ${JSON.stringify(want)}`]);
        }
      }
    }
    record("INFO", "step6-roundtrip", "docs/marketing", `${fenceCount} correction fence(s) found in ${files.length} markdown file(s)`);
    for (const c of corrections) {
      if (!matchedCorrections.has(c.subject)) {
        record("INFO", "step6-roundtrip", c.subject, "correction is not quoted in any outreach notice (nothing to round-trip)");
      }
    }
  }

  // ---- summary ------------------------------------------------------------
  console.log("");
  console.log(`SUMMARY  pass=${counts.PASS} fail=${counts.FAIL} unverified=${counts.UNVERIFIED} info=${counts.INFO}`);
  const bad = counts.FAIL > 0 || (counts.UNVERIFIED > 0 && !ALLOW_UNVERIFIED);
  if (counts.FAIL === 0 && counts.UNVERIFIED === 0) console.log("RESULT   GREEN");
  else if (counts.FAIL === 0) console.log(`RESULT   ${ALLOW_UNVERIFIED ? "GREEN-WITH-UNVERIFIED" : "RED (unverified lookups)"}`);
  else console.log("RESULT   RED");
  process.exit(bad ? 1 : 0);
}

main().catch((e) => { console.error("check-citations crashed:", e); process.exit(2); });
