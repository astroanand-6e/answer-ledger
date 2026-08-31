/** Minimal, dependency-free HTML/XML helpers. */

export const esc = (s: string): string =>
  s.replace(/&/g, "&amp;")
   .replace(/</g, "&lt;")
   .replace(/>/g, "&gt;")
   .replace(/"/g, "&quot;")
   .replace(/'/g, "&#39;");

/** JSON-LD must not be able to break out of the <script> element. */
export const jsonLd = (obj: unknown): string =>
  JSON.stringify(obj, null, 2).replace(/</g, "\\u003c");

/** Stable, human-readable UTC rendering. Never uses the local clock. */
export const utc = (iso: string): string => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) throw new Error(`bad timestamp: ${iso}`);
  return d.toISOString().replace("T", " ").replace(/\.\d+Z$/, " UTC");
};

export const utcDate = (iso: string): string => new Date(iso).toISOString().slice(0, 10);
