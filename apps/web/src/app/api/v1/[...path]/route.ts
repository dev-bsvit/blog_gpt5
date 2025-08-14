/* eslint-disable @typescript-eslint/no-explicit-any */
function getUpstreamBase(): string {
  const base = process.env.NEXT_PUBLIC_API_BASE || "";
  return base.replace(/\/$/, "");
}

async function proxy(req: Request, ctx: any) {
  const upstream = getUpstreamBase();
  if (!upstream) {
    return new Response(JSON.stringify({ error: "NEXT_PUBLIC_API_BASE is not set" }), { status: 500, headers: { "content-type": "application/json; charset=utf-8" } });
  }
  const path = Array.isArray(ctx?.params?.path) ? ctx.params.path.join("/") : "";
  const url = `${upstream}/${path}`;
  const headers: HeadersInit = {};
  // Forward auth headers if present
  const auth = req.headers.get("authorization");
  if (auth) headers["authorization"] = auth;
  const xuid = req.headers.get("x-user-id");
  if (xuid) headers["x-user-id"] = xuid;
  // Content type for JSON bodies
  const ct = req.headers.get("content-type");
  if (ct) headers["content-type"] = ct;

  const init: RequestInit = {
    method: req.method,
    headers,
    body: ["POST", "PUT", "PATCH", "DELETE"].includes(req.method) ? await req.arrayBuffer() : undefined,
    cache: "no-store",
  };
  const res = await fetch(url, init);
  const data = await res.arrayBuffer();
  const respHeaders = new Headers();
  respHeaders.set("content-type", res.headers.get("content-type") || "application/json; charset=utf-8");
  // Avoid caching user-specific endpoints
  const cc = (/\/likes|\/bookmark|\/comments|\/users\//.test(url)) ? "no-store" : (res.headers.get("cache-control") || "public, max-age=30, stale-while-revalidate=60");
  respHeaders.set("cache-control", cc);
  return new Response(data, { status: res.status, headers: respHeaders });
}

export async function GET(req: Request, ctx: any) { return proxy(req, ctx); }
export async function POST(req: Request, ctx: any) { return proxy(req, ctx); }
export async function PUT(req: Request, ctx: any) { return proxy(req, ctx); }
export async function DELETE(req: Request, ctx: any) { return proxy(req, ctx); }

export const runtime = 'nodejs';


