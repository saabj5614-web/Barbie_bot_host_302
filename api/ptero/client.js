function cfg(name,label){const v=String(process.env[name]||'').trim();if(!v)throw new Error(label+' missing');return v}
function baseApp(){return{u:cfg('HOST_BACKEND_URL','HOST_BACKEND_URL').replace(/\/+$/,''),key:cfg('HOST_BACKEND_APP_KEY','HOST_BACKEND_APP_KEY')}}
function baseClient(){return{u:cfg('HOST_BACKEND_URL','HOST_BACKEND_URL').replace(/\/+$/,''),key:cfg('HOST_BACKEND_CLIENT_KEY','HOST_BACKEND_CLIENT_KEY')}}
async function request(path,opts,key){const {u}=baseApp();const r=await fetch(u+path,{...opts,headers:{Authorization:`Bearer ${key}`,Accept:'Application/vnd.pterodactyl.v1+json','Content-Type':'application/json',...(opts.headers||{})}});const t=await r.text();let d;try{d=t?JSON.parse(t):{}}catch{d={raw:t}}if(!r.ok){const e=new Error(d?.errors?.[0]?.detail||d?.message||`Backend ${r.status}`);e.status=r.status;e.backend=d;throw e}return d}
async function clientRequest(path,opts={}){const {u,key}=baseClient();const r=await fetch(u+path,{...opts,headers:{Authorization:`Bearer ${key}`,Accept:'Application/vnd.pterodactyl.v1+json','Content-Type':'application/json',...(opts.headers||{})}});const t=await r.text();let d;try{d=t?JSON.parse(t):{}}catch{d={raw:t}}if(!r.ok){const e=new Error(d?.errors?.[0]?.detail||d?.message||`Backend ${r.status}`);e.status=r.status;e.backend=d;throw e}return d}
const get=p=>{const {key}=baseApp();return request(p,{},key)};
const post=(p,b)=>{const {key}=baseApp();return request(p,{method:'POST',body:JSON.stringify(b)},key)};
const patch=(p,b)=>{const {key}=baseApp();return request(p,{method:'PATCH',body:JSON.stringify(b)},key)};
const del=p=>{const {key}=baseApp();return request(p,{method:'DELETE'},key)};
const clientGet=p=>clientRequest(p,{});
const clientPost=(p,b)=>clientRequest(p,{method:'POST',body:JSON.stringify(b)});
module.exports={get,post,patch,del,clientGet,clientPost};