// GET /api/sessions - list all saved sessions
// DELETE /api/sessions?key=someKey - delete a session

export async function onRequestGet(context) {
  const list = await context.env.TRAP_DATA.list({ prefix: "session:" });
  const sessions = [];
  for (const key of list.keys) {
    const val = await context.env.TRAP_DATA.get(key.name);
    if (val) {
      try {
        const data = JSON.parse(val);
        sessions.push({ key: key.name, ...data });
      } catch {}
    }
  }
  return new Response(JSON.stringify(sessions), {
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });
}

export async function onRequestDelete(context) {
  const url = new URL(context.request.url);
  const key = url.searchParams.get("key");
  if (key) await context.env.TRAP_DATA.delete(key);
  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,DELETE,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
