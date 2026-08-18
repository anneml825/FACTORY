import { createHash } from 'node:crypto';
import type { Artifact, AssetManifest, QaResult, SpreadsheetSource } from './types.ts';

const encoder = new TextEncoder();

function digest(bytes: Uint8Array): string {
  return createHash('sha256').update(bytes).digest('hex');
}

function slug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function csvCell(value: string | number): string {
  const text = String(value);
  const injectionSafe = /^[=+@-]/.test(text) ? `'${text}` : text;
  return /[",\n\r]/.test(injectionSafe)
    ? `"${injectionSafe.replaceAll('"', '""')}"`
    : injectionSafe;
}

export function renderShortDocument(manifest: AssetManifest): Artifact {
  if (manifest.source.kind !== 'SHORT_DOCUMENT') {
    throw new TypeError('Short-document renderer received a non-document manifest.');
  }
  const source = manifest.source;
  const sections = source.sections
    .map(
      (section) =>
        `  <section>\n    <h2>${escapeHtml(section.heading)}</h2>\n    <p>${escapeHtml(section.body)}</p>\n  </section>`,
    )
    .join('\n');
  // The fixture banner exists so a fixture can never be mistaken for a product.
  // A commercial artifact must not carry it, and functional QA checks both ways.
  const banner = manifest.noncommercialFixture
    ? '  <aside>PHASE A NONCOMMERCIAL FIXTURE — NOT FOR SALE</aside>\n'
    : '';
  const html = `<!doctype html>\n<html lang="en">\n<head>\n  <meta charset="utf-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1">\n  <title>${escapeHtml(source.title)}</title>\n</head>\n<body>\n${banner}  <main data-experiment-id="${escapeHtml(manifest.experimentId)}">\n    <h1>${escapeHtml(source.title)}</h1>\n    <p>${escapeHtml(source.summary)}</p>\n${sections}\n  </main>\n</body>\n</html>\n`;
  const bytes = encoder.encode(html);
  return {
    assetId: manifest.assetId,
    experimentId: manifest.experimentId,
    fileName: `${slug(source.title)}.html`,
    mediaType: 'text/html; charset=utf-8',
    bytes,
    sha256: digest(bytes),
    rendererId: manifest.noncommercialFixture ? 'fixture-short-document-v1' : 'short-document-v1',
  };
}

export function renderSpreadsheet(manifest: AssetManifest): Artifact {
  if (manifest.source.kind !== 'SPREADSHEET') {
    throw new TypeError('Spreadsheet renderer received a non-spreadsheet manifest.');
  }
  const source: SpreadsheetSource = manifest.source;
  const rows = [source.columns, ...source.rows]
    .map((row) => row.map(csvCell).join(','))
    .join('\r\n');
  const banner = manifest.noncommercialFixture
    ? '# PHASE A NONCOMMERCIAL FIXTURE — NOT FOR SALE\r\n'
    : '';
  const csv = `${banner}# experiment_id=${manifest.experimentId}\r\n${rows}\r\n`;
  const bytes = encoder.encode(csv);
  return {
    assetId: manifest.assetId,
    experimentId: manifest.experimentId,
    fileName: `${slug(source.title)}.csv`,
    mediaType: 'text/csv; charset=utf-8',
    bytes,
    sha256: digest(bytes),
    rendererId: manifest.noncommercialFixture ? 'fixture-spreadsheet-csv-v1' : 'spreadsheet-csv-v1',
  };
}

export function renderAsset(manifest: AssetManifest): Artifact {
  return manifest.source.kind === 'SHORT_DOCUMENT'
    ? renderShortDocument(manifest)
    : renderSpreadsheet(manifest);
}

export function runFunctionalQa(manifest: AssetManifest, artifact: Artifact): QaResult {
  const failures: string[] = [];
  const fixture = manifest.noncommercialFixture;
  const checks = [
    'artifact bytes are non-empty',
    'artifact carries the manifest asset_id',
    'artifact carries the manifest experiment_id',
    'artifact checksum matches rendered bytes',
    fixture
      ? 'fixture is visibly marked noncommercial'
      : 'commercial artifact does not carry the noncommercial fixture marker',
  ];
  const text = new TextDecoder().decode(artifact.bytes);
  if (artifact.bytes.length === 0) failures.push(checks[0]);
  if (artifact.assetId !== manifest.assetId) failures.push(checks[1]);
  if (artifact.experimentId !== manifest.experimentId || !text.includes(manifest.experimentId)) {
    failures.push(checks[2]);
  }
  if (digest(artifact.bytes) !== artifact.sha256) failures.push(checks[3]);
  // The marker must be present on a fixture and absent on a commercial artifact.
  // Both directions matter: an unmarked fixture can be mistaken for a product,
  // and a marked product tells the buyer it is not for sale.
  if (text.includes('NONCOMMERCIAL FIXTURE') !== fixture) failures.push(checks[4]);
  return { passed: failures.length === 0, checks, failures, mode: fixture ? 'FIXTURE' : 'COMMERCIAL' };
}

export function runFixtureValueQa(manifest: AssetManifest): QaResult {
  const checks = [
    'buyer is explicit',
    'problem is explicit',
    'promise is explicit',
    'price uses positive integer cents',
    'fixture cannot be mistaken for a commercial asset',
  ];
  const failures: string[] = [];
  if (!manifest.buyer.trim()) failures.push(checks[0]);
  if (!manifest.problem.trim()) failures.push(checks[1]);
  if (!manifest.promise.trim()) failures.push(checks[2]);
  if (!Number.isInteger(manifest.price.amountCents) || manifest.price.amountCents <= 0) {
    failures.push(checks[3]);
  }
  if (!manifest.noncommercialFixture) failures.push(checks[4]);
  return { passed: failures.length === 0, checks, failures, mode: 'FIXTURE' };
}
