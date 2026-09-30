const {requireOwner}=require("../lib/auth");
const oci=require("./oci");
module.exports=async(req,res)=>{
 try{
  if(!requireOwner(req,res))return;
  const action=String(req.query?.action||"dashboard").toLowerCase();
  if(action==="dashboard")return res.json(await oci.dashboard());
  const slot=Number(req.query?.slot||req.body?.slot);
  if(!Number.isInteger(slot)||slot<1||slot>4)return res.status(400).json({ok:false,error:"Server slot 1-4 is required"});
  if(action==="server")return res.json({ok:true,server:oci.view(slot,await oci.getInstance(slot))});
  if(action==="power"){
   if(req.method!=="POST")return res.status(405).json({ok:false,error:"POST required"});
   return res.json(await oci.power(slot,String(req.body?.signal||"").toLowerCase()));
  }
  if(action==="resources"){
   const i=await oci.getInstance(slot);
   if(!i)return res.status(503).json({ok:false,error:"Server is not configured"});
   return res.json({ok:true,resources:{lifecycleState:i.lifecycleState,shape:i.shape,ocpus:i.shapeConfig?.ocpus??null,memoryGB:i.shapeConfig?.memoryInGBs??null}});
  }
  if(["console","files","file","upload","download","archive","unarchive","backup","settings"].includes(action))
   return res.status(501).json({ok:false,error:action+" is reserved for the Oracle service layer."});
  return res.status(400).json({ok:false,error:"Unknown action"});
 }catch(e){
  console.error("OCI PANEL ERROR:",e);
  return res.status(e.status||500).json({ok:false,error:e.message||"Oracle Cloud request failed"});
 }
};