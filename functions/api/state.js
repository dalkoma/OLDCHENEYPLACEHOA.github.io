// GET /api/state?key=someKey - fetch shared state
// POST /api/state - save shared state { key, data }

export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const key = url.searchParams.get("key") || "default";
  const val = await context.env.TRAP_DATA.get(key);
  return new Response(val || "null", {
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });
}

export async function onRequestPost(context) {
  const body = await context.request.json();
  const key = body.key || "default";
  await context.env.TRAP_DATA.put(key, JSON.stringify(body.data));
  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });
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
