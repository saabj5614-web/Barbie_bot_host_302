const {get,post}=require('./client');const {requireOwner}=require('../../lib/auth');
const OWNER_BOARDS=[['barbie','Barbie Bot'],['telegram-1','Telegram Bot 1'],['telegram-2','Telegram Bot 2'],['mini','Mini Bot'],['panel','Panel Hosting Bot']];
module.exports=async(req,res)=>{try{if(!requireOwner(req,res))return;const a=req.query?.action||'servers';if(a==='servers')return res.json({ok:true,data:await get('/api/application/servers?include=allocations'));
if(a==='users')return res.json({ok:true,data:await get('/api/application/users?per_page=100')});
if(a==='nodes')return res.json({ok:true,data:await get('/api/application/nodes?per_page=100')});
if(a==='power'&&req.method==='POST'){const id=req.body?.id,signal=req.body?.signal;if(!id||!['start','stop','restart','kill'].includes(signal))return res.status(400).json({ok:false,error:'id and valid signal required'});return res.json({ok:true,data:await post(`/api/client/servers/${encodeURIComponent(id)}/power`,{signal})});}
res.status(404).json({ok:false,error:'Unknown action'});}catch(e){res.status(500).json({ok:false,error:e.message})}};
module.exports.OWNER_BOARDS=OWNER_BOARDS;
