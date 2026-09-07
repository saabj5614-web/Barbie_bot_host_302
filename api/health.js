module.exports=(req,res)=>res.json({ok:true,service:process.env.PANEL_NAME||'Barbie Hosting',time:new Date().toISOString()});
