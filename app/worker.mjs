const HF_PREFIXES = ["/hf-v2/", "/hf/"];
const HF_HOST = "https://huggingface.co";

function withCorsPreflightHeaders(responseHeaders) {
  const headers = new Headers(responseHeaders);
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS");
  headers.set("Access-Control-Allow-Headers", "*");
  headers.set("Vary", "Origin");
  return headers;
}

function getHfPrefix(pathname) {
  return HF_PREFIXES.find((prefix) => pathname.startsWith(prefix));
}

async function proxyHuggingFaceRequest(request, prefix) {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: withCorsPreflightHeaders(new Headers()),
    });
  }

  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const url = new URL(request.url);
  const path = url.pathname.slice(prefix.length);

  if (!path || path.includes("..")) {
    return new Response("Bad Request", { status: 400 });
  }

  const upstreamUrl = `${HF_HOST}/${path}${url.search}`;
  const passthroughHeaderNames = [
    "accept",
    "accept-language",
    "range",
    "if-none-match",
    "if-modified-since",
    "cache-control",
  ];
  const upstreamHeaders = new Headers();

  for (const headerName of passthroughHeaderNames) {
    const value = request.headers.get(headerName);
    if (value) {
      upstreamHeaders.set(headerName, value);
    }
  }

  const upstreamRequest = new Request(upstreamUrl, {
    method: request.method,
    headers: upstreamHeaders,
    redirect: "follow",
  });

  const upstream = await fetch(upstreamRequest);
  const headers = withCorsPreflightHeaders(upstream.headers);
  // Revalidate frequently to avoid stale edge/browser 404s on model artifacts.
  headers.set("Cache-Control", "public, max-age=0, must-revalidate");

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers,
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const hfPrefix = getHfPrefix(url.pathname);

    if (hfPrefix) {
      return proxyHuggingFaceRequest(request, hfPrefix);
    }

    return env.ASSETS.fetch(request);
  },
};
