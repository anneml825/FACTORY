/**
 * Evidence source adapters for the Data Economics Probe.
 *
 * Every source declares its purchase-intent proximity honestly. Wikipedia
 * pageviews tell you people are curious about a topic; they do not tell you
 * anyone would pay for anything. Rating them WEAK is the difference between a
 * probe that measures reality and one that produces a comfortable number.
 *
 * Sources requiring credentials are declared and attempted so that
 * NO_CREDENTIAL shows up in the results as the real coverage limit it is,
 * rather than being silently omitted from the denominator.
 */

import type { Candidate, EvidenceSource, FetchResult } from './types.ts';

const UA =
  'FactoryDataEconomicsProbe/0.1 (+https://github.com/anneml825/FACTORY) research probe';

async function getJson(
  url: string,
  signal: AbortSignal,
  headers: Record<string, string> = {},
): Promise<{ status: number; body: unknown; latencyMs: number }> {
  const started = Date.now();
  const res = await fetch(url, {
    signal,
    headers: { 'User-Agent': UA, Accept: 'application/json', ...headers },
  });
  const latencyMs = Date.now() - started;
  let body: unknown = null;
  const text = await res.text();
  try {
    body = JSON.parse(text);
  } catch {
    body = text.slice(0, 400);
  }
  return { status: res.status, body, latencyMs };
}

function classify(status: number): 'RATE_LIMITED' | 'NOT_FOUND' | 'HTTP_ERROR' {
  if (status === 429) return 'RATE_LIMITED';
  if (status === 404) return 'NOT_FOUND';
  return 'HTTP_ERROR';
}

function networkFailure(err: unknown, latencyMs: number): FetchResult {
  const msg = err instanceof Error ? err.message : String(err);
  const reason =
    msg.includes('abort') || msg.includes('timeout')
      ? 'TIMEOUT'
      : /403|CONNECT|ENOTFOUND|EAI_AGAIN|fetch failed/i.test(msg)
        ? 'NETWORK_BLOCKED'
        : 'HTTP_ERROR';
  return { ok: false, reason, detail: msg.slice(0, 200), requestCount: 1, latencyMs };
}

// ---------------------------------------------------------------------------

/** Monthly Wikipedia pageviews. Topic interest. Explicitly WEAK. */
export const wikipediaPageviews: EvidenceSource = {
  id: 'wikipedia_pageviews',
  provider: 'Wikimedia REST API',
  signalType: 'article pageviews, trailing 12 months',
  metricName: 'wikipedia_monthly_pageviews_median',
  unit: 'pageviews/month',
  purchaseIntent: 'WEAK',
  requiresCredential: false,
  termsNote: 'Public API, attribution-friendly UA requested. No commercial-use restriction known.',
  reliabilityLimitations:
    'Measures encyclopedic curiosity about a topic, not commercial demand or purchase intent. ' +
    'Only exists where a Wikipedia article exists, which excludes most long-tail commercial phrasings.',
  async fetch(candidate: Candidate, signal: AbortSignal): Promise<FetchResult> {
    const started = Date.now();
    if (!candidate.wikiTitle) {
      return {
        ok: false, reason: 'NOT_FOUND', requestCount: 0, latencyMs: 0,
        detail: 'No Wikipedia article maps to this candidate.',
      };
    }
    try {
      const end = new Date();
      const start = new Date(end.getTime() - 365 * 864e5);
      const fmt = (d: Date) => d.toISOString().slice(0, 10).replace(/-/g, '') + '00';
      const url =
        `https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/en.wikipedia/` +
        `all-access/user/${encodeURIComponent(candidate.wikiTitle)}/monthly/${fmt(start)}/${fmt(end)}`;
      const { status, body, latencyMs } = await getJson(url, signal);
      if (status !== 200) {
        return { ok: false, reason: classify(status), detail: `HTTP ${status}`, requestCount: 1, latencyMs };
      }
      const items = (body as { items?: { views: number }[] }).items ?? [];
      if (!items.length) {
        return { ok: false, reason: 'NOT_FOUND', detail: 'no pageview items', requestCount: 1, latencyMs };
      }
      const views = items.map((i) => i.views).sort((a, b) => a - b);
      const median = views[Math.floor(views.length / 2)];
      return { ok: true, numericValue: median, requestCount: 1, latencyMs, raw: { months: items.length } };
    } catch (err) {
      return networkFailure(err, Date.now() - started);
    }
  },
};

/** Count of Wikipedia search results. Very weak; included to measure, not to rely on. */
export const wikipediaSearch: EvidenceSource = {
  id: 'wikipedia_search_hits',
  provider: 'MediaWiki API',
  signalType: 'search result count for the term',
  metricName: 'wikipedia_search_total_hits',
  unit: 'articles',
  purchaseIntent: 'WEAK',
  requiresCredential: false,
  termsNote: 'Public API. Rate limits apply to anonymous use.',
  reliabilityLimitations:
    'Counts encyclopedia articles mentioning the term. Essentially unrelated to commercial demand. ' +
    'Included to quantify how weak it is, not because it is expected to qualify.',
  async fetch(candidate, signal): Promise<FetchResult> {
    const started = Date.now();
    try {
      const url =
        `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=` +
        `${encodeURIComponent(candidate.term)}&srlimit=1&format=json&origin=*`;
      const { status, body, latencyMs } = await getJson(url, signal);
      if (status !== 200) {
        return { ok: false, reason: classify(status), detail: `HTTP ${status}`, requestCount: 1, latencyMs };
      }
      const hits = (body as { query?: { searchinfo?: { totalhits?: number } } })?.query?.searchinfo?.totalhits;
      if (typeof hits !== 'number') {
        return { ok: false, reason: 'UNPARSEABLE', detail: 'no totalhits', requestCount: 1, latencyMs };
      }
      return { ok: true, numericValue: hits, requestCount: 1, latencyMs, raw: { hits } };
    } catch (err) {
      return networkFailure(err, Date.now() - started);
    }
  },
};

/**
 * StackExchange question volume. INDIRECT: people asking questions about a
 * problem is evidence the problem exists and is felt, though not that anyone
 * would pay to solve it.
 */
export const stackExchangeQuestions: EvidenceSource = {
  id: 'stackexchange_questions',
  provider: 'Stack Exchange API 2.3',
  signalType: 'matching question count across Stack Overflow',
  metricName: 'stackoverflow_question_count',
  unit: 'questions',
  purchaseIntent: 'INDIRECT',
  requiresCredential: false,
  termsNote:
    'Anonymous quota is ~300 requests/day per IP. A registered key raises it to ~10,000/day. ' +
    'Anonymous quota is the binding constraint for repeated probing.',
  reliabilityLimitations:
    'Developer-facing topics only. Consumer niches return near-zero regardless of real demand, ' +
    'so a zero here is uninformative rather than negative evidence.',
  async fetch(candidate, signal): Promise<FetchResult> {
    const started = Date.now();
    try {
      const url =
        `https://api.stackexchange.com/2.3/search/advanced?order=desc&sort=activity` +
        `&q=${encodeURIComponent(candidate.term)}&site=stackoverflow&filter=total`;
      const { status, body, latencyMs } = await getJson(url, signal);
      if (status !== 200) {
        return { ok: false, reason: classify(status), detail: `HTTP ${status}`, requestCount: 1, latencyMs };
      }
      const total = (body as { total?: number }).total;
      if (typeof total !== 'number') {
        return { ok: false, reason: 'UNPARSEABLE', detail: JSON.stringify(body).slice(0, 150), requestCount: 1, latencyMs };
      }
      return { ok: true, numericValue: total, requestCount: 1, latencyMs, raw: { total } };
    } catch (err) {
      return networkFailure(err, Date.now() - started);
    }
  },
};

/** Hacker News discussion volume. INDIRECT, and skewed hard toward tech. */
export const hackerNewsMentions: EvidenceSource = {
  id: 'hn_algolia_mentions',
  provider: 'HN Search (Algolia)',
  signalType: 'story count mentioning the term',
  metricName: 'hn_story_count',
  unit: 'stories',
  purchaseIntent: 'INDIRECT',
  requiresCredential: false,
  termsNote: 'Public API, no key. Documented soft limit ~10,000 requests/hour.',
  reliabilityLimitations:
    'Audience is overwhelmingly technical. Consumer and craft niches are systematically ' +
    'under-represented, so low counts do not indicate low demand.',
  async fetch(candidate, signal): Promise<FetchResult> {
    const started = Date.now();
    try {
      const url = `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(candidate.term)}&tags=story&hitsPerPage=1`;
      const { status, body, latencyMs } = await getJson(url, signal);
      if (status !== 200) {
        return { ok: false, reason: classify(status), detail: `HTTP ${status}`, requestCount: 1, latencyMs };
      }
      const nb = (body as { nbHits?: number }).nbHits;
      if (typeof nb !== 'number') {
        return { ok: false, reason: 'UNPARSEABLE', detail: 'no nbHits', requestCount: 1, latencyMs };
      }
      return { ok: true, numericValue: nb, requestCount: 1, latencyMs, raw: { nbHits: nb } };
    } catch (err) {
      return networkFailure(err, Date.now() - started);
    }
  },
};

/**
 * npm weekly downloads. INDIRECT and genuinely useful — but only for
 * developer-tool candidates, which is a narrow slice of the universe.
 */
export const npmDownloads: EvidenceSource = {
  id: 'npm_weekly_downloads',
  provider: 'npm registry API',
  signalType: 'weekly downloads for a related package',
  metricName: 'npm_weekly_downloads',
  unit: 'downloads/week',
  purchaseIntent: 'INDIRECT',
  requiresCredential: false,
  termsNote: 'Public API, no key, generous limits.',
  reliabilityLimitations:
    'Only applies where a candidate maps to an npm package. Downloads include CI and mirrors, ' +
    'so absolute values overstate human users. Says nothing about willingness to pay.',
  async fetch(candidate, signal): Promise<FetchResult> {
    const started = Date.now();
    if (!candidate.packageName) {
      return { ok: false, reason: 'NOT_FOUND', requestCount: 0, latencyMs: 0, detail: 'not a package-mapped candidate' };
    }
    try {
      const url = `https://api.npmjs.org/downloads/point/last-week/${encodeURIComponent(candidate.packageName)}`;
      const { status, body, latencyMs } = await getJson(url, signal);
      if (status !== 200) {
        return { ok: false, reason: classify(status), detail: `HTTP ${status}`, requestCount: 1, latencyMs };
      }
      const dl = (body as { downloads?: number }).downloads;
      if (typeof dl !== 'number') {
        return { ok: false, reason: 'UNPARSEABLE', detail: 'no downloads', requestCount: 1, latencyMs };
      }
      return { ok: true, numericValue: dl, requestCount: 1, latencyMs, raw: { downloads: dl } };
    } catch (err) {
      return networkFailure(err, Date.now() - started);
    }
  },
};

/**
 * Etsy active listing count. DIRECT — a real commercial marketplace signal,
 * and the closest thing here to purchase intent.
 *
 * Attempted WITHOUT a credential on purpose. If it fails as NO_CREDENTIAL, that
 * is the finding: the only DIRECT source available requires owner setup, which
 * belongs in the report rather than being quietly dropped from the denominator.
 */
export const etsyListings: EvidenceSource = {
  id: 'etsy_active_listings',
  provider: 'Etsy Open API v3',
  signalType: 'active listing count for a keyword',
  metricName: 'etsy_active_listing_count',
  unit: 'listings',
  purchaseIntent: 'DIRECT',
  requiresCredential: true,
  credentialEnvVar: 'ETSY_API_KEY',
  termsNote:
    'Requires a registered app and approved API key. Commercial/automation terms must be ' +
    'verified against Etsy developer policy BEFORE any Campaign depends on this.',
  reliabilityLimitations:
    'Listing counts measure SUPPLY, not demand. High counts may mean a healthy market or a ' +
    'saturated one; the number alone does not distinguish them.',
  async fetch(candidate, signal): Promise<FetchResult> {
    const started = Date.now();
    const key = process.env.ETSY_API_KEY;
    if (!key) {
      return {
        ok: false, reason: 'NO_CREDENTIAL', requestCount: 0, latencyMs: 0,
        detail: 'ETSY_API_KEY not set — requires owner app registration.',
      };
    }
    try {
      const url =
        `https://openapi.etsy.com/v3/application/listings/active?limit=1&keywords=` +
        `${encodeURIComponent(candidate.term)}`;
      const { status, body, latencyMs } = await getJson(url, signal, { 'x-api-key': key });
      if (status !== 200) {
        return { ok: false, reason: classify(status), detail: `HTTP ${status}`, requestCount: 1, latencyMs };
      }
      const count = (body as { count?: number }).count;
      if (typeof count !== 'number') {
        return { ok: false, reason: 'UNPARSEABLE', detail: 'no count', requestCount: 1, latencyMs };
      }
      return { ok: true, numericValue: count, requestCount: 1, latencyMs, raw: { count } };
    } catch (err) {
      return networkFailure(err, Date.now() - started);
    }
  },
};

export const ALL_SOURCES: EvidenceSource[] = [
  wikipediaPageviews,
  wikipediaSearch,
  stackExchangeQuestions,
  hackerNewsMentions,
  npmDownloads,
  etsyListings,
];
