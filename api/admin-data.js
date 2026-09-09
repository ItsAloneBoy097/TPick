const SUPABASE_URL = "https://jookggcluqpsdrywyrjv.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impvb2tnZ2NsdXFwc2RyeXd5cmp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc3Mzg3MzQsImV4cCI6MjA5MzMxNDczNH0.ZfbuhwAAO5DT4lgKeP8i8OWAvdmX2HRI3QyyVes7YDU";
export const access = "admin";
export const methods = ["GET", "POST", "PUT", "DELETE"];

const headers = {
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  "Content-Type": "application/json"
};

async function supabase(path, options = {}) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: { ...headers, ...(options.headers || {}) }
  });
  const text = await response.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!response.ok) throw new Error(data?.message || data?.hint || data?.error || `Database request failed (${response.status})`);
  return data;
}

export default async function (req, res) {
  const body = req.body || {};
  const table = body.table || req.query?.table;
  const id = body.id || req.query?.id;
  if (!["portfolio_items", "clients", "page_views"].includes(table)) return res.status(400).json({ error: "Invalid table" });

  if (req.method === "GET") {
    if (table === "portfolio_items") return res.json(await supabase("portfolio_items?select=*&order=position.asc"));
    if (table === "clients") return res.json(await supabase("clients?select=*&order=position.asc"));
    return res.json(await supabase("page_views?select=id,created_at,session_id,is_mobile,screen_width,screen_height,country&order=created_at.asc"));
  }

  if (!id && req.method !== "POST") return res.status(400).json({ error: "Missing id" });
  const query = id ? `?id=eq.${encodeURIComponent(id)}` : "";

  if (req.method === "POST") {
    const payload = { ...body };
    delete payload.table; delete payload.id;
    return res.json(await supabase(table, { method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify(payload) }));
  }

  if (req.method === "PUT") {
    const payload = { ...body };
    delete payload.table; delete payload.id;
    await supabase(`${table}${query}`, { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify(payload) });
    return res.json({ ok: true });
  }

  await supabase(`${table}${query}`, { method: "DELETE", headers: { Prefer: "return=minimal" } });
  return res.json({ ok: true });
}