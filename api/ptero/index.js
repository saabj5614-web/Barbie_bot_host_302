const { requireOwner } = require("../../lib/auth");

function panelUrl() {
  const value = String(process.env.PTERO_PANEL_URL || "").trim();
  if (!value) throw new Error("PTERO_PANEL_URL is missing");
  return value.replace(/\/+$/, "");
}

function apiKey() {
  const value = String(process.env.PTERO_APP_API_KEY || "").trim();
  if (!value) throw new Error("PTERO_APP_API_KEY is missing");
  return value;
}

async function pteroGet(path) {
  const response = await fetch(panelUrl() + path, {
    method: "GET",
    headers: {
      Accept: "Application/vnd.pterodactyl.v1+json",
      Authorization: `Bearer ${apiKey()}`
    }
  });
  const text = await response.text();
  let data = {};
  try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }
  if (!response.ok) {
    const message = data?.errors?.[0]?.detail || data?.message || `Pterodactyl HTTP ${response.status}`;
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }
  return data;
}

module.exports = async function handler(req, res) {
  try {
    if (!requireOwner(req, res)) return;
    if (req.method !== "GET") return res.status(405).json({ ok: false, error: "Method not allowed" });

    const action = String(req.query?.action || "servers").toLowerCase();

    if (action === "servers") {
      const data = await pteroGet("/api/application/servers?per_page=100&include=allocations");
      return res.status(200).json({ ok: true, action, data });
    }
    if (action === "nodes") {
      const data = await pteroGet("/api/application/nodes?per_page=100");
      return res.status(200).json({ ok: true, action, data });
    }
    if (action === "users") {
      const data = await pteroGet("/api/application/users?per_page=100");
      return res.status(200).json({ ok: true, action, data });
    }
    return res.status(400).json({ ok: false, error: "Unknown action" });
  } catch (error) {
    console.error("PTERO API ERROR:", error);
    return res.status(500).json({ ok: false, error: error?.message || "Pterodactyl connection failed", status: error?.status || 500 });
  }
};

