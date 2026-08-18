import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CostController } from './cost-control.ts';
import { PhaseAEngine } from './engine.ts';
import {
  FakeLocalPutProvider,
  FixtureArrivalAdapter,
  FixtureMakeAdapter,
} from './fake-adapters.ts';
import { InMemoryWatchStore } from './watch.ts';
import { generateFixtureCatalog } from './catalog.ts';
import { shortDocumentFixture, spreadsheetFixture } from './fixtures.ts';

const here = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(here, '../..');
const outputPath = resolve(repositoryRoot, 'state/PHASE_A_FIXTURE_CATALOG.html');
const signingSecret = 'phase-a-local-fixture-secret-not-a-real-credential';
const put = new FakeLocalPutProvider();
const engine = new PhaseAEngine({
  make: new FixtureMakeAdapter(),
  put,
  arrive: new FixtureArrivalAdapter(),
  watch: new InMemoryWatchStore(signingSecret),
  costs: new CostController(),
});

const manifests = [shortDocumentFixture(), spreadsheetFixture()];
for (const manifest of manifests) {
  engine.register(manifest);
  await engine.build(manifest.experimentId);
  engine.functionalQa(manifest.experimentId);
  engine.valueQa(manifest.experimentId);
  await engine.stage(manifest.experimentId);
  await engine.publish(manifest.experimentId, `catalog:${manifest.experimentId}`);
}

const html = generateFixtureCatalog(
  manifests.map((manifest) => {
    const record = engine.get(manifest.experimentId);
    if (!record.publication) throw new Error('Fixture catalog generation lost a publication.');
    return { manifest: record.manifest, publication: record.publication };
  }),
);
await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, html, 'utf8');
console.log(`Generated ${outputPath} (${Buffer.byteLength(html)} bytes, ${put.createdPublications} fixture publications).`);
