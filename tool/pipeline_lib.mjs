#!/usr/bin/env bun
// 检索管道核心库 v5: 判断题范式(全菜单 batch yes/no → 作用域zg → 文件 batch yes/no → 不命中重试≤3)
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
const JEV_PY = "D:\\ai\\anime-text-filter\\.venv\\Scripts\\python.exe";
const JEV_PY_ = "D:\\ai\\code-search\\tool\\jev_server.py";

function startServer(cmd, args) {
  const p = spawn(cmd, args, { stdio: ["pipe", "pipe", "pipe"], env: PY_ENV });
  let buf = "";
  let stderr = "";
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
  if (opts.ie) ieServer = startServer("D:\\ai\\code-search\\.venv-ie\\Scripts\\python.exe", ["D:\\ai\\code-search\\tool\\ie_server.py"]);
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
      cur = { rank: +m[1], matchedBy: m[2], file: m[3], start: +m[4], end: +m[5] };
    }
  }
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

const _idxCache = new Map();
export function loadIndex(proj) {
  if (_idxCache.has(proj)) return _idxCache.get(proj);
  const idx = JSON.parse(fs.readFileSync(path.join(proj, "index", "code_index.json"), "utf8"));
  _idxCache.set(proj, idx);
  return idx;
}

const MAX_ROUNDS = 3;
function menuQuestion(query, m, tried, notes) {
  let q = "一个代码检索查询为: " + query + " 。候选菜单: " + m.name + " (" + (m.aliases || []).slice(0, 4).join("/") + (m.en ? " | " + m.en : "") + ")。这个菜单的代码是否包含该查询所需的逻辑?";
  if (tried.length) q += " 注意: 上一轮已检查 [" + tried.join("、") + "], 其中没有找到与查询相关的代码(" + notes.join("; ") + "), 请勿再判 yes。";
  return q;
}
function fileQuestion(query, rel, excerpt) {
  return "Code search query: \"" + query + "\"\n\nCandidate file: " + rel + "\n\n```\n" + excerpt + "\n```\nDoes this file contain the logic the query asks for?";
}

export async function search(query, opts) {
  opts = opts || {};
  const PROJ = path.resolve(opts.proj);
  const INDEX = loadIndex(PROJ);
  const t0 = Date.now();
  const res = { query, steps: {} };
  const allMenus = INDEX.modules.flatMap(m => m.menus);
  const byName = Object.fromEntries(allMenus.map(m => [m.name, m]));
  const tried = []; const notes = []; const roundsInfo = [];
  let bestHits = [], bestMenu = null, bestRel = -1;
  for (let round = 1; round <= MAX_ROUNDS; round++) {
    const cand = allMenus.filter(m => !tried.includes(m.name));
    if (!cand.length) { res.exhausted = true; break; }
    const batch = cand.map(m => ({ id: m.name, question: menuQuestion(query, m, tried, notes), options: ["yes", "no"] }));
    const rA = await jevServer.ask({ batch }, 180000);
    if (rA.error) throw new Error("菜单判定失败: " + rA.error);
    const signed = rA.results.map(x => ({ name: x.id, m: x.choice === 0 ? x.margin : -x.margin, yesMargin: x.choice === 0 ? x.margin : -x.margin })).sort((a, b) => b.m - a.m);
    res.steps.menuRank = signed.slice(0, 8).map(x => ({ name: x.name, margin: x.m }));
    // 条件并集: Top1 领先不足(<1)或置信不高(<8)时, 取 Top2 两个菜单的作用域并集
    const chosenMenus = (signed[1] && (signed[0].m - signed[1].m < 1 || signed[0].m < 8))
      ? [byName[signed[0].name], byName[signed[1].name]] : [byName[signed[0].name]];
    const menu = byName[signed[0].name];
    tried.push(...chosenMenus.map(x => x.name));
    res.steps.jevMenu = { choice: menu.name, margin: signed[0].m, ms: rA.ms, candidates: signed.slice(0, 4).map(x => x.name), union: chosenMenus.map(x => x.name), round };
    // ⑥ zg 作用域三路融合
    const strip = f => f.replace(/^repos\/[^/]+\//, "");
    const fes = chosenMenus.map(x => x.fe || {});
    const fe = { view: fes.map(x => x.view).find(Boolean), api: fes.flatMap(x => x.api || []), dir: fes.map(x => x.dir).find(Boolean) };
    const scopeFe = [].concat(fe.view ? [fe.view] : [], fe.api || [], fe.dir ? [fe.dir + "/**"] : []);
    const beFiles = [].concat(...chosenMenus.map(x => x.beFiles || []));
    const kwFts = menu.en || (query.match(/[a-zA-Z][a-zA-Z0-9_]{2,}/g) || [])[0] || "";
    const qArgs = ["query", "--hybrid", query, "--limit", "6"];
    if (kwFts) qArgs.push("--vector", kwFts, "--fts", kwFts, "--fuse");
    const dedupe = arr => { const seen = new Set(); return arr.filter(h => { const k = h.repo + ":" + h.file; if (seen.has(k)) return false; seen.add(k); return true; }); };
    let beHits = [], feHits = [];
    if (beFiles.length) {
      const root = rootOf(PROJ, beFiles[0]);
      const g = beFiles.flatMap(f => ["-g", strip(f)]);
      beHits = parseZg(zg(root, qArgs.concat(g))).map(h => Object.assign(h, { repo: "BE", root }));
      if (!beHits.length) beHits = parseZg(zg(root, qArgs.concat(g))).map(h => Object.assign(h, { repo: "BE", root }));
    }
    if (scopeFe.length) {
      const root = rootOf(PROJ, scopeFe[0]);
      const g = scopeFe.flatMap(f => ["-g", strip(f)]);
      feHits = parseZg(zg(root, qArgs.concat(g))).map(h => Object.assign(h, { repo: "FE", root }));
      if (!feHits.length) feHits = parseZg(zg(root, qArgs.concat(g))).map(h => Object.assign(h, { repo: "FE", root }));
    }
    let roundHits = dedupe(beHits).slice(0, 6).concat(dedupe(feHits).slice(0, 4));
    if (!beHits.length && !feHits.length) {
      res.degraded = true;
      for (const root of indexRoots(PROJ)) {
        const hits = parseZg(zg(root, ["query", "--hybrid", query, "--limit", "5"])).map(h => Object.assign(h, { repo: path.basename(root), root }));
        if (!roundHits.length) roundHits = hits; else roundHits = roundHits.concat(hits);
      }
    }
    roundHits = dedupe(roundHits);
    // ⑦ 文件 batch 判定
    const uniqFiles = roundHits.slice(0, 12);
    const fbatch = [];
    for (const h of uniqFiles) {
      let excerpt = "";
      try { excerpt = fs.readFileSync(h.root + "/" + h.file, "utf8").split(/\r?\n/).slice(0, 60).join("\n").slice(0, 3000); } catch (e) {}
      fbatch.push({ id: h.repo + ":" + h.file, question: fileQuestion(query, h.file, excerpt), options: ["relevant", "not relevant"] });
    }
    let judged = [];
    if (fbatch.length) {
      const rF = await jevServer.ask({ batch: fbatch }, 180000);
      if (rF.error) throw new Error("文件判定失败: " + rF.error);
      judged = rF.results.map(x => { const key = x.id; const rel = x.choice === 0; return { key, rel, margin: rel ? x.margin : -x.margin }; });
    }
    const relMap = new Map(judged.map(j => [j.key, j.margin]));
    roundHits.sort((a, b) => { const ma = relMap.get(a.repo + ":" + a.file) ?? -99; const mb = relMap.get(b.repo + ":" + b.file) ?? -99; return mb - ma; });
    const relevantCount = judged.filter(j => j.rel).length;
    roundsInfo.push({ round, menu: menu.name, relevantCount, files: judged.map(j => ({ file: j.key, relevant: j.rel, margin: j.margin })) });
    if (relevantCount > bestRel) { bestRel = relevantCount; bestHits = roundHits; bestMenu = menu.name; }
    if (relevantCount > 0) break;
    notes.push("「" + menu.name + "」的 " + judged.length + " 个文件均判定不相关");
  }
  res.steps.menuRetry = { rounds: roundsInfo, tried: tried.slice(), notes: notes.slice(), exhausted: !!res.exhausted, maxRounds: MAX_ROUNDS };
  res.hits = bestHits;
  res.finalMenu = bestMenu;
  res.rounds = roundsInfo.length;
  const modOf = new Map(INDEX.modules.flatMap(x => x.menus.map(m => [m.name, x.name])));
  res.steps.jevModule = { choice: modOf.get(bestMenu) || "", margin: 0, ms: 0, candidates: [] };
  res.steps.jevMenu = res.steps.jevMenu || { choice: bestMenu, margin: 0, ms: 0, candidates: [] };
  for (const h of res.hits) {
    h.absPath = (h.root || PROJ) + "/" + h.file;
    try {
      const all = fs.readFileSync(h.absPath, "utf8").split(/\r?\n/);
      const cap = Math.min(h.end, h.start + 79);
      h.code = all.slice(h.start - 1, cap).map((l2, i2) => ({ n: h.start + i2, l: l2.slice(0, 240) }));
    } catch (e) { h.code = []; }
    delete h.root; delete h.text;
  }
  res.proj = PROJ;
  res.ms = Date.now() - t0;
  return res;
}

export function warmUp(proj) {
  const roots = indexRoots(path.resolve(proj));
  if (!roots.length) return;
  zg(roots[0], ["query", "--hybrid", "config", "--limit", "1"], 30000);
}

let _chain = Promise.resolve();
export function searchQueued(query, opts) {
  const pr = _chain.then(() => search(query, opts));
  _chain = pr.catch(() => {});
  return pr;
}