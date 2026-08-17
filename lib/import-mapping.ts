import type { ImportMapping, ImportSystemField } from "@/types";

/**
 * Normalizes a header string for comparison: lowercase, collapse whitespace,
 * and strip non-alphanumeric characters so "Lead Name", "lead_name",
 * "Lead  Name!" and "leadname" all normalize to "leadname".
 */
function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/**
 * Sørensen–Dice coefficient over character bigrams. Returns a value in [0, 1].
 * Higher is more similar. Used as the fuzzy fallback after exact-normalized
 * matching so e.g. "mobile no" still pairs with "phone".
 */
function diceCoefficient(a: string, b: string): number {
  const na = normalize(a);
  const nb = normalize(b);
  if (na === nb) return 1;
  if (na.length < 2 || nb.length < 2) return na === nb ? 1 : 0;

  const bigrams = (s: string): Set<string> => {
    const set = new Set<string>();
    for (let i = 0; i < s.length - 1; i++) set.add(s.slice(i, i + 2));
    return set;
  };

  const ba = bigrams(na);
  const bb = bigrams(nb);
  let intersection = 0;
  for (const bg of ba) if (bb.has(bg)) intersection++;
  return (2 * intersection) / (ba.size + bb.size);
}

/** Curated alias map: system key -> common header synonyms. */
const ALIASES: Record<string, string[]> = {
  lead_name: ["name", "fullname", "full name", "customer", "customer name", "client", "client name", "first name", "firstname"],
  last_name: ["surname", "family name", "lastname"],
  phone: ["mobile", "mobile number", "mobile no", "mobilenumber", "contact", "contact number", "contact no", "phone number", "phonenumber", "cell", "cellphone"],
  email: ["email address", "emailaddress", "mail", "e mail"],
  alternate_mobile: ["alternate phone", "alt mobile", "secondary mobile", "secondary phone", "alt phone", "alternate contact"],
  lead_source: ["source", "lead source name", "campaign", "channel"],
  service_type: ["service", "service category", "category"],
  unit_number: ["unit", "unit no", "flat", "flat no", "apartment", "apartment no"],
  project_type: ["property type", "type", "building type"],
  configuration: ["config", "bedrooms", "bhk", "layout"],
  project_name: ["project", "building", "tower"],
  location: ["city", "town", "region"],
  locality: ["area", "neighborhood", "neighbourhood", "suburb", "zone"],
  price: ["amount", "value", "cost", "budget", "quotation"],
  property_size: ["size", "area sqft", "built up area", "carpet area", "sqft", "square feet"],
  lead_status: ["status", "stage", "phase"],
  lead_priority: ["priority", "urgency", "importance"],
  lead_owner: ["owner", "assignee", "assigned to", "assignedto", "agent", "sales rep", "salesperson", "owner name"],
  comments: ["comment", "notes", "remark", "remarks", "description", "details"],
  created_time: ["created at", "createdat", "created date", "date", "created", "timestamp", "imported at", "lead date", "leaddate"],
};

function findExactMatch(
  header: string,
  systemFields: ImportSystemField[],
): string | null {
  const normHeader = normalize(header);
  for (const f of systemFields) {
    if (normalize(f.key) === normHeader) return f.key;
    if (normalize(f.label) === normHeader) return f.key;
    const unprefixed = f.key.startsWith("custom:") ? f.key.slice("custom:".length) : f.key;
    if (normalize(unprefixed) === normHeader) return f.key;
  }
  for (const f of systemFields) {
    const aliases = ALIASES[f.key] ?? [];
    if (aliases.some((a) => normalize(a) === normHeader)) return f.key;
  }
  return null;
}

function findFuzzyMatch(
  header: string,
  systemFields: ImportSystemField[],
  usedKeys: Set<string>,
  threshold: number,
): string | null {
  let best: { key: string; score: number } | null = null;
  for (const f of systemFields) {
    if (usedKeys.has(f.key)) continue;
    const unprefixed = f.key.startsWith("custom:") ? f.key.slice("custom:".length) : f.key;
    const candidates = [f.key, f.label, unprefixed, ...(ALIASES[f.key] ?? [])];
    for (const candidate of candidates) {
      const score = diceCoefficient(header, candidate);
      if (!best || score > best.score) best = { key: f.key, score };
    }
  }
  if (!best || best.score < threshold) return null;
  return best.key;
}

/**
 * Builds an initial ImportMapping by auto-matching each CSV header to a system
 * field. Strategy, in priority order:
 *   1. Exact normalized match against a system key or known alias.
 *   2. Highest fuzzy (dice) similarity against remaining system keys + aliases,
 *      but only if the score is >= `threshold` (default 0.6).
 *
 * Each system field is assigned at most once (first exact match wins, then best
 * fuzzy among leftovers). This keeps the mapping UI, preview, and backend import
 * in sync — previously duplicate assignments meant the UI showed the first
 * column while import used the last (often empty) and failed required checks.
 * Unmatched headers map to "".
 */
export function autoMatchColumns(
  csvHeaders: string[],
  systemFields: ImportSystemField[],
  threshold = 0.6
): ImportMapping {
  const mapping: ImportMapping = {};
  for (const header of csvHeaders) mapping[header] = "";

  const usedKeys = new Set<string>();

  // Phase 1: exact key / alias matches (left-to-right; first header wins).
  for (const header of csvHeaders) {
    const key = findExactMatch(header, systemFields);
    if (key && !usedKeys.has(key)) {
      mapping[header] = key;
      usedKeys.add(key);
    }
  }

  // Phase 2: fuzzy matches for remaining headers against remaining system keys.
  for (const header of csvHeaders) {
    if (mapping[header]) continue;
    const key = findFuzzyMatch(header, systemFields, usedKeys, threshold);
    if (key) {
      mapping[header] = key;
      usedKeys.add(key);
    }
  }

  return mapping;
}

/**
 * Ensures each system key appears at most once in the mapping (first CSV header
 * wins). Safe to call before import so a stale/hand-edited mapping cannot
 * overwrite a good column with a later empty one on the backend.
 */
export function dedupeMapping(mapping: ImportMapping): ImportMapping {
  const seen = new Set<string>();
  const next: ImportMapping = {};
  for (const [csvHeader, systemKey] of Object.entries(mapping)) {
    if (!systemKey) {
      next[csvHeader] = "";
      continue;
    }
    if (seen.has(systemKey)) {
      next[csvHeader] = "";
      continue;
    }
    seen.add(systemKey);
    next[csvHeader] = systemKey;
  }
  return next;
}
