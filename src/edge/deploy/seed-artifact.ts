/**
 * Emit the SQL that seeds the fixture artifact into D1's edge_object table.
 *
 * D1 stands in for R2 only while the artifact is fixture-sized; the base64 body
 * of a ~1 KB HTML file is a few kilobytes of SQL. Real products belong in R2
 * behind the same ObjectStore port.
 */

import { fixtureArtifact } from '../fixture-catalog.ts';
import { FIXTURE_ARTIFACT_KEY } from '../fixture-catalog.ts';

const artifact = fixtureArtifact();
const body = Buffer.from(artifact.bytes).toString('base64');
const escape = (value: string) => value.replaceAll("'", "''");

process.stdout.write(
  `INSERT INTO edge_object (key, media_type, file_name, sha256, body_base64)\n` +
    `VALUES ('${escape(FIXTURE_ARTIFACT_KEY)}', '${escape(artifact.mediaType)}', ` +
    `'${escape(artifact.fileName)}', '${escape(artifact.sha256)}', '${escape(body)}')\n` +
    `ON CONFLICT (key) DO UPDATE SET\n` +
    `  media_type = excluded.media_type,\n` +
    `  file_name = excluded.file_name,\n` +
    `  sha256 = excluded.sha256,\n` +
    `  body_base64 = excluded.body_base64;\n`,
);
