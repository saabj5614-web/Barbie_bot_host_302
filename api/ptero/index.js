const requireOwner = require("../../lib/require-owner");

function getPanelUrl() {
  const value = String(process.env.PTERO_PANEL_URL || "").trim();

  if (!value) {
    throw new Error("PTERO_PANEL_URL is missing");
  }

  return value.replace(/\/+$/, "");
}

function getApiKey() {
  const value = String(process.env.PTERO_APP_API_KEY || "").trim();

  if (!value) {
    throw new Error("PTERO_APP_API_KEY is missing");
  }

  return value;
}

async function pteroRequest(path) {
  const url = `${getPanelUrl()}${path}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "Application/vnd.pterodactyl.v1+json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${getApiKey()}`
    }
  });

  const text = await response.text();

  let data;

  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }

  if (!response.ok) {
    const message =
      data?.errors?.[0]?.detail ||
      data?.errors?.[0]?.code ||
      data?.message ||
      `Pterodactyl returned HTTP ${response.status}`;

    const error = new Error(message);
    error.status = response.status;
    error.ptero = data;
    throw error;
  }

  return data;
}

module.exports = async function handler(req, res) {
  try {
    if (!requireOwner(req, res)) {
      return;
    }

    const action = String(req.query?.action || "servers").toLowerCase();

    if (action === "servers") {
      const data = await pteroRequest(
        "/api/application/servers?include=allocations"
      );

      return res.status(200).json({
        ok: true,
        action: "servers",
        data
      });
    }

    if (action === "nodes") {
      const data = await pteroRequest(
        "/api/application/nodes?per_page=100"
      );

      return res.status(200).json({
        ok: true,
        action: "nodes",
        data
      });
    }

    if (action === "users") {
      const data = await pteroRequest(
        "/api/application/users?per_page=100"
      );

      return res.status(200).json({
        ok: true,
        action: "users",
        data
      });
    }

    return res.status(400).json({
      ok: false,
      error: "Unknown action"
    });
  } catch (error) {
    console.error("PTERO API ERROR:", error);

    return res.status(500).json({
      ok: false,
      error: error?.message || "Pterodactyl connection failed",
      status: error?.status || 500
    });
  }
};
