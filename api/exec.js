import { exec } from "child_process";
import fs from "fs";

const BASE = "/tmp/term";
fs.mkdirSync(BASE, { recursive: true });
fs.mkdirSync(BASE + "/home", { recursive: true });
fs.mkdirSync(BASE + "/.npm", { recursive: true });
fs.mkdirSync(BASE + "/.cache", { recursive: true });

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  let body="";
  await new Promise(r=>{
    req.on("data",c=>body+=c);
    req.on("end",r);
  });

  let { cmd } = JSON.parse(body || "{}");
  if(!cmd) return res.json({output:"no cmd"});

  // escape kutip biar ga jebol shell
  cmd = cmd.replace(/'/g,"'\\''");

  const full = `
export HOME=${BASE}/home
export USER=vercel
export LOGNAME=vercel
export SHELL=/bin/bash
export TERM=xterm-256color

export TMPDIR=${BASE}
export npm_config_cache=${BASE}/.npm
export XDG_CACHE_HOME=${BASE}/.cache
export PIP_CACHE_DIR=${BASE}/.cache/pip

export PATH=${BASE}/node_modules/.bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin

cd ${BASE}

alias ll="ls -lah"
alias la="ls -a"
alias l="ls -CF"

bash -lc '${cmd}'
`;

  exec(full,{
    timeout: 20000,
    maxBuffer: 1024*1024*8,
    env: process.env
  },(e,out,err)=>{
    res.json({
      output: (out || "") + (err || "") + (e ? e.toString() : "")
    });
  });
}
