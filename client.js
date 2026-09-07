function base(){const u=(process.env.PTERO_URL||'').replace(/\/$/,'');if(!u)throw new Error('PTERO_URL missing');if(!process.env.PTERO_APP_KEY)throw new Error('PTERO_APP_KEY missing');return u}
async function ptero(path,opts={}){const r=await fetch(base()+path,{...opts,headers:{Authorization:`Bearer ${process.env.PTERO_APP_KEY}`,Accept:'Application/vnd.pterodactyl.v1+json','Content-Type':'application/json',...(opts.headers||{})}});const t=await r.text();let d;try{d=JSON.parse(t)}catch{d={raw:t}}if(!r.ok)throw new Error(`Pterodactyl ${r.status}: ${JSON.stringify(d)}`);return d}
const get=(p)=>ptero(p); const post=(p,b)=>ptero(p,{method:'POST',body:JSON.stringify(b)}); const del=(p)=>ptero(p,{method:'DELETE'});
module.exports={get,post,del};
