const crypto=require('crypto');
function sign(v){return crypto.createHmac('sha256',process.env.OWNER_SESSION_SECRET||'dev-secret').update(v).digest('hex')}
function makeSession(){const p=Buffer.from(JSON.stringify({iat:Date.now()})).toString('base64url');return p+'.'+sign(p)}
function valid(req){const c=req.headers.cookie||'';const m=c.match(/barbie_owner=([^;]+)/);if(!m)return false;const [p,s]=m[1].split('.');return !!p&&!!s&&crypto.timingSafeEqual(Buffer.from(s),Buffer.from(sign(p)))}
function requireOwner(req,res){if(!process.env.OWNER_PASSWORD){res.status(500).json({ok:false,error:'OWNER_PASSWORD is not configured'});return false}if(!valid(req)){res.status(401).json({ok:false,error:'Owner authentication required'});return false}return true}
module.exports={sign,makeSession,valid,requireOwner};
