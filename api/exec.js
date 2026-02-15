import { exec } from "child_process";
import fs from "fs";

const BASE = "/tmp/term";
if (!fs.existsSync(BASE)) fs.mkdirSync(BASE, { recursive: true });

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  let body="";
  await new Promise(r=>{
    req.on("data",c=>body+=c);
    req.on("end",r);
  });

  let { cmd } = JSON.parse(body || "{}");
  if(!cmd) return res.json({output:"no cmd"});

  const full = `
    export HOME=${BASE};
    export TMPDIR=${BASE};
    cd ${BASE};
    bash -lc '${cmd.replace(/'/g,"'\\''")}'
  `;

  exec(full, {
    timeout: 15000,
    maxBuffer: 1024*1024*4,
    env: { ...process.env, HOME: BASE }
  }, (e,out,err)=>{
    res.json({ output: out || err || String(e) });
  });
}
