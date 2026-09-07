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

    if (action === "overview") {
      const [nodes, servers] = await Promise.all([
        pteroGet("/api/application/nodes?per_page=100"),
        pteroGet("/api/application/servers?per_page=100&include=allocations")
      ]);

      const nodeList = Array.isArray(nodes?.data) ? nodes.data : [];
      const serverList = Array.isArray(servers?.data) ? servers.data : [];

      let totalMemory = 0;
      let allocatedMemory = 0;
      let totalDisk = 0;
      let allocatedDisk = 0;
      let totalCpu = 0;

      for (const node of nodeList) {
        const a = node?.attributes || {};
        const m = a.memory || {};
        const d = a.disk || {};
        totalMemory += Number(m.total || 0);
        allocatedMemory += Number(m.allocated || 0);
        totalDisk += Number(d.total || 0);
        allocatedDisk += Number(d.allocated || 0);
        totalCpu += Number(a.cpu || 0);
      }

      // Fallback: if the node API does not expose allocated memory, calculate it
      // from server limits. This keeps the dashboard dynamic instead of using a
      // hard-coded RAM value.
      if (!allocatedMemory) {
        allocatedMemory = serverList.reduce((sum, server) => {
          return sum + Number(server?.attributes?.limits?.memory || 0);
        }, 0);
      }

      const physicalAvailableMemory = Math.max(totalMemory - allocatedMemory, 0);
      const effectiveCapacity = nodeList.reduce((sum, node) => {
        const m = node?.attributes?.memory || {};
        const total = Number(m.total || 0);
        const overallocate = Number(m.overallocate || 0);
        return sum + total * (1 + overallocate / 100);
      }, 0);
      const effectiveAvailableMemory = Math.max(effectiveCapacity - allocatedMemory, 0);

      return res.status(200).json({
        ok: true,
        action,
        data: {
          nodes,
          servers,
          summary: {
            nodeCount: nodeList.length,
            serverCount: serverList.length,
            totalMemory,
            allocatedMemory,
            physicalAvailableMemory,
            effectiveCapacity,
            effectiveAvailableMemory,
            totalDisk,
            allocatedDisk,
            availableDisk: Math.max(totalDisk - allocatedDisk, 0),
            totalCpu
          }
        }
      });
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
    
