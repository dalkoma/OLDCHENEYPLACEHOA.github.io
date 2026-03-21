// GET /api/state?key=someKey - fetch shared state
// POST /api/state - save shared state { key, data }

const CORS = { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" };

export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const key = url.searchParams.get("key") || "default";
  const val = await context.env.TRAP_DATA.get(key);
  return new Response(val || "null", { headers: CORS });
}

export async function onRequestPost(context) {
  const body = await context.request.json();
  const key = body.key || "default";
  // Inject server-side info
  const ip = context.request.headers.get("cf-connecting-ip") || context.request.headers.get("x-forwarded-for") || "";
  const country = context.request.headers.get("cf-ipcountry") || "";
  const city = context.request.headers.get("cf-city") || "";
  const region = context.request.headers.get("cf-region") || "";
  const data = { ...body.data, _ip: ip, _country: country, _city: city, _region: region };
  await context.env.TRAP_DATA.put(key, JSON.stringify(data));
  return new Response(JSON.stringify({ ok: true, ip }), { headers: CORS });
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
