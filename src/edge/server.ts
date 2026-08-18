/**
 * Node HTTP adapter for the edge handler.
 *
 * This is what makes "always-on" testable and hostable today: the same
 * `createEdgeHandler` function, exposed over a real socket. Cloudflare Workers
 * is the intended deployment target (`worker.ts`), but the handler does not
 * depend on it, so the commerce path can be exercised end to end over real HTTP
 * against real PostgreSQL without any provider account.
 */

import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import type { AddressInfo } from 'node:net';
import type { EdgeEnvironment } from './types.ts';
import { createEdgeHandler } from './router.ts';

async function readBody(request: IncomingMessage): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) chunks.push(chunk as Buffer);
  return Buffer.concat(chunks);
}

export interface EdgeServer {
  server: Server;
  origin: string;
  close(): Promise<void>;
}

export async function startEdgeServer(env: EdgeEnvironment, port = 0): Promise<EdgeServer> {
  const handle = createEdgeHandler(env);
  const server = createServer((incoming: IncomingMessage, outgoing: ServerResponse) => {
    void (async () => {
      try {
        const body = await readBody(incoming);
        const origin = `http://${incoming.headers.host ?? 'localhost'}`;
        const request = new Request(new URL(incoming.url ?? '/', origin), {
          method: incoming.method ?? 'GET',
          headers: Object.entries(incoming.headers).flatMap(([key, value]) =>
            value === undefined ? [] : [[key, Array.isArray(value) ? value.join(', ') : value] as [string, string]],
          ),
          body:
            incoming.method === 'GET' || incoming.method === 'HEAD'
              ? undefined
              : (new Uint8Array(body).slice().buffer as ArrayBuffer),
          redirect: 'manual',
        });
        const response = await handle(request);
        const headers: Record<string, string | string[]> = {};
        response.headers.forEach((value, key) => {
          headers[key] = value;
        });
        outgoing.writeHead(response.status, headers);
        const payload = Buffer.from(await response.arrayBuffer());
        outgoing.end(payload);
      } catch (error) {
        outgoing.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' });
        outgoing.end(error instanceof Error ? error.message : 'edge failure');
      }
    })();
  });
  await new Promise<void>((resolve) => server.listen(port, '127.0.0.1', resolve));
  const address = server.address() as AddressInfo;
  return {
    server,
    origin: `http://127.0.0.1:${address.port}`,
    close: () => new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    ),
  };
}
