/**
 * COMMERCIAL SIGNAL PROBE — sources where money changing hands is observable.
 *
 * The prior reconnaissance measured SEARCHABILITY and mistook it for a business
 * case. Every source it found reported ADOPTION (installs, downloads, stars).
 * None reported PURCHASES.
 *
 * This probe deliberately targets the opposite: sources that expose prices paid,
 * transaction counts, pledged or awarded money, or advertiser spend — accepting
 * messier data in exchange for evidence that strangers actually pay.
 *
 * Three concepts kept separate from here on:
 *   SEARCHABILITY            - can Factory retrieve evidence economically?
 *   COMMERCIAL ATTRACTIVENESS - does the evidence show strangers spending money?
 *   EXPERIMENTABILITY        - can Factory enter and learn cheaply and fast?
 *
 * A source scoring well here proves the SECOND only. Entry cost and arrival
 * mechanism are assessed separately — a market can be provably lucrative and
 * still be unenterable by a new participant.
 */

import { writeFileSync, mkdirSync } from 'node:fs';

const UA = 'FactoryCommercialSignalProbe/0.1 (+https://github.com/anneml825/FACTORY)';
const DELAY_MS = 400;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

type SignalKind =
  | 'ACTUAL_TRANSACTIONS'   // real recorded purchases/awards with amounts
  | 'MONEY_COMMITTED'       // pledged/raised money
  | 'PRICE_PLUS_VOLUME'     // listed price x observable sales proxy
  | 'ADVERTISER_SPEND'      // someone is paying to promote this
  | 'ADOPTION_ONLY';        // the weak kind we already have too much of

interface Source {
  id: string;
  name: string;
  signalKind: SignalKind;
  whatItProves: string;
  requiresCredential: boolean;
  credentialNote?: string;
  setupMinutes: number;
  build: (term: string) => { url: string; init?: RequestInit };
  extract: (body: unknown) => { value: number | null; unit: string; detail?: string };
  termsNote: string;
}

const JSON_H = { 'User-Agent': UA, Accept: 'application/json' };

const SOURCES: Source[] = [
  {
    id: 'usaspending_awards',
    name: 'USAspending.gov federal award transactions',
    signalKind: 'ACTUAL_TRANSACTIONS',
    whatItProves:
      'Literal purchase records: a buyer paid a named vendor a specific dollar amount to ' +
      'solve a named problem. Not a proxy for demand — it IS demand, settled.',
    requiresCredential: false,
    setupMinutes: 0,
    termsNote: 'Public open-government API, explicitly published for programmatic use.',
    build: (term) => ({
      url: 'https://api.usaspending.gov/api/v2/search/spending_by_award/',
      init: {
        method: 'POST',
        headers: { ...JSON_H, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filters: {
            keywords: [term],
            award_type_codes: ['A', 'B', 'C', 'D'],
            time_period: [{ start_date: '2024-01-01', end_date: '2026-08-01' }],
          },
          fields: ['Award Amount', 'Recipient Name', 'Description'],
          page: 1, limit: 10, sort: 'Award Amount', order: 'desc',
        }),
      },
    }),
    extract: (body) => {
      const results = (body as { results?: { 'Award Amount'?: number }[] })?.results;
      if (!Array.isArray(results) || !results.length) return { value: 0, unit: 'USD (top award)' };
      const top = Math.max(...results.map((r) => Number(r['Award Amount'] ?? 0)));
      return { value: top, unit: 'USD (top award)', detail: `${results.length} awards returned` };
    },
  },
  {
    id: 'opencollective_money',
    name: 'Open Collective — money actually raised by projects',
    signalKind: 'MONEY_COMMITTED',
    whatItProves:
      'Real money moved to solve a problem, with public ledgers. Shows what people and ' +
      'companies voluntarily fund.',
    requiresCredential: false,
    setupMinutes: 0,
    termsNote: 'Public GraphQL API, no key for public data.',
    build: (term) => ({
      url: 'https://api.opencollective.com/graphql/v2',
      init: {
        method: 'POST',
        headers: { ...JSON_H, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `query($t:String!){accounts(searchTerm:$t,limit:10){nodes{slug stats{totalAmountReceived{valueInCents}}}}}`,
          variables: { t: term },
        }),
      },
    }),
    extract: (body) => {
      const nodes = (body as {
        data?: { accounts?: { nodes?: { stats?: { totalAmountReceived?: { valueInCents?: number } } }[] } };
      })?.data?.accounts?.nodes;
      if (!Array.isArray(nodes) || !nodes.length) return { value: 0, unit: 'USD raised (top)' };
      const top = Math.max(...nodes.map((n) => Number(n.stats?.totalAmountReceived?.valueInCents ?? 0)));
      return { value: Math.round(top / 100), unit: 'USD raised (top)', detail: `${nodes.length} collectives` };
    },
  },
  {
    id: 'steam_store',
    name: 'Steam store — paid products with prices',
    signalKind: 'PRICE_PLUS_VOLUME',
    whatItProves: 'Paid catalogue with real prices; reviews act as a purchase proxy.',
    requiresCredential: false,
    setupMinutes: 0,
    termsNote: 'Public storefront search endpoint used by the store itself.',
    build: (term) => ({
      url: `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(term)}&l=en&cc=US`,
      init: { headers: JSON_H },
    }),
    extract: (body) => {
      const items = (body as { items?: { price?: { final?: number } }[] })?.items;
      if (!Array.isArray(items) || !items.length) return { value: 0, unit: 'USD (top price)' };
      const top = Math.max(...items.map((i) => Number(i.price?.final ?? 0)));
      return { value: Math.round(top / 100), unit: 'USD (top price)', detail: `${items.length} paid items` };
    },
  },
  {
    id: 'itch_io',
    name: 'itch.io — indie paid digital goods',
    signalKind: 'PRICE_PLUS_VOLUME',
    whatItProves: 'Instant listing, paid digital products, no gatekeeper review.',
    requiresCredential: false,
    setupMinutes: 0,
    termsNote: 'Public search page; JSON availability unverified — measured here.',
    build: (term) => ({
      url: `https://itch.io/search?q=${encodeURIComponent(term)}`,
      init: { headers: { 'User-Agent': UA, Accept: 'text/html' } },
    }),
    extract: (body) => {
      if (typeof body !== 'string') return { value: null, unit: 'price markers' };
      const prices = body.match(/\$\d+(\.\d{2})?/g);
      return { value: prices ? prices.length : 0, unit: 'price markers on page' };
    },
  },
  {
    id: 'envato_codecanyon',
    name: 'Envato / CodeCanyon — per-item SALES COUNTS and prices',
    signalKind: 'PRICE_PLUS_VOLUME',
    whatItProves:
      'The highest-value missing measurement: actual units sold x actual price, per niche ' +
      'product. Direct willingness-to-pay at item level.',
    requiresCredential: true,
    credentialNote: 'Envato API personal token — free account, entered as a GitHub secret.',
    setupMinutes: 10,
    termsNote: 'Official API with documented endpoints; token is free.',
    build: (term) => ({
      url: `https://api.envato.com/v1/discovery/search/search/item?term=${encodeURIComponent(term)}&site=codecanyon.net&page_size=10`,
      init: { headers: { ...JSON_H, Authorization: `Bearer ${process.env.ENVATO_TOKEN ?? ''}` } },
    }),
    extract: (body) => {
      const matches = (body as { matches?: { number_of_sales?: number; price_cents?: number }[] })?.matches;
      if (!Array.isArray(matches) || !matches.length) return { value: 0, unit: 'top sales count' };
      const top = matches.reduce((m, x) => Math.max(m, Number(x.number_of_sales ?? 0)), 0);
      const rev = matches.reduce((s, x) => s + Number(x.number_of_sales ?? 0) * Number(x.price_cents ?? 0) / 100, 0);
      return { value: top, unit: 'top item sales count', detail: `implied gross across page: $${Math.round(rev).toLocaleString()}` };
    },
  },
];

// Problem-shaped terms spanning consumer, small-business, and B2B/government,
// so no single source is favoured by the vocabulary.
const TERMS = [
  'scheduling software', 'invoice automation', 'inventory tracking',
  'appointment reminder', 'compliance training', 'data migration',
  'document automation', 'route optimization',
];

async function main() {
  const retrievedAt = new Date().toISOString();
  const rows: Record<string, unknown>[] = [];

  for (const src of SOURCES) {
    process.stderr.write(`\n[${src.id}] `);
    const vals: (number | null)[] = [];
    const statuses: Record<string, number> = {};
    let detail = '';
    for (const term of TERMS) {
      const { url, init } = src.build(term);
      try {
        const res = await fetch(url, init);
        statuses[String(res.status)] = (statuses[String(res.status)] ?? 0) + 1;
        if (res.status === 401 || res.status === 403) { vals.push(null); process.stderr.write('k'); }
        else if (!res.ok) { vals.push(null); process.stderr.write('_'); }
        else {
          const txt = await res.text();
          let parsed: unknown; try { parsed = JSON.parse(txt); } catch { parsed = txt; }
          const r = src.extract(parsed);
          vals.push(r.value);
          if (r.detail && !detail) detail = r.detail;
          process.stderr.write(r.value === null ? '_' : '.');
        }
      } catch {
        statuses.network = (statuses.network ?? 0) + 1;
        vals.push(null); process.stderr.write('x');
      }
      await sleep(DELAY_MS);
    }
    const got = vals.filter((v): v is number => v !== null);
    const distinct = new Set(got).size;
    rows.push({
      id: src.id, name: src.name, signalKind: src.signalKind,
      whatItProves: src.whatItProves, requiresCredential: src.requiresCredential,
      credentialNote: src.credentialNote ?? null, setupMinutes: src.setupMinutes,
      termsNote: src.termsNote, statuses,
      coverage: got.length / TERMS.length,
      distinctRatio: got.length ? distinct / got.length : 0,
      nonZeroShare: got.length ? got.filter((v) => v > 0).length / got.length : 0,
      median: got.length ? [...got].sort((a, b) => a - b)[Math.floor(got.length / 2)] : null,
      max: got.length ? Math.max(...got) : null,
      sampleDetail: detail, values: vals,
    });
  }

  const L: string[] = [];
  L.push('# Commercial Signal Probe\n');
  L.push(`**Retrieved:** ${retrievedAt} · **Terms:** ${TERMS.length} · **Cost:** $0.00\n`);
  L.push('Targets sources where **money changing hands is observable**, unlike the adoption');
  L.push('metrics (installs, downloads, stars) that dominated earlier reconnaissance.\n');
  L.push('| Source | Signal kind | Coverage | Non-zero | Distinct | Median | Max | Auth | Setup |');
  L.push('|---|---|---|---|---|---|---|---|---|');
  for (const r of rows as any[]) {
    L.push(
      `| \`${r.id}\` | ${r.signalKind} | ${(r.coverage * 100).toFixed(0)}% | ${(r.nonZeroShare * 100).toFixed(0)}% ` +
      `| ${r.distinctRatio.toFixed(2)} | ${r.median ?? '—'} | ${r.max ?? '—'} ` +
      `| ${r.requiresCredential ? '**yes**' : 'no'} | ${r.setupMinutes}m |`,
    );
  }
  L.push('\n## What each proves\n');
  for (const r of rows as any[]) {
    L.push(`### \`${r.id}\` — ${r.name}\n`);
    L.push(`- **Signal kind:** ${r.signalKind}`);
    L.push(`- **Proves:** ${r.whatItProves}`);
    L.push(`- **Terms:** ${r.termsNote}`);
    if (r.credentialNote) L.push(`- **Credential:** ${r.credentialNote} (~${r.setupMinutes} min owner setup)`);
    L.push(`- **HTTP:** ${JSON.stringify(r.statuses)}`);
    if (r.sampleDetail) L.push(`- **Sample:** ${r.sampleDetail}`);
    L.push(`- **Values:** ${JSON.stringify(r.values)}`);
    L.push('');
  }

  mkdirSync('state', { recursive: true });
  writeFileSync('state/COMMERCIAL_SIGNALS.md', L.join('\n'));
  writeFileSync('state/commercial-signals.json', JSON.stringify({ retrievedAt, terms: TERMS, rows }, null, 2));
  process.stderr.write('\n\nWrote state/COMMERCIAL_SIGNALS.md\n');
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
