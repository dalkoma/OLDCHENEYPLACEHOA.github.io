// GET /api/state?key=someKey - fetch shared state
// POST /api/state - save shared state { key, data }

const CORS = { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" };

export async function onRequestGet(context) {
  try {
    const url = new URL(context.request.url);
    const key = url.searchParams.get("key") || "default";
    const val = await context.env.TRAP_DATA.get(key);
    if (!val) return new Response("null", { headers: CORS });
    return new Response(val, { headers: CORS });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: CORS });
  }
}

export async function onRequestPost(context) {
  try {
    const body = await context.request.json();
    if (!body || !body.key) {
      return new Response(JSON.stringify({ error: "Missing key" }), { status: 400, headers: CORS });
    }
    const key = body.key;
    const ip = context.request.headers.get("cf-connecting-ip") || context.request.headers.get("x-forwarded-for") || "";
    const country = context.request.headers.get("cf-ipcountry") || "";

    // Error log append mode — accumulate errors under daily key
    if (body.append && key.startsWith("errors:")) {
      const existing = await context.env.TRAP_DATA.get(key);
      let entries = [];
      try { entries = existing ? JSON.parse(existing) : []; } catch { entries = []; }
      if (!Array.isArray(entries)) entries = [];
      entries.push({ ...body.data, _ip: ip, _country: country, _ts: new Date().toISOString() });
      // Keep last 500 errors per day
      if (entries.length > 500) entries = entries.slice(-500);
      await context.env.TRAP_DATA.put(key, JSON.stringify(entries));
      return new Response(JSON.stringify({ ok: true, count: entries.length }), { headers: CORS });
    }

    // Normal save
    const data = { ...body.data, _ip: ip, _country: country };
    await context.env.TRAP_DATA.put(key, JSON.stringify(data));
    return new Response(JSON.stringify({ ok: true }), { headers: CORS });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: CORS });
  }
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
