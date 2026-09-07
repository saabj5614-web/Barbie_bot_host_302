const { requireOwner } = require('../../lib/auth');
const { get, post } = require('./client');

function attrs(x){ return x?.attributes || {}; }
function mb(n){ const v=Number(n); return Number.isFinite(v)?v:null; }
function nodeView(a){
  const unlimited = Number(a.memory) === 4294967295;
  return {id:a.id??null,name:a.name??null,uuid:a.uuid??null,memoryMB:unlimited?null:mb(a.memory),unlimited,overallocate:mb(a.memory_overallocate),diskMB:mb(a.disk),cpu:mb(a.cpu),allocatedMemoryMB:mb(a.allocated_resources?.memory)};
}
function serverView(a){
  const l=a.limits||{};
  return {id:a.id??null,identifier:a.identifier??null,name:a.name??null,description:a.description??'',status:a.status??null,suspended:!!a.suspended,node:a.node??null,createdAt:a.created_at??null,updatedAt:a.updated_at??null,limits:{memory:mb(l.memory)||0,swap:mb(l.swap)||0,disk:mb(l.disk)||0,cpu:mb(l.cpu)||0,io:mb(l.io)||0,threads:l.threads??null},allocation:a.relationships?.allocations?.data?.[0]?.attributes||null,container:a.container??null,egg:a.egg??null};
}

module.exports = async function handler(req,res){
  try{
    if(!requireOwner(req,res)) return;
    const action=String(req.query?.action||'dashboard').toLowerCase();
    if(action==='dashboard'||action==='servers'||action==='nodes'){
      const [servers,nodes]=await Promise.all([
        get('/api/application/servers?per_page=100&include=allocations'),
        get('/api/application/nodes?per_page=100')
      ]);
      const ns=(nodes.data||[]).map(x=>nodeView(attrs(x)));
      const ss=(servers.data||[]).map(x=>serverView(attrs(x)));
      const unlimited=ns.some(n=>n.unlimited);
      const allocated=ss.reduce((t,s)=>t+s.limits.memory,0);
      const finiteTotal=ns.filter(n=>!n.unlimited).reduce((t,n)=>t+(n.memoryMB||0),0);
      return res.json({ok:true,servers:ss,nodes:ns,capacity:{unlimited,allocatedMemoryMB:allocated,totalMemoryMB:unlimited?null:finiteTotal}});
    }
    if(action==='server'){
      const id=Number(req.query?.id); if(!id) return res.status(400).json({ok:false,error:'Server id required'});
      const s=await get(`/api/application/servers/${id}?include=allocations,subusers,databases`);
      return res.json({ok:true,server:serverView(attrs(s))});
    }
    if(action==='suspend'||action==='unsuspend'){
      if(req.method!=='POST') return res.status(405).json({ok:false,error:'POST required'});
      const id=Number(req.body?.id); if(!id) return res.status(400).json({ok:false,error:'Server id required'});
      await post(`/api/application/servers/${id}/${action}`,{});
      return res.json({ok:true});
    }
    return res.status(400).json({ok:false,error:'Unknown action'});
  }catch(e){
    console.error('PTERO API ERROR:',e);
    return res.status(e.status||500).json({ok:false,error:e.message||'Pterodactyl connection failed'});
  }
};

