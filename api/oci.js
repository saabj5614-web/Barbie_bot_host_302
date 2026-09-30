const core = require("oci-core");
const common = require("oci-common");

function required(name) {
  const value = String(process.env[name] || "").trim();
  if (!value) throw Object.assign(new Error(name + " missing"), { status: 503 });
  return value;
}

function provider() {
  return new common.SimpleAuthenticationDetailsProvider(
    required("OCI_TENANCY_OCID"),
    required("OCI_USER_OCID"),
    required("OCI_FINGERPRINT"),
    required("OCI_PRIVATE_KEY").replace(/\\n/g, "\n"),
    process.env.OCI_PASSPHRASE || null,
    common.Region.fromRegionId(required("OCI_REGION"))
  );
}

function client() {
  const c = new core.ComputeClient({ authenticationDetailsProvider: provider() });
  c.region = common.Region.fromRegionId(required("OCI_REGION"));
  return c;
}

function instanceId(slot) {
  const id = String(process.env[`OCI_SLOT_${slot}_INSTANCE_OCID`] || "").trim();
  return id || null;
}

function slotConfig(slot) {
  return {
    slot,
    name: String(process.env[`OCI_SLOT_${slot}_NAME`] || `Server ${slot}`),
    instanceId: instanceId(slot)
  };
}

function shapeDetails(instance) {
  const s = instance?.shapeConfig || {};
  return {
    ocpus: s.ocpus ?? null,
    memoryGB: s.memoryInGBs ?? null,
    baselineOcpuUtilization: s.baselineOcpuUtilization ?? null
  };
}

function view(slot, instance) {
  const cfg = slotConfig(slot);
  if (!instance) return {
    slot, name: cfg.name, configured: false, status: "unconfigured",
    instanceId: null, shape: null, privateIp: null, publicIp: null
  };
  return {
    slot, name: instance.displayName || cfg.name, configured: true,
    status: String(instance.lifecycleState || "").toLowerCase(),
    instanceId: instance.id, availabilityDomain: instance.availabilityDomain,
    faultDomain: instance.faultDomain, shape: instance.shape,
    shapeConfig: shapeDetails(instance),
    region: process.env.OCI_REGION, timeCreated: instance.timeCreated,
    privateIp: null, publicIp: null,
    imageId: instance.sourceDetails?.imageId || null
  };
}

async function getInstance(slot) {
  const id = instanceId(slot);
  if (!id) return null;
  const result = await client().getInstance({ instanceId: id });
  return result.instance;
}

async function dashboard() {
  const result = await Promise.all(
    [1,2,3,4].map(async slot => view(slot, await getInstance(slot)))
  );
  return { ok: true, slots: result, slotCount: 4, provider: "oracle-cloud" };
}

async function power(slot, action) {
  const id = instanceId(slot);
  if (!id) throw Object.assign(new Error(`Server ${slot} is not configured`), { status: 503 });
  const map = { start: "START", stop: "STOP", restart: "SOFTRESET", reset: "RESET" };
  const a = map[action];
  if (!a) throw Object.assign(new Error("Invalid power action"), { status: 400 });
  await client().instanceAction({ instanceId: id, action: a });
  return { ok: true, slot, action: a };
}

async function consoleConnection(slot) {
  const id = instanceId(slot);
  const pub = String(process.env.OCI_CONSOLE_SSH_PUBLIC_KEY || "").trim();
  if (!id) throw Object.assign(new Error(`Server ${slot} is not configured`), { status: 503 });
  if (!pub) throw Object.assign(new Error("OCI_CONSOLE_SSH_PUBLIC_KEY missing"), { status: 503 });
  const result = await client().createInstanceConsoleConnection({
    createInstanceConsoleConnectionDetails: {
      instanceId: id,
      sshPublicKey: pub
    }
  });
  return result.instanceConsoleConnection || result;
}

module.exports = { dashboard, getInstance, power, consoleConnection, slotConfig, instanceId, view };
