function baseApp(){const u=String(process.env.PTERO_PANEL_URL||'').trim().replace(/\/+$/,'');const key=String(process.env.PTERO_APP_API_KEY||'').trim();if(!u)throw new Error('PTERO_PANEL_URL missing');if(!key)throw new Error('PTERO_APP_API_KEY missing');return {u,key}}
function baseClient(){const u=String(process.env.PTERO_PANEL_URL||'').trim().replace(/\/+$/,'');const key=String(process.env.PTERO_CLIENT_API_KEY||'').trim();if(!u)throw new Error('PTERO_PANEL_URL missing');if(!key){const e=new Error('PTERO_CLIENT_API_KEY is not configured');e.status=503;throw e}return {u,key}}
async function request(path,opts,key){const u=String(process.env.PTERO_PANEL_URL||'').trim().replace(/\/+$/,'');const r=await fetch(u+path,{...opts,headers:{Authorization:`Bearer ${key}`,Accept:'Application/vnd.pterodactyl.v1+json','Content-Type':'application/json',...(opts.headers||{})}});const t=await r.text();let d;try{d=t?JSON.parse(t):{}}catch{d={raw:t}}if(!r.ok){const e=new Error(d?.errors?.[0]?.detail||d?.message||`Pterodactyl ${r.status}`);e.status=r.status;e.ptero=d;throw e}return d}
const get=p=>{const {key}=baseApp();return request(p,{},key)};
const post=(p,b)=>{const {key}=baseApp();return request(p,{method:'POST',body:JSON.stringify(b)},key)};
const del=p=>{const {key}=baseApp();return request(p,{method:'DELETE'},key)};
const clientGet=p=>{const {key}=baseClient();return request(p,{},key)};
const clientPost=(p,b)=>{const {key}=baseClient();return request(p,{method:'POST',body:JSON.stringify(b)},key)};
module.exports={get,post,del,clientGet,clientPost};
                                     
