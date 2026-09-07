const crypto = require("crypto");

function secret() {
  return String(process.env.OWNER_COOKIE_SECRET || process.env.OWNER_SESSION_SECRET || "").trim();
}

function sign(value) {
  const s = secret();
  if (!s) throw new Error("OWNER_COOKIE_SECRET is not configured");
  return crypto.createHmac("sha256", s).update(value).digest("hex");
}

function makeSession() {
  const payload = Buffer.from(JSON.stringify({ iat: Date.now() })).toString("base64url");
  return payload + "." + sign(payload);
}

function valid(req) {
  try {
    const cookie = req.headers.cookie || "";
    const match = cookie.match(/(?:^|;\s*)barbie_owner=([^;]+)/);
    if (!match) return false;
    const parts = match[1].split(".");
    if (parts.length !== 2) return false;
    const expected = Buffer.from(sign(parts[0]));
    const actual = Buffer.from(parts[1]);
    return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

function requireOwner(req, res) {
  if (!process.env.OWNER_PASSWORD) {
    res.status(500).json({ ok: false, error: "OWNER_PASSWORD is not configured" });
    return false;
  }
  if (!secret()) {
    res.status(500).json({ ok: false, error: "OWNER_COOKIE_SECRET is not configured" });
    return false;
  }
  if (!valid(req)) {
    res.status(401).json({ ok: false, error: "Owner authentication required" });
    return false;
  }
  return true;
}

module.exports = { sign, makeSession, valid, requireOwner };
                               
