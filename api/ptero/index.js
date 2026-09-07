const { get } = require('./client');
const { requireOwner } = require('../../lib/auth');

const UNLIMITED = 4294967295;
const isUnlimited = v => Number(v) >= UNLIMITED;

function nodeMemory(a = {}) {
  if (isUnlimited(a.memory)) return { unlimited: true, mb: null };
  if (a.memory && typeof a.memory === 'object') {
    if (isUnlimited(a.memory.total)) return { unlimited: true, mb: null };
    return { unlimited: false, mb: Number(a.memory.total || 0) };
  }
  return { unlimited: false, mb: Number(a.memory || 0) };
}

function nodeDisk(a = {}) {
  if (isUnlimited(a.disk)) return { unlimited: true, mb: null };
  if (a.disk && typeof a.disk === 'object') {
    if (isUnlimited(a.disk.total)) return { unlimited: true, mb: null };
    return { unlimited: false, mb: Number(a.disk.total || 0) };
  }
  return { unlimited: false, mb: Number(a.disk || 0) };
}

module.exports = async (req, res) => {
  try {
    if (!requireOwner(req, res)) return;
    const action = String(req.query?.action || 'overview').toLowerCase();

    if (action === 'servers') {
      return res.json({ ok: true, action, data: await get('/api/application/servers?per_page=100&include=allocations') });
    }
    if (action === 'nodes') {
      return res.json({ ok: true, action, data: await get('/api/application/nodes?per_page=100') });
    }
    if (action === 'users') {
      return res.json({ ok: true, action, data: await get('/api/application/users?per_page=100') });
    }
    if (action !== 'overview') {
      return res.status(400).json({ ok: false, error: 'Unknown action' });
    }

    const [nodes, servers] = await Promise.all([
      get('/api/application/nodes?per_page=100'),
      get('/api/application/servers?per_page=100&include=allocations')
    ]);

    const nodeList = Array.isArray(nodes?.data) ? nodes.data : [];
    const serverList = Array.isArray(servers?.data) ? servers.data : [];

    let totalMemory = 0;
    let unlimitedMemory = false;
    let totalDisk = 0;
    let unlimitedDisk = false;
    let allocatedMemory = 0;
    let allocatedDisk = 0;

    for (const node of nodeList) {
      const a = node?.attributes || {};
      const mem = nodeMemory(a);
      const disk = nodeDisk(a);
      if (mem.unlimited) unlimitedMemory = true; else totalMemory += mem.mb;
      if (disk.unlimited) unlimitedDisk = true; else totalDisk += disk.mb;
      const allocated = a.allocated_resources || {};
      allocatedMemory += Number(allocated.memory || 0);
      allocatedDisk += Number(allocated.disk || 0);
    }

    // The node API may not expose allocated_resources on every setup, so use
    // server limits as a safe dynamic fallback.
    if (!allocatedMemory) {
      allocatedMemory = serverList.reduce((sum, s) => sum + Number(s?.attributes?.limits?.memory || 0), 0);
    }
    if (!allocatedDisk) {
      allocatedDisk = serverList.reduce((sum, s) => sum + Number(s?.attributes?.limits?.disk || 0), 0);
    }

    return res.json({
      ok: true,
      action,
      data: {
        nodes,
        servers,
        summary: {
          nodeCount: nodeList.length,
          serverCount: serverList.length,
          unlimitedMemory,
          totalMemory: unlimitedMemory ? null : totalMemory,
          allocatedMemory,
          physicalAvailableMemory: unlimitedMemory ? null : Math.max(totalMemory - allocatedMemory, 0),
          effectiveCapacity: unlimitedMemory ? null : totalMemory,
          effectiveAvailableMemory: unlimitedMemory ? null : Math.max(totalMemory - allocatedMemory, 0),
          unlimitedDisk,
          totalDisk: unlimitedDisk ? null : totalDisk,
          allocatedDisk,
          availableDisk: unlimitedDisk ? null : Math.max(totalDisk - allocatedDisk, 0)
        }
      }
    });
  } catch (e) {
    console.error('PTERO API ERROR:', e);
    return res.status(e.status || 500).json({ ok: false, error: e.message || 'Pterodactyl connection failed' });
  }
};
                    
