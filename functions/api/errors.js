// GET /api/errors?days=7 - fetch error logs for the last N days
// GET /api/errors?date=2026-03-25 - fetch errors for a specific date

const CORS = { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" };

export async function onRequestGet(context) {
  try {
    const url = new URL(context.request.url);
    const specificDate = url.searchParams.get("date");
    const days = parseInt(url.searchParams.get("days") || "7");

    if (specificDate) {
      const val = await context.env.TRAP_DATA.get("errors:" + specificDate);
      const entries = val ? JSON.parse(val) : [];
      return new Response(JSON.stringify({ date: specificDate, errors: entries, count: entries.length }), { headers: CORS });
    }

    // Fetch last N days
    const allErrors = [];
    for (let i = 0; i < days; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateKey = d.toISOString().slice(0, 10);
      const val = await context.env.TRAP_DATA.get("errors:" + dateKey);
      if (val) {
        try {
          const entries = JSON.parse(val);
          if (Array.isArray(entries)) {
            allErrors.push({ date: dateKey, errors: entries, count: entries.length });
          }
        } catch {}
      }
    }

    const totalCount = allErrors.reduce((sum, d) => sum + d.count, 0);
    return new Response(JSON.stringify({ days, totalCount, logs: allErrors }), { headers: CORS });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: CORS });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
