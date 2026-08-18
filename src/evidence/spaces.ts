/**
 * Candidate search spaces for reconnaissance.
 *
 * A "search space" is not just a data source. It is a coupling of three things:
 *
 *   1. EVIDENCE   — a free, permissively-licensed quantitative signal that
 *                   discriminates among candidates in that space.
 *   2. ARRIVAL    — a measurable Stranger Arrival Mechanism, ideally the same
 *                   platform's own catalogue search.
 *   3. MONETIZATION — a normal, permitted way to charge money there.
 *
 * A space failing any one of the three is not viable, however good the other two
 * are. Developer-tool ecosystems tend to be strong on 1 and 2 and weak on 3,
 * because the norm is free software — that weakness must not be glossed over
 * simply because the data was easy to get.
 *
 * The strongest structure is one where the evidence source IS the distribution
 * surface: the same platform tells Factory what people install AND exposes the
 * offer to them. That coupling is what this reconnaissance is looking for.
 *
 * Selected to span code and non-code, free-norm and paid-norm, so the comparison
 * is not rigged toward the first ecosystem that answered.
 */

export interface SpaceProbe {
  id: string;
  /** Human-readable space. */
  name: string;
  /** What quantitative signal the API returns, if reachable. */
  signal: string;
  /** How a stranger would encounter an offer here. */
  arrivalMechanism: string;
  /** Whether charging money is normal on this platform. Assessed separately. */
  monetizationNorm: 'PAID_NORMAL' | 'FREEMIUM_NORMAL' | 'MOSTLY_FREE' | 'UNKNOWN';
  /** Build the request for a given query term. */
  request: (term: string) => { url: string; init?: RequestInit };
  /** Extract a comparable numeric usage signal from the response body. */
  extract: (body: unknown) => number | null;
  /** Whether the catalogue itself is searchable by users (arrival evidence). */
  catalogueIsSearchable: boolean;
  notes: string;
}

const UA_BROWSER =
  'Mozilla/5.0 (compatible; FactoryDataEconomicsProbe/0.1; +https://github.com/anneml825/FACTORY)';

const JSON_HEADERS = {
  'User-Agent': 'FactoryDataEconomicsProbe/0.1 (+https://github.com/anneml825/FACTORY)',
  Accept: 'application/json',
};

export const SPACES: SpaceProbe[] = [
  {
    id: 'shopify_app_store',
    name: 'Shopify App Store',
    signal: 'matching app listings and their review counts',
    arrivalMechanism: 'App Store search, and in-admin app discovery inside every Shopify store',
    monetizationNorm: 'PAID_NORMAL',
    catalogueIsSearchable: true,
    notes:
      'Strongest monetization of any candidate: Shopify Billing API charges merchants directly, ' +
      'Factory keeps 100% of the first $1M, and there is NO merchant of record to set up and NO ' +
      'payout threshold to clear. Buyers are businesses with revenue. Costs $19 one-time to ' +
      'register. Open question probed here: is there ANY free quantitative signal to screen with?',
    request: (term) => ({
      url: `https://apps.shopify.com/search?q=${encodeURIComponent(term)}`,
      init: { headers: { 'User-Agent': UA_BROWSER, Accept: 'text/html' } },
    }),
    extract: (body) => {
      // HTML, not JSON. Count listing anchors as a crude saturation proxy.
      if (typeof body !== 'string') return null;
      const matches = body.match(/\/[a-z0-9-]+"[^>]*data-controller="app-card/g);
      if (matches) return matches.length;
      const alt = body.match(/class="[^"]*app-card/g);
      return alt ? alt.length : null;
    },
  },
  {
    id: 'firefox_addons',
    name: 'Firefox Add-ons (AMO)',
    signal: 'average daily users per add-on — a REAL usage number, rare among public catalogues',
    arrivalMechanism: 'addons.mozilla.org search',
    monetizationNorm: 'MOSTLY_FREE',
    catalogueIsSearchable: true,
    notes:
      'Included as an EVIDENCE CONTROL, not a candidate. AMO publishes true daily-user counts, ' +
      'so it shows what a high-quality catalogue signal looks like. Monetization is near zero, ' +
      'so it cannot be selected — it exists here to calibrate the others.',
    request: (term) => ({
      url: `https://addons.mozilla.org/api/v5/addons/search/?q=${encodeURIComponent(term)}&page_size=5`,
      init: { headers: JSON_HEADERS },
    }),
    extract: (body) => {
      const results = (body as { results?: { average_daily_users?: number }[] })?.results;
      if (!Array.isArray(results) || !results.length) return null;
      return results.reduce((max, r) => Math.max(max, r.average_daily_users ?? 0), 0);
    },
  },
  {
    id: 'wordpress_plugins',
    name: 'WordPress.org plugin directory',
    signal: 'active installs + total downloads + rating for matching plugins',
    arrivalMechanism: 'WordPress.org plugin directory search, and the in-admin plugin search inside every WordPress site',
    monetizationNorm: 'FREEMIUM_NORMAL',
    catalogueIsSearchable: true,
    notes:
      'Open documented API, no key. Freemium (free plugin in directory, paid upgrade off-site) ' +
      'is the established norm, so evidence and monetization may both be available.',
    request: (term) => ({
      url:
        'https://api.wordpress.org/plugins/info/1.2/?action=query_plugins' +
        `&request[search]=${encodeURIComponent(term)}&request[per_page]=5`,
      init: { headers: JSON_HEADERS },
    }),
    extract: (body) => {
      const plugins = (body as { plugins?: { active_installs?: number }[] })?.plugins;
      if (!Array.isArray(plugins) || !plugins.length) return null;
      return plugins.reduce((max, p) => Math.max(max, p.active_installs ?? 0), 0);
    },
  },
  {
    id: 'vscode_extensions',
    name: 'VS Code Marketplace',
    signal: 'install count for matching extensions',
    arrivalMechanism: 'Marketplace search, and the in-editor extension search inside every VS Code install',
    monetizationNorm: 'MOSTLY_FREE',
    catalogueIsSearchable: true,
    notes: 'Install counts are real usage. Paid extensions are rare, which is a monetization problem.',
    request: (term) => ({
      url: 'https://marketplace.visualstudio.com/_apis/public/gallery/extensionquery',
      init: {
        method: 'POST',
        headers: {
          ...JSON_HEADERS,
          'Content-Type': 'application/json',
          Accept: 'application/json;api-version=3.0-preview.1',
        },
        body: JSON.stringify({
          filters: [{ criteria: [{ filterType: 10, value: term }], pageSize: 5, pageNumber: 1 }],
          flags: 914,
        }),
      },
    }),
    extract: (body) => {
      const exts = (body as {
        results?: { extensions?: { statistics?: { statisticName: string; value: number }[] }[] }[];
      })?.results?.[0]?.extensions;
      if (!Array.isArray(exts) || !exts.length) return null;
      return exts.reduce((max, e) => {
        const installs = e.statistics?.find((s) => s.statisticName === 'install')?.value ?? 0;
        return Math.max(max, installs);
      }, 0);
    },
  },
  {
    id: 'atlassian_marketplace',
    name: 'Atlassian Marketplace',
    signal: 'matching paid app listings',
    arrivalMechanism: 'Marketplace search, plus in-product app discovery inside Jira/Confluence',
    monetizationNorm: 'PAID_NORMAL',
    catalogueIsSearchable: true,
    notes:
      'Paid apps are the NORM here, not the exception — the strongest monetization profile of ' +
      'any candidate. Business buyers with budgets. Question is whether Factory can build and ' +
      'publish to it autonomously.',
    request: (term) => ({
      url: `https://marketplace.atlassian.com/rest/2/addons?text=${encodeURIComponent(term)}&limit=5`,
      init: { headers: JSON_HEADERS },
    }),
    extract: (body) => {
      const b = body as { _embedded?: { addons?: unknown[] }; count?: number };
      if (typeof b?.count === 'number') return b.count;
      const addons = b?._embedded?.addons;
      return Array.isArray(addons) ? addons.length : null;
    },
  },
  {
    id: 'pypi_packages',
    name: 'PyPI / Python ecosystem',
    signal: 'recent download counts',
    arrivalMechanism: 'PyPI search and Google queries for library problems',
    monetizationNorm: 'MOSTLY_FREE',
    catalogueIsSearchable: true,
    notes: 'Free API. Same monetization weakness as npm — paying for a Python library is unusual.',
    request: (term) => ({
      url: `https://pypistats.org/api/packages/${encodeURIComponent(term.toLowerCase().replace(/\s+/g, '-'))}/recent`,
      init: { headers: JSON_HEADERS },
    }),
    extract: (body) => {
      const d = (body as { data?: { last_month?: number } })?.data?.last_month;
      return typeof d === 'number' ? d : null;
    },
  },
  {
    id: 'obsidian_plugins',
    name: 'Obsidian community plugins',
    signal: 'per-plugin download counts (single public JSON, whole catalogue)',
    arrivalMechanism: 'In-app community plugin browser, searched by every Obsidian user',
    monetizationNorm: 'MOSTLY_FREE',
    catalogueIsSearchable: true,
    notes:
      'Entire catalogue with download counts in one public file — near-zero screening cost. ' +
      'Small audience and a strong free norm.',
    request: () => ({
      url: 'https://raw.githubusercontent.com/obsidianmd/obsidian-releases/master/community-plugin-stats.json',
      init: { headers: { ...JSON_HEADERS, Accept: 'application/json' } },
    }),
    extract: (body) => {
      if (!body || typeof body !== 'object') return null;
      const entries = Object.values(body as Record<string, { downloads?: number }>);
      if (!entries.length) return null;
      return entries.reduce((max, e) => Math.max(max, e?.downloads ?? 0), 0);
    },
  },
  {
    id: 'dockerhub_images',
    name: 'Docker Hub',
    signal: 'pull counts for matching images',
    arrivalMechanism: 'Docker Hub search',
    monetizationNorm: 'MOSTLY_FREE',
    catalogueIsSearchable: true,
    notes: 'Pull counts are real usage but heavily inflated by CI. Monetization is very weak.',
    request: (term) => ({
      url: `https://hub.docker.com/v2/search/repositories/?query=${encodeURIComponent(term)}&page_size=5`,
      init: { headers: JSON_HEADERS },
    }),
    extract: (body) => {
      const results = (body as { results?: { pull_count?: number }[] })?.results;
      if (!Array.isArray(results) || !results.length) return null;
      return results.reduce((max, r) => Math.max(max, r.pull_count ?? 0), 0);
    },
  },
  {
    id: 'crates_rust',
    name: 'crates.io / Rust ecosystem',
    signal: 'crate download counts',
    arrivalMechanism: 'crates.io search',
    monetizationNorm: 'MOSTLY_FREE',
    catalogueIsSearchable: true,
    notes: 'Confirmed reachable. Strong free norm; paid Rust crates are essentially nonexistent.',
    request: (term) => ({
      url: `https://crates.io/api/v1/crates?q=${encodeURIComponent(term)}&per_page=5`,
      init: { headers: JSON_HEADERS },
    }),
    extract: (body) => {
      const crates = (body as { crates?: { downloads?: number }[] })?.crates;
      if (!Array.isArray(crates) || !crates.length) return null;
      return crates.reduce((max, c) => Math.max(max, c.downloads ?? 0), 0);
    },
  },
  {
    id: 'homeassistant_hacs',
    name: 'Home Assistant custom integrations (HACS)',
    signal: 'GitHub stars on integration repos as a usage proxy',
    arrivalMechanism: 'HACS in-app browser inside Home Assistant installs',
    monetizationNorm: 'MOSTLY_FREE',
    catalogueIsSearchable: true,
    notes:
      'Prosumer audience that already spends money on hardware, which is unusual among the ' +
      'code-adjacent spaces. Stars are a weak usage proxy.',
    request: (term) => ({
      url:
        'https://api.github.com/search/repositories?q=' +
        encodeURIComponent(`${term} home-assistant`) +
        '&sort=stars&per_page=5',
      init: { headers: { ...JSON_HEADERS, Accept: 'application/vnd.github+json' } },
    }),
    extract: (body) => {
      const items = (body as { items?: { stargazers_count?: number }[] })?.items;
      if (!Array.isArray(items) || !items.length) return null;
      return items.reduce((max, i) => Math.max(max, i.stargazers_count ?? 0), 0);
    },
  },
];

/**
 * Probe terms. Deliberately generic problem-shaped phrases rather than known
 * product names, so a space is measured on whether it can answer questions
 * Factory would actually ask, not on whether a famous package exists.
 */
export const SPACE_PROBE_TERMS = [
  'backup',
  'invoice',
  'booking calendar',
  'seo',
  'inventory',
  'form builder',
  'analytics dashboard',
  'image optimization',
  'membership',
  'csv import',
  'time tracking',
  'pdf export',
];
