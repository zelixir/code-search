// 检索管道核心库: 供 webserver.mjs 与 search.mjs(CLI) 共用
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { existsSync } from "node:fs";

export const PY_ENV = {
  USERNAME: "zengjirui", USERPROFILE: "C:\\Users\\zengjirui",
  APPDATA: "C:\\Users\\zengjirui\\AppData\\Roaming", LOCALAPPDATA: "C:\\Users\\zengjirui\\AppData\\Local",
  TEMP: "C:\\Users\\zengjirui\\AppData\\Local\\Temp", TMP: "C:\\Users\\zengjirui\\AppData\\Local\\Temp",
  SYSTEMROOT: "C:\\Windows", SystemRoot: "C:\\Windows", PATH: "C:\\Windows\\System32;C:\\Windows;",
  COMPUTERNAME: "PC", OS: "Windows_NT", PATHEXT: ".COM;.EXE;.BAT;.CMD", PYTHONIOENCODING: "utf-8",
};
const ZG_NODE = "C:\\Program Files\\nodejs\\node.exe";
const ZG_CLI = "C:\\Users\\zengjirui\\AppData\\Roaming\\npm\\node_modules\\@zvec\\zvec-grep\\dist\\cli\\index.js";
const IE_PY = "D:\\ai\\code-search\\.venv-ie\\Scripts\\python.exe";
const IE_PY_ = "D:\\ai\\code-search\\tool\\ie_server.py";
const JEV_PY = "D:\\ai\\anime-text-filter\\.venv\\Scripts\\python.exe";
const JEV_PY_ = "D:\\ai\\code-search\\tool\\jev_server.py";

function startServer(cmd, args) {
  const p = spawn(cmd, args, { stdio: ["pipe", "pipe", "pipe"], env: PY_ENV });
  let buf = ""; let stderr = "";
  p.stdout.on("data", d => { buf += d.toString(); });
  p.stderr.on("data", d => { stderr = (stderr + d.toString()).slice(-600); });
  const waitLine = ms => new Promise((res, rej) => {
    const t0 = Date.now();
    const iv = setInterval(() => {
      const nl = buf.indexOf("\n");
      if (nl >= 0) { clearInterval(iv); res(buf.slice(0, nl)); buf = buf.slice(nl + 1); }
      else if (Date.now() - t0 > ms) { clearInterval(iv); rej(new Error("server timeout: " + stderr)); }
    }, 100);
  });
  return {
    async ask(obj, timeoutMs) { p.stdin.write(JSON.stringify(obj) + "\n"); return JSON.parse(await waitLine(timeoutMs || 60000)); },
    async ready(timeoutMs) { return JSON.parse(await waitLine(timeoutMs || 300000)); },
    kill() { try { p.kill(); } catch (e) {} },
  };
}

export let ieServer = null, jevServer = null;
export async function initServers(log, opts) {
  opts = opts || {};
  if (ieServer && jevServer) return;
  if (opts.ie) ieServer = startServer(IE_PY, [IE_PY_]);
  jevServer = startServer(JEV_PY, [JEV_PY_]);
  let ri = null; if (ieServer) ri = await ieServer.ready();
  const rj = await jevServer.ready();
  if (log) log("[servers] ie=" + JSON.stringify(ri) + " jev=" + JSON.stringify(rj));
}
export function shutdownServers() { try { ieServer && ieServer.kill(); jevServer && jevServer.kill(); } catch (e) {} ieServer = jevServer = null; }

function zg(repoDir, args, timeoutMs) {
  const r = spawnSync(ZG_NODE, [ZG_CLI].concat(args), {
    cwd: repoDir, encoding: "utf8", timeout: timeoutMs || 90000, maxBuffer: 32 * 1024 * 1024, env: PY_ENV,
  });
  return (r.stdout || "") + (r.stderr || "");
}

function parseZg(output) {
  const hits = []; let cur = null;
  for (const l of output.split("\n")) {
    const m = l.match(/^#(\d+)\s+matchedBy=(\S+)\s+(\S+):(\d+)-(\d+)/);
    if (m) {
      if (cur) hits.push(cur);
      cur = { rank: +m[1], matchedBy: m[2], file: m[3], start: +m[4], end: +m[5], text: "" };
    } else if (cur && /^\s/.test(l)) cur.text += l + "\n";
  }
  if (cur) hits.push(cur);
  return hits;
}

const _rootCache = new Map();
function indexRoots(proj) {
  if (_rootCache.has(proj)) return _rootCache.get(proj);
  const roots = [];
  (function scan(d, depth) {
    if (depth > 5) return;
    if (existsSync(path.join(d, ".zvec-grep"))) roots.push(d);
    let es; try { es = fs.readdirSync(d, { withFileTypes: true }); } catch (e) { return; }
    for (const e of es) if (e.isDirectory() && ![".git", "node_modules", "target", "dist", ".zvec-grep"].includes(e.name)) scan(path.join(d, e.name), depth + 1);
  })(proj, 0);
  if (!roots.length) roots.push(proj);
  _rootCache.set(proj, roots);
  return roots;
}
function rootOf(proj, f) {
  let best = proj, bestLen = -1;
  for (const r of indexRoots(proj)) {
    const rel = path.relative(r, path.join(proj, f));
    if (!rel.startsWith("..") && rel.length > bestLen) { best = r; bestLen = rel.length; }
  }
  return best;
}

function norm(s) { return (s || "").toLowerCase(); }
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

const _idxCache = new Map();
export function loadIndex(proj) {
  if (_idxCache.has(proj)) return _idxCache.get(proj);
  const idx = JSON.parse(fs.readFileSync(path.join(proj, "index", "code_index.json"), "utf8"));
  _idxCache.set(proj, idx);
  return idx;
}

export async function search(query, opts) {
  opts = opts || {};
  const PROJ = path.resolve(opts.proj);
  const INDEX = loadIndex(PROJ);
  const t0 = Date.now();
  const res = { query, steps: {} };
  let kws = [];
  if (ieServer) {
    const ie = await ieServer.ask({ id: "1", query });
    kws = (ie.keywords || []).slice();
    for (const v of Object.values(ie.fields || {})) kws.push(...v);
    res.steps.extract = { keywords: kws.slice(), ms: ie.ms };
  }
  const mods = INDEX.modules.map(m => ({ mod: m, s: scoreModule(query, kws, m) })).sort((a, b) => b.s - a.s);
  const modCands = mods.slice(0, 3);
  res.steps.moduleScores = mods.map(x => ({ name: x.mod.name, s: +x.s.toFixed(1) }));
  const modOpts = modCands.map(x => x.mod.name + "(" + x.mod.menus.map(mm => mm.name).join("、") + ")");
  const j1 = await jevServer.ask({ id: "m", question: "一个代码检索查询为: " + query + " 。这个查询最属于哪个业务模块?", options: modOpts });
  const chosen = modCands[Math.min(j1.choice, modCands.length - 1)];
  res.steps.jevModule = { choice: chosen.mod.name, margin: j1.margin, ms: j1.ms, candidates: modCands.map(x => x.mod.name) };
  let menuPool = chosen.mod.menus.slice();
  const second = modCands.find(x => x.mod !== chosen.mod);
  if (second && (j1.margin < 3 || modCands[0].s < 1)) menuPool = menuPool.concat(second.mod.menus);
  const scoreTop1 = mods[0].mod;
  if (scoreTop1 !== chosen.mod) menuPool = menuPool.concat(scoreTop1.menus);
  const scored = menuPool.map(m => ({ menu: m, s: scoreMenu(query, kws, m) })).sort((a, b) => b.s - a.s);
  let menuCands = scored.slice(0, 4);
  if (menuCands[0] && menuCands[0].s === 0) {
    const seen = new Set(menuCands.map(x => x.menu.name));
    for (const m of chosen.mod.menus) if (!seen.has(m.name)) menuCands.push({ menu: m, s: 0 });
  }
  res.steps.menuScores = scored.slice(0, 8).map(x => ({ name: x.menu.name, s: +x.s.toFixed(1) }));
  const menuDesc = menuCands.map(x => x.menu.name + ": " + (x.menu.aliases || []).slice(0, 5).join("/") + " | 涉及 " + (x.menu.seeds.controllers || []).slice(0, 2).join(","));
  const j2 = await jevServer.ask({ id: "g", question: "一个代码检索查询为: " + query + " 。这个查询最应该在哪个功能菜单的代码里找?", options: menuDesc });
  const menu = menuCands[Math.min(j2.choice, menuCands.length - 1)];
  res.steps.jevMenu = { choice: menu.menu.name, margin: j2.margin, ms: j2.ms, candidates: menuCands.map(x => x.menu.name) };
  const fe = menu.menu.fe || {};
  const scopeFe = [].concat(fe.view ? [fe.view] : [], fe.api || [], fe.dir ? [fe.dir + "/**"] : []);
  const beFiles = menu.menu.beFiles || [];
  const kwFts = menu.menu.en || (query.match(/[a-zA-Z][a-zA-Z0-9_]{2,}/g) || [])[0] || "";  // 优先菜单英文种子词, 兜底查询里的英文词
  const qArgs = ["query", "--hybrid", query, "--limit", "6"];
  if (menu.menu.en) qArgs.push("--vector", menu.menu.en);
  if (kwFts) qArgs.push("--fts", kwFts);
  if (menu.menu.en || kwFts) qArgs.push("--fuse");
  const stripFor = f => path.relative(rootOf(PROJ, f), path.join(PROJ, f)).replace(/\\/g, "/");
  let beHits = [], feHits = [];
  if (beFiles.length) {
    const root = rootOf(PROJ, beFiles[0]);
    const g = beFiles.flatMap(f => ["-g", stripFor(f)]);
    beHits = parseZg(zg(root, qArgs.concat(g))).map(h => Object.assign(h, { repo: "BE", root }));
  }
  if (scopeFe.length) {
    const root = rootOf(PROJ, scopeFe[0]);
    const g = scopeFe.flatMap(f => ["-g", stripFor(f)]);
    feHits = parseZg(zg(root, qArgs.concat(g))).map(h => Object.assign(h, { repo: "FE", root }));
  }
  if (!beHits.length && !feHits.length) {
    res.degraded = true;
    const roots = indexRoots(PROJ);
    for (const root of roots) {
      const hits = parseZg(zg(root, ["query", "--hybrid", query, "--limit", "5"])).map(h => Object.assign(h, { repo: path.basename(root), root }));
      if (!beHits.length) beHits = hits; else feHits = feHits.concat(hits);
    }
  }
  const dedupe = arr => {
    const seen = new Set();
    return arr.filter(h => { const k = h.repo + ":" + h.file; if (seen.has(k)) return false; seen.add(k); return true; });
  };
  const finalHits = dedupe(beHits).slice(0, 6).concat(dedupe(feHits).slice(0, 4));
  for (const h of finalHits) {
    h.absPath = path.join(h.root || PROJ, h.file);
    try {
      const lines = fs.readFileSync(h.absPath, "utf8").split(/\r?\n/);
      const cap = Math.min(h.end, h.start + 79);
      h.code = lines.slice(h.start - 1, cap).map((l, i) => ({ n: h.start + i, l: l.slice(0, 240) }));
      h.totalLines = lines.length;
    } catch (e) { h.code = []; }
    delete h.root; delete h.text;
  }
  res.hits = finalHits;
  res.proj = PROJ;
  res.ms = Date.now() - t0;
  return res;
}

// 串行队列: jev/ie 协议按 FIFO 配对, 并发请求必须排队
let _chain = Promise.resolve();
export function searchQueued(query, opts) {
  const p = _chain.then(() => search(query, opts));
  _chain = p.catch(() => {});
  return p;
}