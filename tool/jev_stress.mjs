#!/usr/bin/env bun
// bun tool/jev_stress.mjs <PROJ> — 测 jev 选项数上限与多轮淘汰赛精度
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const PROJ = path.resolve(process.argv[2]);
const PY_ENV = { USERNAME: "zengjirui", USERPROFILE: "C:\\Users\\zengjirui", TEMP: "C:\\Users\\zengjirui\\AppData\\Local\\Temp", TMP: "C:\\Users\\zengjirui\\AppData\\Local\\Temp", SYSTEMROOT: "C:\\Windows", SystemRoot: "C:\\Windows", PATH: "C:\\Windows\\System32;C:\\Windows;", COMPUTERNAME: "PC", PYTHONIOENCODING: "utf-8" };
function startServer() {
  const p = spawn("D:\\ai\\anime-text-filter\\.venv\\Scripts\\python.exe", [path.join(import.meta.dir, "jev_server.py")], { stdio: ["pipe", "pipe", "pipe"], env: PY_ENV });
  let buf = "";
  p.stdout.on("data", d => { buf += d.toString(); });
  const waitLine = ms => new Promise((res, rej) => { const t0 = Date.now(); const iv = setInterval(() => { const nl = buf.indexOf("\n"); if (nl >= 0) { clearInterval(iv); res(buf.slice(0, nl)); buf = buf.slice(nl + 1); } else if (Date.now() - t0 > ms) { clearInterval(iv); rej(new Error("timeout")); } }, 100); });
  return { async ask(obj, t) { p.stdin.write(JSON.stringify(obj) + "\n"); return JSON.parse(await waitLine(t || 60000)); }, async ready() { return waitLine(300000); }, kill() { try { p.kill(); } catch (e) {} } };
}

// 简易可复现随机(种子)
function mulberry32(a) { return function() { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function shuffle(arr, rnd) { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

const INDEX = JSON.parse(fs.readFileSync(path.join(PROJ, "index", "code_index.json"), "utf8"));
const allMenus = INDEX.modules.flatMap(m => m.menus);
const desc = m => m.name + ": " + (m.aliases || []).slice(0, 5).join("/") + " | 涉及 " + (m.seeds.controllers || []).slice(0, 2).join(",");
const byName = new Map(allMenus.map(m => [m.name, m]));
const gt = fs.readFileSync(path.join(PROJ, "eval", "ground_truth.jsonl"), "utf8").split(/\r?\n/).filter(Boolean).map(l => JSON.parse(l));

const server = startServer();
const ready = await server.ready();
console.error("[stress] jev ready: " + JSON.stringify(ready));

async function askMenus(query, menuNames) {
  const opts = menuNames.map(n => desc(byName.get(n)));
  const r = await server.ask({ id: "s", question: "一个代码检索查询为: " + query + " 。这个查询最应该在哪个功能菜单的代码里找?", options: opts });
  return { pick: menuNames[Math.min(r.choice, menuNames.length - 1)], margin: r.margin, ms: r.ms };
}

const SIZES = [5, 8, 12, 16, 20, 26];
const SEEDS = [7, 42, 2024];
const stats = {};
for (const N of SIZES) stats[N] = { ok: 0, n: 0, margin: 0, ms: 0 };
let calls = 0;
const t0 = Date.now();
for (const g of gt) {
  if (!byName.has(g.expectMenu)) continue;
  for (const seed of SEEDS) {
    const rnd = mulberry32(seed * 1000 + +g.id.replace(/\D/g, ""));
    const distractors = shuffle(allMenus.map(m => m.name).filter(n => n !== g.expectMenu), rnd).slice(0, 0);
    for (const N of SIZES) {
      const d = shuffle(allMenus.map(m => m.name).filter(n => n !== g.expectMenu), rnd).slice(0, N - 1);
      const opts = shuffle([g.expectMenu].concat(d), rnd);
      const r = await askMenus(g.query, opts);
      const s = stats[N]; s.n++; if (r.pick === g.expectMenu) s.ok++; s.margin += r.margin; s.ms += r.ms; calls++;
    }
  }
  console.error("[stress] " + g.id + " 完成, 累计调用 " + calls);
}

// 多轮淘汰赛: 全部菜单(33) → 组内 ≤11 选头名 → 决赛
let tOK = 0, tN = 0, tCalls = 0;
for (const g of gt) {
  if (!byName.has(g.expectMenu)) continue;
  const rnd = mulberry32(999 + +g.id.replace(/\D/g, ""));
  const names = shuffle(allMenus.map(m => m.name), rnd);
  const groups = [];
  for (let i = 0; i < names.length; i += 11) groups.push(names.slice(i, i + 11));
  const winners = [];
  let round = 1;
  for (const grp of groups) {
    const r = await askMenus(g.query, grp); tCalls++;
    winners.push(r.pick);
  }
  while (winners.length > 1) {
    const r = await askMenus(g.query, winners); tCalls++;
    winners.length = 0; winners.push(r.pick);
  }
  tN++; if (winners[0] === g.expectMenu) tOK++;
  console.error("[tour] " + g.id + " 冠军=" + winners[0] + " 期望=" + g.expectMenu);
}

const report = { perSize: {}, tournament33: { ok: tOK, n: tN, acc: +(100 * tOK / tN).toFixed(1), avgCalls: +(tCalls / tN).toFixed(1) }, totalMs: Date.now() - t0 };
for (const N of SIZES) { const s = stats[N]; report.perSize[N] = { n: s.n, acc: +(100 * s.ok / s.n).toFixed(1), avgMargin: +(s.margin / s.n).toFixed(2), avgMs: +(s.ms / s.n).toFixed(0) }; }
fs.writeFileSync(path.join(PROJ, "eval", "jev_stress.json"), JSON.stringify(report, null, 1), "utf8");
console.log(JSON.stringify(report, null, 1));
server.kill();