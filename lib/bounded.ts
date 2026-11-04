import { ProductError } from "./errors";
export async function readBounded(response: Response, maximum: number, signal?: AbortSignal) {
  if (signal?.aborted) { void response.body?.cancel(signal.reason).catch(() => {}); signal.throwIfAborted(); }
  const size = Number(response.headers.get("content-length"));
  if (Number.isFinite(size) && size > maximum) { void response.body?.cancel().catch(() => {}); throw new ProductError("READ_LIMIT", "The response exceeded the allowed reading size.", 413); }
  if (!response.body) return new Uint8Array();
  const reader = response.body.getReader(); const parts: Uint8Array[] = []; let total = 0;
  // Cancel pending reads too; do not wait for an unresponsive producer to acknowledge cancellation.
  const abort = () => { void reader.cancel(signal?.reason).catch(() => {}); };
  signal?.addEventListener("abort", abort, { once: true });
  try {
    while (true) { signal?.throwIfAborted(); const { done, value } = await reader.read(); signal?.throwIfAborted(); if (done) break;
      total += value.length; if (total > maximum) { void reader.cancel().catch(() => {}); throw new ProductError("READ_LIMIT", "The response exceeded the allowed reading size.", 413); } parts.push(value);
    }
  } finally { signal?.removeEventListener("abort", abort); reader.releaseLock(); }
  const bytes = new Uint8Array(total); let offset = 0;
  for (const part of parts) { bytes.set(part, offset); offset += part.length; }
  return bytes;
}
export async function readRequestBytes(request: Request, maximum: number, timeoutMs = 5000) {
  const timeout = new AbortController();
  const timer = setTimeout(() => timeout.abort(new ProductError("TIMEOUT", "The request body took too long to read.", 408)), timeoutMs);
  try {
    return await readBounded(new Response(request.body, { headers: request.headers }), maximum, AbortSignal.any([request.signal, timeout.signal]));
  } catch (error) {
    if (request.signal.aborted) throw new ProductError("REQUEST_ABORTED", "The request was interrupted. Please try again.", 408);
    throw error;
  } finally { clearTimeout(timer); }
}
export async function readRequestJson(request: Request, maximum: number) {
  try {
    const bytes = await readRequestBytes(request, maximum);
    return JSON.parse(new TextDecoder("utf-8",{fatal:true}).decode(bytes));
  } catch(error) { if (error instanceof ProductError) throw error; throw new ProductError("INVALID_JSON","Please provide a valid JSON request."); }
}
