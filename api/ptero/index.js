const { get } = require('./client');
const { requireOwner } = require('../../lib/auth');

function pickNode(a = {}) {
  return {
    id: a.id ?? null,
    uuid: a.uuid ?? null,
    name: a.name ?? null,
    memory: a.memory ?? null,
    memory_overallocate: a.memory_overallocate ?? null,
    disk: a.disk ?? null,
    disk_overallocate: a.disk_overallocate ?? null,
    cpu: a.cpu ?? null,
    allocated_resources: a.allocated_resources ?? null
  };
}

function pickServer(a = {}) {
  return {
    id: a.id ?? null,
    identifier: a.identifier ?? null,
    name: a.name ?? null,
    limits: a.limits ?? null,
    resource_limits: a.resource_limits ?? null
  };
}

module.exports = async (req, res) => {
  try {
    if (!requireOwner(req, res)) return;
    const action = String(req.query?.action || '').toLowerCase();

    if (action !== 'ramdiag') {
      return res.status(400).json({ ok: false, error: 'Use ?action=ramdiag' });
    }

    const [nodes, servers] = await Promise.all([
      get('/api/application/nodes?per_page=100'),
      get('/api/application/servers?per_page=100&include=allocations')
    ]);

    const nodeData = Array.isArray(nodes?.data) ? nodes.data : [];
    const serverData = Array.isArray(servers?.data) ? servers.data : [];

    return res.json({
      ok: true,
      note: 'Diagnostic only. These are raw Pterodactyl resource fields; no conversion is applied.',
      nodes: nodeData.map(x => pickNode(x?.attributes || {})),
      servers: serverData.map(x => pickServer(x?.attributes || {}))
    });
  } catch (e) {
    console.error('RAM DIAGNOSTIC ERROR:', e);
    return res.status(e.status || 500).json({
      ok: false,
      error: e.message || 'RAM diagnostic failed'
    });
  }
};
