import { execFile } from "child_process";
import fs from "fs";

const BASE = "/tmp/term";

// bikin struktur pseudo home
[BASE, BASE+"/home", BASE+"/.npm", BASE+"/.cache"].forEach(p=>{
  if(!fs.existsSync(p)) fs.mkdirSync(p,{recursive:true});
});

export default async function handler(req,res){
  if(req.method!=="POST") return res.status(405).end();

  let body="";
  await new Promise(r=>{
    req.on("data",c=>body+=c);
    req.on("end",r);
  });

  let {cmd}=JSON.parse(body||"{}");
  if(!cmd) return res.json({output:"no cmd"});

  // environment linux palsu tapi stabil
  const env={
    ...process.env,
    HOME:BASE+"/home",
    USER:"vercel",
    LOGNAME:"vercel",
    TERM:"xterm",
    TMPDIR:BASE,
    npm_config_cache:BASE+"/.npm",
    XDG_CACHE_HOME:BASE+"/.cache",
    PIP_CACHE_DIR:BASE+"/.cache/pip",
    PATH:[
      BASE+"/node_modules/.bin",
      "/var/lang/bin",
      "/usr/local/bin",
      "/usr/bin",
      "/bin"
    ].join(":")
  };

  execFile(
    "/bin/bash",
    ["-c",cmd],
    {
      cwd:BASE,
      env,
      timeout:20000,
      maxBuffer:1024*1024*8
    },
    (e,out,err)=>{
      res.json({
        output:(out||"")+(err||"")+(e?e.toString():"")
      });
    }
  );
}
