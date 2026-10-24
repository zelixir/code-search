#!/usr/bin/env bun
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
const PY_ENV = { USERNAME: "zengjirui", USERPROFILE: "C:/Users/zengjirui", TEMP: "C:/Users/zengjirui/AppData/Local/Temp", TMP: "C:/Users/zengjirui/AppData/Local/Temp", SYSTEMROOT: "C:/Windows", SystemRoot: "C:/Windows", PATH: "C:/Windows/System32;C:/Windows;", COMPUTERNAME: "PC", PYTHONIOENCODING: "utf-8" };
const NODE = "C:/Program Files/nodejs/node.exe";
const ZG = "C:/Users/zengjirui/AppData/Roaming/npm/node_modules/@zvec/zvec-grep/dist/cli/index.js";
const ROOT = "D:/ai/code-search-repo/projects/ruoyi/repos/RuoYi-Vue";
const ROOT3 = "D:/ai/code-search-repo/projects/ruoyi/repos/RuoYi-Vue3";
const p = spawn("D:/ai/anime-text-filter/.venv/Scripts/python.exe", ["D:/ai/code-search/tool/jev_server.py"], { stdio: ["pipe", "pipe", "pipe"], env: PY_ENV });
let jbuf = ""; p.stdout.on("data", d => jbuf += d.toString());
const waitLine = ms => new Promise((res, rej) => { const t0 = Date.now(); const iv = setInterval(() => { const nl = jbuf.indexOf("\n"); if (nl >= 0) { clearInterval(iv); res(JSON.parse(jbuf.slice(0, nl))); jbuf = jbuf.slice(nl + 1); } else if (Date.now() - t0 > ms) { clearInterval(iv); rej(new Error("timeout")); } }, 100); });
await waitLine(300000);
const INDEX = JSON.parse(fs.readFileSync("D:/ai/code-search-repo/projects/ruoyi/index/code_index.json", "utf8"));
const allMenus = INDEX.modules.flatMap(m => m.menus);
const byName = Object.fromEntries(allMenus.map(m => [m.name, m]));
const modOf = new Map(INDEX.modules.flatMap(x => x.menus.map(m => [m.name, x.name])));
function mulberry32(a) { return function() { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function shuffle(arr, rnd) { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
async function askMenus(query, menuNames) {
  const opts = menuNames.map(n => { const m = byName[n]; return m.name + ": " + (m.aliases || []).slice(0, 5).join("/") + " | 涉及 " + (m.seeds.controllers || []).slice(0, 2).join(","); });
  p.stdin.write(JSON.stringify({ id: "s", question: "一个代码检索查询为: " + query + " 。这个查询最应该在哪个功能菜单的代码里找?", options: opts }) + "\n");
  const r = await waitLine(60000);
  return { pick: menuNames[Math.min(r.choice, menuNames.length - 1)], margin: r.margin };
}
const norm = x => x.replace(/\\/g, "/").toLowerCase();
function zgScope(menus, query) {
  const seen = new Set(); const beG = []; const feG = []; let en = "";
  for (const name of menus) {
    const m = byName[name];
    if (m.en && !en) en = m.en;
    for (const f of (m.beFiles || [])) { const rel = f.replace(/^repos\/[^/]+\//, ""); if (!seen.has("B" + rel)) { seen.add("B" + rel); beG.push(rel); } }
    const fe = m.fe || {};
    for (const f of [].concat(fe.view ? [fe.view] : [], fe.api || [], fe.dir ? [fe.dir + "/**"] : [])) { const rel = f.replace(/^repos\/[^/]+\//, ""); if (!seen.has("F" + rel)) { seen.add("F" + rel); feG.push(rel); } }
  }
  const qArgs = ["query", "--hybrid", query, "--limit", "6"];
  if (en) qArgs.push("--vector", en, "--fts", en, "--fuse");
  const collect = (cwd, globs) => {
    if (!globs.length) return [];
    const r = spawnSync(NODE, [ZG].concat(qArgs).concat(globs.flatMap(g => ["-g", g])), { cwd, encoding: "utf8", timeout: 90000, env: PY_ENV, maxBuffer: 32*1024*1024 });
    return ((r.stdout || "").match(/^#\d+\s+matchedBy=\S+\s+(\S+):(\d+)-(\d+)/gm) || []).map(x => { const mm = x.match(/(\S+):(\d+)-(\d+)/); return { file: mm[1], start: +mm[2], end: +mm[3] }; });
  };
  return collect(ROOT, beG).slice(0, 8).concat(collect(ROOT3, feG).slice(0, 6));
}
const [, , qFile, outFile] = process.argv;  // argv[0]=bun argv[1]=脚本
const queries = fs.readFileSync(qFile, "utf8").split(/\r?\n/).filter(Boolean).map(l => JSON.parse(l));
const out = fs.openSync(outFile, "w");
let i = 0;
for (const o of queries) {
  i++; console.error("[B3 " + i + "/" + queries.length + "] " + o.query);
  const t0 = Date.now();
  const rnd = mulberry32(999 + +o.id.replace(/\D/g, ""));
  const names = shuffle(allMenus.map(m => m.name), rnd);
  const groups = []; for (let k = 0; k < names.length; k += 11) groups.push(names.slice(k, k + 11));
  const winners = []; for (const g of groups) winners.push((await askMenus(o.query, g)).pick);
  const hits = zgScope(winners, o.query);
  const finalMenu = winners[0];
  const rec = { id: o.id, query: o.query, ms: Date.now() - t0, degraded: hits.length === 0,
    steps: { jevModule: { choice: modOf.get(finalMenu) || "", margin: 0, ms: 0, candidates: [] }, jevMenu: { choice: finalMenu, margin: 0, ms: 0, candidates: winners } },
    hits };
  fs.writeSync(out, JSON.stringify(rec) + "\n");
}
fs.closeSync(out); p.kill();
console.error("B3_DONE");