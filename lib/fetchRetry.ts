/** fetch with small retry/backoff — the free open-data endpoints and
 *  shared egress paths hiccup (429/5xx/resets); one number on a plate
 *  should not die to a transient. */
export async function fetchRetry(
  url: string,
  init?: RequestInit,
  tries = 3,
  backoffMs = 800
): Promise<Response> {
  let lastErr: unknown;
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, {
        ...init,
        signal: init?.signal ?? AbortSignal.timeout(30_000),
      });
      if (res.ok) return res;
      // retry server-side hiccups; give up fast on real client errors
      if (res.status >= 500 || res.status === 429) {
        lastErr = new Error(`HTTP ${res.status}`);
        // rate limits need a real pause, not a token one
        if (res.status === 429 && i < tries - 1) {
          await new Promise((r) => setTimeout(r, 8000));
          continue;
        }
      } else {
        return res;
      }
    } catch (e) {
      lastErr = e;
    }
    if (i < tries - 1) await new Promise((r) => setTimeout(r, backoffMs * (i + 1)));
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}
