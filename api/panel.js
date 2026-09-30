const {get,post,patch,del,clientGet,clientPost}=require('./ptero/client');
const {requireOwner}=require('../lib/auth');

const SLOT_COUNT=4;
const slots=Array.from({length:SLOT_COUNT},(_,i)=>({
  slot:i+1,
  name:`Server ${i+1}`,
  serverId:Number(process.env[`SLOT_${i+1}_SERVER_ID`]||0)||null
}));

function attrs(x){return x?.attributes||{}}
function num(v){const n=Number(v);return Number.isFinite(n)?n:null}
function slotFor(id){const n=Number(id);return slots.find(s=>s.slot===n)||null}
async function rawServer(slot){
  if(!slot?.serverId) return null;
  const d=await get(`/api/application/servers/${slot.serverId}?include=allocations`);
  return attrs(d);
}
function view(slot,a){
  if(!a) return {
    slot:slot.slot,name:slot.name,configured:false,status:'unconfigured',
    serverId:null,identifier:null,limits:{memory:0,disk:0,cpu:0},
    allocation:null,allocations:[]
  };
  const l=a.limits||{},as=a.relationships?.allocations?.data||[];
  return {
    slot:slot.slot,name:a.name||slot.name,configured:true,
    serverId:a.id,identifier:a.identifier,status:a.status||null,suspended:!!a.suspended,
    node:a.node||null,limits:{
      memory:num(l.memory)||0,disk:num(l.disk)||0,cpu:num(l.cpu)||0,
      swap:num(l.swap)||0,io:num(l.io)||0,threads:l.threads??null
    },
    allocation:as[0]?.attributes||null,allocations:as.map(x=>x.attributes||{}),
    container:a.container||null,egg:a.egg||null,startup:a.startup||null
  };
}
async function getView(slot){return view(slot,await rawServer(slot))}
async function checked(req,res){
  if(!requireOwner(req,res)) return null;
  const slot=slotFor(req.query?.slot||req.body?.slot);
  if(!slot) throw Object.assign(new Error('Server slot 1-4 is required'),{status:400});
  const a=await rawServer(slot);
  if(!a) throw Object.assign(new Error(`Server ${slot.slot} is not configured yet`),{status:503});
  return {slot,a,server:view(slot,a)};
}

module.exports=async(req,res)=>{
 try{
  if(!requireOwner(req,res)) return;
  const action=String(req.query?.action||'dashboard').toLowerCase();

  if(action==='dashboard'){
    const servers=await Promise.all(slots.map(getView));
    return res.json({ok:true,slots:servers,serverCount:servers.filter(s=>s.configured).length,slotCount:4});
  }

  if(['server','power','resources','files','file','settings','suspend','unsuspend','delete','upload','download','archive','unarchive','backup'].includes(action)){
    const x=await checked(req,res); if(!x)return;
    const {slot,a,server}=x;
    if(action==='server') return res.json({ok:true,server});

    if(['suspend','unsuspend','delete'].includes(action)){
      if(req.method!=='POST') return res.status(405).json({ok:false,error:'POST required'});
      if(action==='delete') return res.status(400).json({ok:false,error:'Fixed server slots cannot be deleted. Remove the slot mapping instead.'});
      await post(`/api/application/servers/${a.id}/${action}`,{});
      return res.json({ok:true,action,slot:slot.slot});
    }

    if(action==='settings'){
      if(req.method!=='POST') return res.status(405).json({ok:false,error:'POST required'});
      const b=req.body||{}, details={};
      for(const k of ['name','description','external_id']) if(b[k]!==undefined) details[k]=b[k];
      if(Object.keys(details).length) await patch(`/api/application/servers/${a.id}/details`,details);
      if(b.startup!==undefined||b.environment!==undefined)
        await patch(`/api/application/servers/${a.id}/startup`,{startup:b.startup,environment:b.environment});
      return res.json({ok:true,server:await getView(slot)});
    }

    const identifier=a.identifier;
    if(action==='console'){\n      const d=await clientGet(`/api/client/servers/${identifier}/websocket`);\n      const a=d?.data?.attributes||d?.attributes||d;\n      return res.json({ok:true,console:{socket:a.socket||a.websocket||null,token:a.token||null}});\n    }\n\n    if(action==='power'){
      if(req.method!=='POST') return res.status(405).json({ok:false,error:'POST required'});
      const signal=String(req.body?.signal||'').toLowerCase();
      if(!['start','stop','restart','kill'].includes(signal)) return res.status(400).json({ok:false,error:'Invalid power signal'});
      await clientPost(`/api/client/servers/${identifier}/power`,{signal});
      return res.json({ok:true,signal,slot:slot.slot});
    }

    if(action==='resources'){
      const d=await clientGet(`/api/client/servers/${identifier}/resources`);
      return res.json({ok:true,resources:d.attributes||d});
    }

    if(action==='files'){
      const directory=String(req.query?.directory||'/');
      const d=await clientGet(`/api/client/servers/${identifier}/files/list?directory=${encodeURIComponent(directory)}`);
      return res.json({ok:true,files:d.data||[]});
    }

    if(action==='file'){
      const file=String(req.query?.path||'');
      if(!file) return res.status(400).json({ok:false,error:'File path required'});
      const d=await clientGet(`/api/client/servers/${identifier}/files/contents?file=${encodeURIComponent(file)}`);
      return res.json({ok:true,content:typeof d==='string'?d:JSON.stringify(d)});
    }

    if(['upload','download','archive','unarchive','backup'].includes(action)){
      return res.status(501).json({ok:false,error:`${action} is reserved in the fixed-slot API and will be connected to the Oracle file/backup service in the next integration step.`});
    }
  }

  return res.status(400).json({ok:false,error:'Unknown action'});
 }catch(e){
  console.error('FIXED PANEL ERROR:',e);
  return res.status(e.status||500).json({ok:false,error:e.message||'Panel request failed'});
 }
};
