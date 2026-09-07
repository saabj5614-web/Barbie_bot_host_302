function base() {
  const u = String(process.env.PTERO_PANEL_URL || "").trim().replace(/\/+$/, "");
  if (!u) throw new Error("PTERO_PANEL_URL missing");
  const key = String(process.env.PTERO_APP_API_KEY || "").trim();
  if (!key) throw new Error("PTERO_APP_API_KEY missing");
  return { u, key };
}

async function ptero(path, opts = {}) {
  const { u, key } = base();
  const r = await fetch(u + path, {
    ...opts,
    headers: {
      Authorization: `Bearer ${key}`,
      Accept: "Application/vnd.pterodactyl.v1+json",
      "Content-Type": "application/json",
      ...(opts.headers || {})
    }
  });
  const t = await r.text();
  let d;
  try { d = t ? JSON.parse(t) : {}; } catch { d = { raw: t }; }
  if (!r.ok) {
    const msg = d?.errors?.[0]?.detail || d?.message || `Pterodactyl ${r.status}`;
    const e = new Error(msg); e.status = r.status; e.ptero = d; throw e;
  }
  return d;
}
const get = p => ptero(p);
const post = (p, b) => ptero(p, { method: "POST", body: JSON.stringify(b) });
const del = p => ptero(p, { method: "DELETE" });
module.exports = { get, post, del };
  
