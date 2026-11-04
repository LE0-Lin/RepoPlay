import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readBounded, readRequestBytes, readRequestJson } from '../lib/bounded';

function request(body: ReadableStream<Uint8Array>, signal?: AbortSignal) {
  return new Request('http://localhost/api/tour/validate', { method:'POST', body, signal, duplex:'half' } as RequestInit);
}

test('request timeout cancels a stalled producer without waiting for its acknowledgment', async () => {
  let cancelled = false;
  const stream = new ReadableStream<Uint8Array>({
    start(controller) { controller.enqueue(new TextEncoder().encode('{')); },
    cancel() { cancelled = true; return new Promise<void>(() => {}); }
  });
  await assert.rejects(() => readRequestBytes(request(stream), 100, 10), { code:'TIMEOUT', status:408 });
  assert.equal(cancelled, true);
  assert.equal(stream.locked, false);
});

test('client abort cancels an in-flight request reader and returns a bounded product error', async () => {
  let cancelled = false;
  const stream = new ReadableStream<Uint8Array>({ cancel() { cancelled = true; } });
  const controller = new AbortController();
  const read = readRequestBytes(request(stream, controller.signal), 100);
  controller.abort();
  await assert.rejects(() => read, { code:'REQUEST_ABORTED', status:408 });
  assert.equal(cancelled, true);
  assert.equal(stream.locked, false);
});

test('declared and streamed size limits cancel reads; an exact-size response is accepted', async () => {
  for (const declared of [true, false]) {
    let cancelled = false;
    const stream = new ReadableStream<Uint8Array>({
      start(controller) { controller.enqueue(new Uint8Array(5)); },
      cancel() { cancelled = true; }
    });
    await assert.rejects(() => readBounded(new Response(stream, { headers:declared?{'content-length':'5'}:{} }), 4), { code:'READ_LIMIT', status:413 });
    assert.equal(cancelled, true);
    assert.equal(stream.locked, false);
  }
  assert.equal((await readBounded(new Response('1234'), 4)).length, 4);
});

test('request JSON rejects malformed UTF-8 instead of silently replacing bytes', async () => {
  await assert.rejects(() => readRequestJson(new Request('http://localhost/api/tour/validate', { method:'POST', body:new Uint8Array([0xff]) }), 100), { code:'INVALID_JSON' });
});
