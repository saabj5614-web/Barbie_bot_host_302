const { makeSession } = require("../lib/auth");

module.exports = (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Method not allowed" });
  const { password } = req.body || {};
  if (!process.env.OWNER_PASSWORD || password !== process.env.OWNER_PASSWORD) {
    return res.status(401).json({ ok: false, error: "Invalid password" });
  }
  try {
    const token = makeSession();
    res.setHeader("Set-Cookie", `barbie_owner=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=86400`);
    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
};

