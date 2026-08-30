const Module = require('module');

const ogFetch = globalThis.fetch.bind(globalThis);
const realFetch = async (url, options) => {
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await ogFetch(url, options);
      const buffer = Buffer.from(await res.arrayBuffer());
      const headers = new Headers();
      const contentType = res.headers.get('content-type');
      if (contentType) headers.set('content-type', contentType);
      return new Response(buffer, {
        status: res.status,
        statusText: res.statusText,
        headers,
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      const retryable = /premature close|ECONNRESET|network|timeout|socket hang up|fetch failed/i.test(msg);
      if (!retryable || attempt >= 6) throw error;
      await new Promise((r) => setTimeout(r, 1000 * attempt));
    }
  }
};

const proxyFetch = Object.assign(
  function patchedFetch(url, options) {
    return realFetch(url, options);
  },
  {
    default: realFetch,
    Headers: globalThis.Headers,
    Request: globalThis.Request,
    Response: globalThis.Response,
    AbortController: globalThis.AbortController,
  },
);

const originalLoad = Module._load;
Module._load = function (request, parent, isMain) {
  if (request === 'node-fetch' || request === 'cross-fetch') {
    return proxyFetch;
  }
  return originalLoad.apply(this, arguments);
};
