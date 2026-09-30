const {requireOwner}=require("../lib/auth");
const oci=require("./oci");

module.exports=async(req,res)=>{
  try{
    if(!requireOwner(req,res)) return;
    const action=String(req.query?.action||"dashboard").toLowerCase();
    if(action==="dashboard") return res.json(await oci.dashboard());

    const slot=Number(req.query?.slot||req.body?.slot);
    if(!Number.isInteger(slot)||slot<1||slot>4)
      return res.status(400).json({ok:false,error:"Server slot 1-4 is required"});

    if(action==="server"){
      const instance=await oci.getInstance(slot);
      return res.json({ok:true,server:oci.view(slot,instance)});
    }

    if(action==="power"){
      if(req.method!=="POST") return res.status(405).json({ok:false,error:"POST required"});
      return res.json(await oci.power(slot,String(req.body?.signal||"").toLowerCase()));
    }

    if(action==="console"){
      const connection=await oci.consoleConnection(slot);
      return res.json({ok:true,console:{
        provider:"oracle-cloud",
        mode:"serial-ssh",
        connectionId:connection.id||null,
        state:connection.lifecycleState||null,
        note:"OCI serial console connections are accessed with SSH; this panel returns the OCI connection resource rather than pretending it is a browser WebSocket."
      }});
    }

    if(action==="resources"){
      const instance=await oci.getInstance(slot);
      if(!instance) return res.status(503).json({ok:false,error:"Server is not configured"});
      return res.json({ok:true,resources:{
        lifecycleState:instance.lifecycleState,
        shape:instance.shape,
        ocpus:instance.shapeConfig?.ocpus??null,
        memoryGB:instance.shapeConfig?.memoryInGBs??null,
        bootVolumeSizeGB:instance.shapeConfig?.baselineOcpuUtilization??null
      }});
    }

    if(["files","file","upload","download","archive","unarchive","backup","settings"].includes(action))
      return res.status(501).json({ok:false,error:`${action} requires an OS-level agent/SSH file service and is not exposed by OCI Compute itself. The Oracle control layer is ready for that next service integration.`});

    return res.status(400).json({ok:false,error:"Unknown action"});
  }catch(e){
    console.error("OCI PANEL ERROR:",e);
    return res.status(e.status||500).json({ok:false,error:e.message||"Oracle Cloud request failed"});
  }
};