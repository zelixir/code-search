#!/usr/bin/env bun
// 消融实验: A=去IE(关键词置空) B=去打分(jev直选全部)  bun tool/ablation.mjs <PROJ> <variant A|B> <out.jsonl>
import path from "node:path";
import fs from "node:fs";
import { spawnSync } from "node:child_process";
import { initServers, shutdownServers, loadIndex, ieServer, jevServer } from "./pipeline_lib.mjs";

const PROJ = path.resolve(process.argv[2]);
const VARIANT = process.argv[3];
const OUT = process.argv[4];
const INDEX = loadIndex(PROJ);
const PY_ENV = { USERNAME: "zengjirui", USERPROFILE: "C:\\Users\\zengjirui", TEMP: "C:\\Users\\zengjirui\\AppData\\Local\\Temp", TMP: "C:\\Users\\zengjirui\\AppData\\Local\\Temp", SYSTEMROOT: "C:\\Windows", SystemRoot: "C:\\Windows", PATH: "C:\\Windows\\System32;C:\\Windows;", COMPUTERNAME: "PC", PYTHONIOENCODING: "utf-8" };
const ZG_NODE = "C:\\Program Files\\nodejs\\node.exe";
const ZG_CLI = "C:\\Users\\zengjirui\\AppData\\Roaming\\npm\\node_modules\\@zvec\\zvec-grep\\dist\\cli\\index.js";

const _roots = new Map();
function indexRoots(proj) {
  if (_roots.has(proj)) return _roots.get(proj);
  const roots = [];
  (function scan(d, depth) {
    if (depth > 5) return;
    try { if (fs.existsSync(path.join(d, ".zvec-grep"))) roots.push(d); } catch (e) {}
    let es; try { es = fs.readdirSync(d, { withFileTypes: true }); } catch (e) { return; }
    for (const e of es) if (e.isDirectory() && ![".git", "node_modules", "target", "dist", ".zvec-grep"].includes(e.name)) scan(path.join(d, e.name), depth + 1);
  })(proj, 0);
  if (!roots.length) roots.push(proj);
  _roots.set(proj, roots); return roots;
}
function rootOf(proj, f) {
  let best = proj, bestLen = -1;
  for (const r of indexRoots(proj)) {
    const rel = path.relative(r, path.join(proj, f));
    if (!rel.startsWith("..") && rel.length > bestLen) { best = r; bestLen = rel.length; }
  }
  return best;
}
function zg(repoDir, args) {
  const r = spawnSync(ZG_NODE, [ZG_CLI].concat(args), { cwd: repoDir, encoding: "utf8", timeout: 90000, maxBuffer: 32 * 1024 * 1024, env: PY_ENV });
  return (r.stdout || "") + (r.stderr || "");
}
function parseZg(output) {
  const hits = []; let cur = null;
  for (const l of output.split("\n")) {
    const m = l.match(/^#(\d+)\s+matchedBy=(\S+)\s+(\S+):(\d+)-(\d+)/);
    if (m) { if (cur) hits.push(cur); cur = { rank: +m[1], matchedBy: m[2], file: m[3], start: +m[4], end: +m[5] }; }
  }
  if (cur) hits.push(cur);
  return hits;
}
const norm = s => (s || "").toLowerCase();
function scoreMenu(query, kws, menu) {
  const q = query; const kwsN = kws.map(norm); let s = 0;
  if (q.includes(menu.name)) s += 6;
  for (const al of (menu.aliases || [])) {
    if (q.includes(al)) s += 4;
    else if (kwsN.some(k => k.includes(norm(al)) || norm(al).includes(k))) s += 2.5;
  }
  for (const k of kwsN) if (k.length >= 2 && norm(menu.name).includes(k)) s += 2;
  for (const c of (menu.seeds.controllers || [])) for (const k of kwsN) if (/^[a-z0-9_]+$/i.test(k) && norm(c).includes(k)) s += 1.5;
  return s;
}
function scoreModule(query, kws, mod) {
  let s = 0; const q = query; const kwsN = kws.map(norm);
  for (const al of (mod.aliases || [])) {
    if (q.includes(al)) s += 2;
    else if (kwsN.some(k => k.includes(norm(al)) || norm(al).includes(k))) s += 1;
  }
  s += Math.max(0, ...mod.menus.map(m => scoreMenu(query, kws, m))) * 0.8;
  return s;
}

async function search(query, ie, jev) {
  const t0 = Date.now();
  const res = { query };
  let kws = [];
  if (VARIANT === "A") {
    const r = await ie.ask({ id: "1", query });
    kws = (r.keywords || []).slice();
    for (const v of Object.values(r.fields || {})) kws.push(...v);
    res.msIE = r.ms;
  }
  const mods = INDEX.modules.map(m => ({ mod: m, s: scoreModule(query, kws, m) })).sort((a, b) => b.s - a.s);
  let modCands, chosen, j1;
  if (VARIANT === "B") {
    modCands = mods;
    j1 = await jev.ask({ id: "m", question: "一个代码检索查询为: " + query + " 。这个查询最属于哪个业务模块?", options: modCands.map(x => x.mod.name + "(" + x.mod.menus.map(mm => mm.name).join("、") + ")") });
    chosen = modCands[Math.min(j1.choice, modCands.length - 1)];
  } else {
    modCands = mods.slice(0, 3);
    j1 = await jev.ask({ id: "m", question: "一个代码检索查询为: " + query + " 。这个查询最属于哪个业务模块?", options: modCands.map(x => x.mod.name + "(" + x.mod.menus.map(mm => mm.name).join("、") + ")") });
    chosen = modCands[Math.min(j1.choice, modCands.length - 1)];
  }
  res.jevModule = { choice: chosen.mod.name, margin: j1.margin, ms: j1.ms, candidates: modCands.map(x => x.mod.name) };
  let pool;
  if (VARIANT === "B") {
    pool = chosen.mod.menus.slice();
    const second = modCands.find(x => x.mod !== chosen.mod);
    if (second && j1.margin < 3) pool = pool.concat(second.mod.menus);
  } else {
    pool = chosen.mod.menus.slice();
    const second = modCands.find(x => x.mod !== chosen.mod);
    if (second && (j1.margin < 3 || modCands[0].s < 1)) pool = pool.concat(second.mod.menus);
    const top1 = mods[0].mod;
    if (top1 !== chosen.mod) pool = pool.concat(top1.menus);
  }
  const scored = pool.map(m => ({ menu: m, s: scoreMenu(query, kws, m) })).sort((a, b) => b.s - a.s);
  let menuCands;
  if (VARIANT === "B") menuCands = scored;
  else {
    menuCands = scored.slice(0, 4);
    if (menuCands[0] && menuCands[0].s === 0) {
      const seen = new Set(menuCands.map(x => x.menu.name));
      for (const m of chosen.mod.menus) if (!seen.has(m.name)) menuCands.push({ menu: m, s: 0 });
    }
  }
  const menuDesc = menuCands.map(x => x.menu.name + ": " + (x.menu.aliases || []).slice(0, 5).join("/") + " | 涉及 " + (x.menu.seeds.controllers || []).slice(0, 2).join(","));
  const j2 = await jev.ask({ id: "g", question: "一个代码检索查询为: " + query + " 。这个查询最应该在哪个功能菜单的代码里找?", options: menuDesc });
  const menu = menuCands[Math.min(j2.choice, menuCands.length - 1)];
  res.jevMenu = { choice: menu.menu.name, margin: j2.margin, ms: j2.ms, candidates: menuCands.map(x => x.menu.name) };
  const fe = menu.menu.fe || {};
  const scopeFe = [].concat(fe.view ? [fe.view] : [], fe.api || [], fe.dir ? [fe.dir + "/**"] : []);
  const beFiles = menu.menu.beFiles || [];
  const qArgs = ["query", "--hybrid", query, "--limit", "6"];
  const stripFor = f => path.relative(rootOf(PROJ, f), path.join(PROJ, f)).replace(/\\/g, "/");
  let beHits = [], feHits = [];
  if (beFiles.length) {
    const root = rootOf(PROJ, beFiles[0]);
    beHits = parseZg(zg(root, qArgs.concat(beFiles.flatMap(f => ["-g", stripFor(f)])))).map(h => Object.assign(h, { repo: "BE", root }));
  }
  if (scopeFe.length) {
    const root = rootOf(PROJ, scopeFe[0]);
    feHits = parseZg(zg(root, qArgs.concat(scopeFe.flatMap(f => ["-g", stripFor(f)])))).map(h => Object.assign(h, { repo: "FE", root }));
  }
  if (!beHits.length && !feHits.length) {
    res.degraded = true;
    for (const root of indexRoots(PROJ)) {
      const hits = parseZg(zg(root, ["query", "--hybrid", query, "--limit", "5"])).map(h => Object.assign(h, { repo: path.basename(root), root }));
      if (!beHits.length) beHits = hits; else feHits = feHits.concat(hits);
    }
  }
  const dedupe = arr => { const seen = new Set(); return arr.filter(h => { const k = h.repo + ":" + h.file; if (seen.has(k)) return false; seen.add(k); return true; }); };
  res.hits = dedupe(beHits).slice(0, 6).concat(dedupe(feHits).slice(0, 4));
  res.ms = Date.now() - t0;
  return res;
}

const gt = fs.readFileSync(path.join(PROJ, "eval", "queries.jsonl"), "utf8").split(/\r?\n/).filter(Boolean).map(l => JSON.parse(l));
await initServers(m => console.error(m), { ie: VARIANT === "A" });
const out = fs.openSync(OUT, "w");
let i = 0;
for (const o of gt) {
  i++; console.error("[" + VARIANT + " " + i + "/" + gt.length + "] " + o.query);
  let r;
  try { r = await search(o.query, ieServer, jevServer); } catch (e) { r = { query: o.query, error: String(e.message || e) }; }
  r.id = o.id;
  fs.writeSync(out, JSON.stringify(r) + "\n");
}
fs.closeSync(out);
shutdownServers();
console.error("DONE " + VARIANT);