const {requireOwner}=require("../lib/auth");
function repoInfo(input){
 const raw=String(input||"").trim().replace(/\.git$/,"").replace(/\/+$/,"");
 const m=raw.match(/^https?:\/\/github\.com\/([^/]+)\/([^/#?]+)(?:[?#].*)?$/i)||raw.match(/^github\.com\/([^/]+)\/([^/#?]+)$/i);
 if(!m)throw Object.assign(new Error("Use a GitHub repository URL like https://github.com/owner/repo"),{status:400});
 return{owner:m[1],repo:m[2]};
}
async function gh(path){
 const token=String(process.env.GITHUB_TOKEN||"").trim();
 const r=await fetch("https://api.github.com"+path,{headers:{Accept:"application/vnd.github+json","X-GitHub-Api-Version":"2026-03-10",...(token?{Authorization:"Bearer "+token}:{})}});
 const t=await r.text();let d={};try{d=t?JSON.parse(t):{}}catch{}
 if(!r.ok)throw Object.assign(new Error(r.status===404?"Repository not found or not accessible. Private repos require GITHUB_TOKEN.":d?.message||"GitHub request failed"),{status:r.status});
 return d;
}
module.exports=async(req,res)=>{
 try{
  if(!requireOwner(req,res))return;
  const action=String(req.query?.action||"info").toLowerCase();
  if(action==="info"){
   const {owner,repo}=repoInfo(req.body?.url||req.query?.url);
   const d=await gh("/repos/"+encodeURIComponent(owner)+"/"+encodeURIComponent(repo));
   const b=await gh("/repos/"+encodeURIComponent(owner)+"/"+encodeURIComponent(repo)+"/branches?per_page=100");
   return res.json({ok:true,repository:{fullName:d.full_name,name:d.name,private:!!d.private,defaultBranch:d.default_branch,description:d.description||"",htmlUrl:d.html_url,branches:(b||[]).map(x=>x.name)},privateAccess:!!String(process.env.GITHUB_TOKEN||"").trim()});
  }
  if(action==="deploy")return res.status(501).json({ok:false,error:"Oracle deployment agent is not connected yet. GitHub inspection is ready; deployment will be enabled after the Oracle server agent is added."});
  return res.status(400).json({ok:false,error:"Unknown action"});
 }catch(e){return res.status(e.status||500).json({ok:false,error:e.message||"GitHub operation failed"});}
};