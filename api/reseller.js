const {post}=require('./ptero/client');const {requireOwner}=require('../lib/auth');
module.exports=async(req,res)=>{try{if(!requireOwner(req,res))return;if(req.method!=='POST')return res.status(405).json({ok:false});const b=req.body||{};if(!b.email||!b.username||!b.firstName||!b.lastName)return res.status(400).json({ok:false,error:'email, username, firstName, lastName required'});
const u=await post('/api/application/users',{email:b.email,username:b.username,first_name:b.firstName,last_name:b.lastName,password:b.password||undefined});
if(!b.server) return res.json({ok:true,user:u,server:null});
const s=b.server;const server=await post('/api/application/servers',{name:s.name||`${b.username} Bot`,user:u.attributes.id,egg:Number(s.eggId),docker_image:s.dockerImage||'ghcr.io/pterodactyl/yolks:nodejs_22',startup:s.startup||'npm start',environment:s.environment||{},limits:{memory:Number(s.memoryMB||process.env.DEFAULT_RAM_MB||2048),swap:0,disk:Number(s.diskMB||process.env.DEFAULT_DISK_MB||4096),io:500,cpu:Number(s.cpuPercent||process.env.DEFAULT_CPU_PERCENT||100),threads:null},feature_limits:{databases:0,allocations:1,backups:0},deploy:{locations:[Number(s.locationId)],port_range:[],dedicated_ip:false},start_on_completion:false});
res.json({ok:true,user:u,server});}catch(e){res.status(500).json({ok:false,error:e.message})}};

