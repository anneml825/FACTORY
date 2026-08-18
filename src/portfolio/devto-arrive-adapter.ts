import { createHash } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import type { ArriveAdapter } from './ports.ts';
import type {
  ArrivalGateRecord,
  ArrivalMetrics,
  ArrivalPublication,
  AssetManifest,
  Publication,
} from './types.ts';

export interface DevToRequest {
  method: 'GET' | 'POST' | 'PUT';
  path: string;
  body?: Record<string, unknown>;
}

export interface DevToTransport {
  request<T>(request: DevToRequest): Promise<T>;
}

export class DevToHttpTransport implements DevToTransport {
  private readonly apiKey: string;

  constructor(apiKey: string) {
    if (!apiKey.trim()) throw new Error('DEV Community API key is required.');
    this.apiKey = apiKey;
  }

  async request<T>(request: DevToRequest): Promise<T> {
    const response = await fetch(`https://dev.to${request.path}`, {
      method: request.method,
      headers: {
        'api-key': this.apiKey,
        'content-type': 'application/json',
        'user-agent': 'Factory-ARRIVE/phase-c',
      },
      body: request.body ? JSON.stringify(request.body) : undefined,
    });
    const body = await response.json().catch(() => ({})) as Record<string, unknown>;
    if (!response.ok) {
      throw new Error(`DEV Community API ${response.status}: ${String(body.error ?? body.message ?? 'request failed')}`);
    }
    return body as T;
  }
}

interface DevToArticleSummary {
  id: number;
  title: string;
  description: string;
  url: string;
  published?: boolean;
  positive_reactions_count?: number;
  comments_count?: number;
  user?: DevToPublicIdentity;
}

interface DevToPublicIdentity {
  id?: number;
  name?: string;
  username?: string;
  github_username?: string | null;
  twitter_username?: string | null;
}

interface DevToAnalyticsTotals {
  page_views?: number;
  reactions_count?: number;
  comments_count?: number;
  views?: number;
  total_views?: number;
  reactions?: number;
  total_reactions?: number;
  comments?: number;
  total_comments?: number;
}

interface StoredDevToArrival {
  experimentId: string;
  idempotencyKey: string;
  requestFingerprint: string;
  articleId: number;
  publication: ArrivalPublication;
}

export interface DevToArrivalStore {
  get(experimentId: string): Promise<StoredDevToArrival | null>;
  save(record: StoredDevToArrival): Promise<void>;
}

export class InMemoryDevToArrivalStore implements DevToArrivalStore {
  private readonly records = new Map<string, StoredDevToArrival>();

  async get(experimentId: string): Promise<StoredDevToArrival | null> {
    return structuredClone(this.records.get(experimentId) ?? null);
  }

  async save(record: StoredDevToArrival): Promise<void> {
    this.records.set(record.experimentId, structuredClone(record));
  }
}

interface DevToArrivalFile {
  schemaVersion: 1;
  records: Record<string, StoredDevToArrival>;
}

export class JsonDevToArrivalStore implements DevToArrivalStore {
  private readonly path: string;

  constructor(path: string) {
    this.path = path;
  }

  async get(experimentId: string): Promise<StoredDevToArrival | null> {
    const state = await this.read();
    return structuredClone(state.records[experimentId] ?? null);
  }

  async save(record: StoredDevToArrival): Promise<void> {
    const state = await this.read();
    state.records[record.experimentId] = structuredClone(record);
    await mkdir(dirname(this.path), { recursive: true });
    const temporary = `${this.path}.tmp`;
    await writeFile(temporary, `${JSON.stringify(state, null, 2)}\n`, { mode: 0o600 });
    await rename(temporary, this.path);
  }

  private async read(): Promise<DevToArrivalFile> {
    try {
      const parsed = JSON.parse(await readFile(this.path, 'utf8')) as DevToArrivalFile;
      if (parsed.schemaVersion !== 1 || typeof parsed.records !== 'object') {
        throw new Error('Unsupported DEV ARRIVE state schema.');
      }
      return parsed;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return { schemaVersion: 1, records: {} };
      }
      throw error;
    }
  }
}

function integer(value: unknown): number | null {
  return Number.isInteger(value) && (value as number) >= 0 ? value as number : null;
}

function metricObject(value: unknown): DevToAnalyticsTotals | null {
  if (Array.isArray(value)) {
    if (value.length === 0) return null;
    if (value.length !== 1) throw new Error('DEV analytics totals returned multiple aggregate records.');
    return metricObject(value[0]);
  }
  if (!value || typeof value !== 'object') return null;
  const record = value as Record<string, unknown>;
  if (record.totals !== undefined) return metricObject(record.totals);
  if (record.data !== undefined) return metricObject(record.data);
  return record as DevToAnalyticsTotals;
}

function parseTotals(value: unknown, emptyMeansZero = false): { views: number; reactions: number; comments: number } {
  const metrics = metricObject(value);
  if (!metrics && emptyMeansZero) return { views: 0, reactions: 0, comments: 0 };
  if (!metrics) throw new Error('DEV analytics response contained no aggregate metrics.');
  const views = integer(metrics.page_views) ?? integer(metrics.views) ?? integer(metrics.total_views);
  const reactions = integer(metrics.reactions_count) ?? integer(metrics.reactions) ?? integer(metrics.total_reactions) ?? 0;
  const comments = integer(metrics.comments_count) ?? integer(metrics.comments) ?? integer(metrics.total_comments) ?? 0;
  if (views === null) {
    throw new Error('DEV analytics response did not expose a recognized non-negative view total.');
  }
  return { views, reactions, comments };
}

function requestFingerprint(
  manifest: AssetManifest,
  publication: Publication,
  idempotencyKey: string,
): string {
  return createHash('sha256')
    .update(JSON.stringify({ manifest, publication, idempotencyKey }))
    .digest('hex');
}

function marker(fingerprint: string): string {
  return `Factory Phase C fixture ${fingerprint.slice(0, 16)}`;
}

function arrivalPublicationId(fingerprint: string): string {
  return `factory_arrive_${fingerprint.slice(0, 32)}`;
}

function attributedCheckoutUrl(publication: Publication, arrivalId: string): string {
  const url = new URL(publication.location);
  url.searchParams.set('client_reference_id', arrivalId);
  return url.toString();
}

function articleBody(
  manifest: AssetManifest,
  publication: Publication,
  identity: string,
  arrivalId: string,
): string {
  return [
    `# A tiny checklist for testing idempotent event pipelines`,
    '',
    'This is a deliberately noncommercial engineering fixture. It exists to test whether a',
    'public discovery surface can be published and measured without recurring manual work.',
    '',
    'A useful idempotency check should prove four things:',
    '',
    '1. the same provider event can be delivered twice without duplicating an effect;',
    '2. a reused event ID with changed bytes is rejected;',
    '3. a crash after durable receipt can recover by replaying the journal;',
    '4. owner and internal tests remain excluded from commercial evidence.',
    '',
    `Experiment: \`${manifest.experimentId}\``,
    '',
    `[Open the clearly labeled Stripe sandbox fixture](${attributedCheckoutUrl(publication, arrivalId)})`,
    '',
    'The linked checkout is Stripe test mode. It cannot move real money and is not a product.',
    '',
    `<!-- ${identity} -->`,
  ].join('\n');
}

/**
 * First real ARRIVE pilot. DEV is one adapter in a portfolio, not a default channel.
 * Its page-view metric is a lower-funnel qualified exposure; feed impressions and
 * outbound link clicks are not exposed and are never inferred.
 */
export class DevToArriveAdapter implements ArriveAdapter {
  readonly adapterId = 'devto-arrive-v1';
  readonly mode = 'LIVE' as const;
  readonly costProfile = { maximumCents: 0, currency: 'USD', bucketName: 'validation' };
  private readonly transport: DevToTransport;
  private readonly store: DevToArrivalStore;
  private readonly tag: string;
  private readonly expectedPublicName: string;
  private readonly expectedPublicUsername: string;

  constructor(options: {
    transport: DevToTransport;
    store?: DevToArrivalStore;
    tag?: string;
    expectedPublicName: string;
    expectedPublicUsername: string;
  }) {
    this.transport = options.transport;
    this.store = options.store ?? new InMemoryDevToArrivalStore();
    this.tag = options.tag ?? 'webdev';
    this.expectedPublicName = options.expectedPublicName.trim();
    this.expectedPublicUsername = options.expectedPublicUsername.trim().toLowerCase();
    if (!this.expectedPublicName || !this.expectedPublicUsername) {
      throw new Error('DEV publication requires an explicit expected Factory public identity.');
    }
  }

  async evaluateGate(manifest: AssetManifest, _idempotencyKey: string): Promise<ArrivalGateRecord> {
    if (!manifest.noncommercialFixture) {
      throw new Error('Phase C DEV adapter accepts noncommercial fixtures only.');
    }
    const authenticatedIdentity = await this.transport.request<DevToPublicIdentity>({
      method: 'GET',
      path: '/api/users/me',
    });
    this.assertFactoryIdentity(authenticatedIdentity, 'authenticated account');
    const publicIdentity = await this.transport.request<DevToPublicIdentity>({
      method: 'GET',
      path: `/api/users/by_username?url=${encodeURIComponent(this.expectedPublicUsername)}`,
    });
    this.assertFactoryIdentity(publicIdentity, 'public profile');
    const analyticsPreflight = await this.transport.request<unknown>({
      method: 'GET',
      path: '/api/analytics/totals',
    });
    if (!analyticsPreflight || typeof analyticsPreflight !== 'object') {
      throw new Error('DEV analytics preflight returned a non-object response.');
    }
    const articles = await this.transport.request<DevToArticleSummary[]>({
      method: 'GET',
      path: `/api/articles?tag=${encodeURIComponent(this.tag)}&state=fresh&per_page=10`,
    });
    if (!Array.isArray(articles) || articles.length === 0) {
      return {
        ...manifest.arrivalGate,
        adapterId: this.adapterId,
        mode: 'LIVE',
        status: 'FAILED',
      };
    }
    const observedEngagements = articles.reduce(
      (sum, article) => sum + (integer(article.positive_reactions_count) ?? 0) + (integer(article.comments_count) ?? 0),
      0,
    );
    const evidenceFingerprint = createHash('sha256')
      .update(JSON.stringify(articles.map((article) => ({
        id: article.id,
        reactions: article.positive_reactions_count ?? 0,
        comments: article.comments_count ?? 0,
      }))))
      .digest('hex')
      .slice(0, 16);
    const verifiedAt = new Date().toISOString();
    return {
      adapterId: this.adapterId,
      mode: 'LIVE',
      status: 'PASSED',
      who: 'software practitioners reading the DEV Community fresh-article feed',
      where: `DEV Community tag feed: ${this.tag}`,
      surface: `https://dev.to/t/${this.tag}/latest`,
      permittedReason: 'DEV documents API article publishing; the fixture is substantial, on-topic, noncommercial content rather than a backlink-only post.',
      quantitativeEvidenceId: `devto-fresh:${this.tag}:n=${articles.length}:engagements=${observedEngagements}:sha=${evidenceFingerprint}`,
      measurementInstrument: 'DEV authenticated per-article analytics totals API',
      measurementVerifiedAt: verifiedAt,
    };
  }

  async activate(
    manifest: AssetManifest,
    publication: Publication,
    idempotencyKey: string,
  ): Promise<ArrivalPublication> {
    if (!manifest.noncommercialFixture || publication.mode !== 'PROVIDER_TEST') {
      throw new Error('DEV Phase C activation requires a noncommercial Stripe provider-test fixture.');
    }
    const fingerprint = requestFingerprint(manifest, publication, idempotencyKey);
    const stored = await this.store.get(manifest.experimentId);
    if (stored) {
      if (stored.idempotencyKey !== idempotencyKey || stored.requestFingerprint !== fingerprint) {
        throw new Error('DEV ARRIVE conflict: experiment was activated with different semantics.');
      }
      return stored.publication;
    }

    const identity = marker(fingerprint);
    const arrivalId = arrivalPublicationId(fingerprint);
    const existing = await this.findExisting(identity);
    const article = existing ?? await this.transport.request<DevToArticleSummary>({
      method: 'POST',
      path: '/api/articles',
      body: {
        article: {
          title: 'A tiny checklist for testing idempotent event pipelines',
          body_markdown: articleBody(manifest, publication, identity, arrivalId),
          published: true,
          description: `${identity}. Noncommercial measurement fixture.`,
          tags: `${this.tag},testing,webhooks`,
        },
      },
    });
    if (!Number.isInteger(article.id) || !article.url) {
      throw new Error('DEV article creation returned no stable article ID/URL.');
    }
    this.assertFactoryIdentity(article.user, 'created article author');
    const baseline = await this.measureArticle(article.id);
    const arrival: ArrivalPublication = {
      arrivalPublicationId: arrivalId,
      experimentId: manifest.experimentId,
      assetId: manifest.assetId,
      providerId: this.adapterId,
      providerObjectId: String(article.id),
      location: article.url,
      idempotencyKey,
      requestFingerprint: fingerprint,
      status: 'ACTIVE',
      mode: 'LIVE',
      activatedAt: new Date().toISOString(),
      baseline,
    };
    await this.store.save({
      experimentId: manifest.experimentId,
      idempotencyKey,
      requestFingerprint: fingerprint,
      articleId: article.id,
      publication: arrival,
    });
    return arrival;
  }

  async measure(arrival: ArrivalPublication): Promise<ArrivalMetrics> {
    if (arrival.providerId !== this.adapterId || !/^\d+$/.test(arrival.providerObjectId)) {
      throw new Error('DEV adapter received an arrival publication it does not own.');
    }
    return this.measureArticle(Number(arrival.providerObjectId));
  }

  async deactivate(arrival: ArrivalPublication, _idempotencyKey: string): Promise<ArrivalPublication> {
    if (arrival.providerId !== this.adapterId || !/^\d+$/.test(arrival.providerObjectId)) {
      throw new Error('DEV adapter received an arrival publication it does not own.');
    }
    await this.transport.request<DevToArticleSummary>({
      method: 'PUT',
      path: `/api/articles/${arrival.providerObjectId}`,
      body: { article: { published: false } },
    });
    const inactive = { ...arrival, status: 'INACTIVE' as const };
    const stored = await this.store.get(arrival.experimentId);
    if (stored) await this.store.save({ ...stored, publication: inactive });
    return inactive;
  }

  private async findExisting(identity: string): Promise<DevToArticleSummary | null> {
    const articles = await this.transport.request<DevToArticleSummary[]>({
      method: 'GET',
      path: '/api/articles/me/all?per_page=1000',
    });
    const matches = articles.filter((article) => article.description?.startsWith(identity));
    if (matches.length > 1) {
      throw new Error('DEV ARRIVE found duplicate provider articles; refusing to choose silently.');
    }
    return matches[0] ?? null;
  }

  private async measureArticle(articleId: number): Promise<ArrivalMetrics> {
    const totals = parseTotals(await this.transport.request<unknown>({
      method: 'GET',
      path: `/api/analytics/totals?article_id=${articleId}`,
    }), true);
    return {
      measuredAt: new Date().toISOString(),
      qualifiedExposures: totals.views,
      visits: totals.views,
      offerInteractions: totals.reactions + totals.comments,
      ownerInternalExposures: 0,
      strangerConfirmedInteractions: totals.reactions + totals.comments,
      measurementSource: `DEV per-article analytics totals, article_id=${articleId}`,
      semantics: {
        qualifiedExposures: 'PROXY: article page views after the activation baseline. DEV does not expose feed impressions; automated traffic may be present.',
        visits: 'DIRECT: article page views. This is the same provider count as qualified exposure, not an independent funnel stage.',
        offerInteractions: 'DIRECT: reactions plus comments. DEV does not expose outbound-link clicks through this API.',
      },
    };
  }

  private assertFactoryIdentity(identity: DevToPublicIdentity | undefined, source: string): void {
    if (!identity || typeof identity !== 'object') {
      throw new Error(`DEV ${source} did not expose a verifiable public identity.`);
    }
    if (identity.name !== this.expectedPublicName) {
      throw new Error(`DEV ${source} name does not match the configured Factory identity.`);
    }
    if (identity.username?.toLowerCase() !== this.expectedPublicUsername) {
      throw new Error(`DEV ${source} username does not match the configured Factory identity.`);
    }
    if (identity.github_username) {
      throw new Error(`DEV ${source} exposes a GitHub username; Factory publication is blocked.`);
    }
    if (JSON.stringify(identity).toLowerCase().includes('anneml825')) {
      throw new Error(`DEV ${source} exposes a prohibited personal identifier; Factory publication is blocked.`);
    }
  }
}
