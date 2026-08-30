const ogFetch = globalThis.fetch.bind(globalThis);
globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
  console.error(`[fetch-patch] ${init?.method ?? 'GET'} ${url}`);
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await ogFetch(input, init);
      const text = await res.text();
      const headers = new Headers();
      const contentType = res.headers.get('content-type');
      if (contentType) headers.set('content-type', contentType);
      return new Response(text, {
        status: res.status,
        statusText: res.statusText,
        headers,
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      const retryable = url.includes('indexer') && /premature close|ECONNRESET|network|timeout|socket hang up|fetch failed/i.test(msg);
      if (!retryable || attempt >= 5) throw error;
      await new Promise((r) => setTimeout(r, 1500 * attempt));
    }
  }
}) as typeof fetch;
