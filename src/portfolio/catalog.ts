import type { AssetManifest, Publication } from './types.ts';

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export function generateFixtureCatalog(
  entries: Array<{ manifest: AssetManifest; publication: Publication }>,
): string {
  const cards = [...entries]
    .sort((a, b) => a.manifest.experimentId.localeCompare(b.manifest.experimentId))
    .map(
      ({ manifest, publication }) => `    <article data-experiment-id="${escapeHtml(manifest.experimentId)}">
      <h2>${escapeHtml(manifest.source.title)}</h2>
      <p><strong>Fixture buyer:</strong> ${escapeHtml(manifest.buyer)}</p>
      <p><strong>Fixture problem:</strong> ${escapeHtml(manifest.problem)}</p>
      <p><strong>Simulated price:</strong> ${(manifest.price.amountCents / 100).toFixed(2)} ${escapeHtml(manifest.price.currency)}</p>
      <code>${escapeHtml(publication.location)}</code>
    </article>`,
    )
    .join('\n');

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Factory Phase A Fixture Catalog</title>
</head>
<body>
  <header>
    <h1>Factory Phase A Fixture Catalog</h1>
    <p>NONCOMMERCIAL LOCAL FIXTURE. NO PRODUCTS ARE FOR SALE. NO CHECKOUT EXISTS.</p>
  </header>
  <main>
${cards}
  </main>
</body>
</html>
`;
}
