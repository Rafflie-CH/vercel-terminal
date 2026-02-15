import { exec } from "child_process";
import fs from "fs";

const BASE = "/tmp/term";
const HOME = BASE + "/home";
const CACHE = BASE + "/.cache";
const NPM = BASE + "/.npm";

[BASE, HOME, CACHE, NPM].forEach(p => fs.mkdirSync(p, { recursive: true }));

// bashrc biar tiap session berasa linux normal
const bashrc = `
export USER=vercel
export LOGNAME=vercel
export SHELL=/bin/bash
export TERM=xterm-256color
export HOME=${HOME}
export TMPDIR=${BASE}
export XDG_CACHE_HOME=${CACHE}
export npm_config_cache=${NPM}
export PIP_CACHE_DIR=${CACHE}/pip

export PATH=${BASE}/node_modules/.bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/var/lang/bin

alias ll="ls -lah"
alias la="ls -a"
alias l="ls -CF"

# fallback npm kalau binary ga ada
if ! command -v npm >/dev/null 2>&1; then
  if [ -f /var/lang/lib/node_modules/npm/bin/npm-cli.js ]; then
    alias npm="node /var/lang/lib/node_modules/npm/bin/npm-cli.js"
    alias npx="node /var/lang/lib/node_modules/npm/bin/npx-cli.js"
  fi
fi
`;
fs.writeFileSync(HOME + "/.bashrc", bashrc);

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  let body="";
  await new Promise(r=>{
    req.on("data",c=>body+=c);
    req.on("end",r);
  });

  let { cmd } = JSON.parse(body || "{}");
  if(!cmd) return res.json({output:"no cmd"});

  cmd = cmd.replace(/'/g,"'\\''");

  const full = `
cd ${HOME}
bash --rcfile ${HOME}/.bashrc -ic '${cmd}'
`;

  exec(full,{
    timeout: 20000,
    maxBuffer: 1024*1024*8,
    env: process.env
  },(e,out,err)=>{
    res.json({
      output:(out||"")+(err||"")+(e?e.toString():"")
    });
  });
}
