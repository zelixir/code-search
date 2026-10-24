#!/usr/bin/env bun
/**
 * jev-zg 代码检索管道 (无 LLM 生成, 决策式)
 *   NL query -> [UIE/jieba 信息提取] -> 模块短名单 -> [jev决策#1] -> 菜单短名单 -> [jev决策#2]
 *            -> 菜单作用域内 zg 混合精筛 -> 代码段
 * 用法:
 *   bun tool/search.mjs "查询" [--debug]
 *   bun tool/search.mjs --batch queries.jsonl out.jsonl   // JSONL 批量 {id, query}
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const ROOT = path.resolve(import.meta.dir, "..");
const _argv = process.argv.slice(2);
const _pi = _argv.indexOf("--project");
const PROJ = _pi >= 0 ? path.resolve(_argv[_pi + 1]) : ROOT;   // 项目根: 内含 index/code_index.json 与各仓库目录
const INDEX = JSON.parse(fs.readFileSync(path.join(PROJ, "index", "code_index.json"), "utf8"));
const PY_ENV = {
  USERNAME: "zengjirui", USERPROFILE: "C:\\Users\\zengjirui",
  APPDATA: "C:\\Users\\zengjirui\\AppData\\Roaming", LOCALAPPDATA: "C:\\Users\\zengjirui\\AppData\\Local",
  TEMP: "C:\\Users\\zengjirui\\AppData\\Local\\Temp", TMP: "C:\\Users\\zengjirui\\AppData\\Local\\Temp",
  SYSTEMROOT: "C:\\Windows", SystemRoot: "C:\\Windows", PATH: "C:\\Windows\\System32;C:\\Windows;",
  COMPUTERNAME: "PC", OS: "Windows_NT", PATHEXT: ".COM;.EXE;.BAT;.CMD", PYTHONIOENCODING: "utf-8",
};

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

import { spawnSync } from "node:child_process";
const ZG_NODE = "C:\\Program Files\\nodejs\\node.exe";
const ZG_CLI = "C:\\Users\\zengjirui\\AppData\\Roaming\\npm\\node_modules\\@zvec\\zvec-grep\\dist\\cli\\index.js";
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

import { existsSync } from "node:fs";
const _rootCache = new Map();
function indexRoots(proj) {
  if (_rootCache.has(proj)) return _rootCache.get(proj);
  const roots = [];
  (function scan(d, depth) {
    if (depth > 5) return;
    if (existsSync(path.join(d, ".zvec-grep"))) roots.push(d);
    let es; try { es = fs.readdirSync(d, { withFileTypes: true }); } catch { return; }
    for (const e of es) if (e.isDirectory() && ![".git", "node_modules", "target", "dist", ".zvec-grep"].includes(e.name)) scan(path.join(d, e.name), depth + 1);
  })(proj, 0);
  if (!roots.length) roots.push(proj);
  _rootCache.set(proj, roots);
  return roots;
}
let ieServer = null, jevServer = null;
async function search(query, opts) {
  opts = opts || {};
  const t0 = Date.now();
  const res = { query, steps: {} };
  // 1) 信息提取
  let kws = [];
  if (ieServer) {
    const ie = await ieServer.ask({ id: "1", query });
    kws = (ie.keywords || []).slice();
    for (const v of Object.values(ie.fields || {})) kws.push(...v);
    res.steps.extract = { keywords: kws.slice(), ms: ie.ms };
  }
  // 2) 模块短名单
  const mods = INDEX.modules.map(m => ({ mod: m, s: scoreModule(query, kws, m) })).sort((a, b) => b.s - a.s);
  const modCands = mods.slice(0, 3);
  res.steps.moduleScores = mods.map(x => ({ name: x.mod.name, s: +x.s.toFixed(1) }));
  // 3) jev 决策模块
  const modOpts = modCands.map(x => x.mod.name + "(" + x.mod.menus.map(mm => mm.name).join("、") + ")");
  const j1 = await jevServer.ask({ id: "m", question: "一个代码检索查询为: " + query + " 。这个查询最属于哪个业务模块?", options: modOpts });
  const chosen = modCands[Math.min(j1.choice, modCands.length - 1)];
  res.steps.jevModule = { choice: chosen.mod.name, margin: j1.margin, ms: j1.ms, candidates: modCands.map(x => x.mod.name) };
  // 4) 菜单短名单
  let menuPool = chosen.mod.menus.slice();
  const second = modCands.find(x => x.mod !== chosen.mod);
  if (second && (j1.margin < 3 || modCands[0].s < 1)) menuPool = menuPool.concat(second.mod.menus);
  // 决策#1 与打分 top1 模块不一致时, 强制并入打分 top1 模块的菜单 (防正确菜单不可达)
  const scoreTop1 = mods[0].mod;
  if (scoreTop1 !== chosen.mod) menuPool = menuPool.concat(scoreTop1.menus);
  const scored = menuPool.map(m => ({ menu: m, s: scoreMenu(query, kws, m) })).sort((a, b) => b.s - a.s);
  let menuCands = scored.slice(0, 4);
  // 短名单全零分 → 退化为索引序, 改为把选中模块全部菜单交给 jev 决策
  if (menuCands[0] && menuCands[0].s === 0) {
    const seen = new Set(menuCands.map(x => x.menu.name));
    for (const m of chosen.mod.menus) if (!seen.has(m.name)) menuCands.push({ menu: m, s: 0 });
  }
  res.steps.menuScores = scored.slice(0, 8).map(x => ({ name: x.menu.name, s: +x.s.toFixed(1) }));
  // 5) jev 决策菜单
  const menuDesc = menuCands.map(x => x.menu.name + ": " + (x.menu.aliases || []).slice(0, 5).join("/") + " | 涉及 " + (x.menu.seeds.controllers || []).slice(0, 2).join(","));
  const j2 = await jevServer.ask({ id: "g", question: "一个代码检索查询为: " + query + " 。这个查询最应该在哪个功能菜单的代码里找?", options: menuDesc });
  const menu = menuCands[Math.min(j2.choice, menuCands.length - 1)];
  res.steps.jevMenu = { choice: menu.menu.name, margin: j2.margin, ms: j2.ms, candidates: menuCands.map(x => x.menu.name) };
  // 6) 作用域 zg 精筛
    const rootOf = f => {  // 通用: 选最深 .zvec-grep 祖先作 zg 索引根 (兼容嵌套仓库)
    let best = PROJ, bestLen = -1;
    for (const r of indexRoots(PROJ)) {
      const rel = path.relative(r, path.join(PROJ, f));
      if (!rel.startsWith("..") && rel.length > bestLen) { best = r; bestLen = rel.length; }
    }
    return best;
  };
  const stripFor = (f) => path.relative(rootOf(f), path.join(PROJ, f)).replace(/\\/g, "/");
  const fe = menu.menu.fe || {};
  const scopeFe = [].concat(fe.view ? [fe.view] : [], fe.api || [], fe.dir ? [fe.dir + "/**"] : []);
  const beFiles = menu.menu.beFiles || [];
  const kwFts = menu.menu.en || (query.match(/[a-zA-Z][a-zA-Z0-9_]{2,}/g) || [])[0] || "";
  const qArgs = ["query", "--hybrid", query, "--limit", "6"];
  if (menu.menu.en) qArgs.push("--vector", menu.menu.en);
  if (kwFts) qArgs.push("--fts", kwFts);
  if (menu.menu.en || kwFts) qArgs.push("--fuse");
  let beHits = [], feHits = [];
  if (beFiles.length) {
    const g = beFiles.flatMap(f => ["-g", stripFor(f)]);
    beHits = parseZg(zg(rootOf(beFiles[0]), qArgs.concat(g))).map(h => Object.assign(h, { repo: "BE" }));
  }
  if (scopeFe.length) {
    const g = scopeFe.flatMap(f => ["-g", stripFor(f)]);
    feHits = parseZg(zg(rootOf(scopeFe[0]), qArgs.concat(g))).map(h => Object.assign(h, { repo: "FE" }));
  }
  // 7) 兜底
  if (!beHits.length && !feHits.length) {
    res.degraded = true;
    const repos = [...new Set([].concat(
      ...INDEX.modules.flatMap(mm => mm.menus.map(m => [].concat(
        m.fe && m.fe.view ? [m.fe.view.split("/")[0]] : [],
        m.fe && m.fe.api ? m.fe.api.map(a => a.split("/")[0]) : [],
        (m.beFiles || []).map(b => b.split("/")[0]))))))].filter(Boolean);
    for (const r of repos) {
      const hits = parseZg(zg(path.join(PROJ, r), ["query", "--hybrid", query, "--limit", "5"]))
        .map(h => Object.assign(h, { repo: r }));
      if (beHits.length === 0) beHits = hits; else feHits = feHits.concat(hits);
    }
  }
  const dedupe = arr => {
    const seen = new Set();
    return arr.filter(h => { const k = h.repo + ":" + h.file; if (seen.has(k)) return false; seen.add(k); return true; });
  };
  res.hits = dedupe(beHits).slice(0, 6).concat(dedupe(feHits).slice(0, 4));
  res.ms = Date.now() - t0;
  return res;
}

const argv = _argv.filter((a, i) => !(_pi >= 0 && i === _pi + 1));
const batchIdx = argv.indexOf("--batch");
if (!argv.includes("--no-ie")) ieServer = startServer("D:\\ai\\code-search\\.venv-ie\\Scripts\\python.exe", [path.join(ROOT, "tool", "ie_server.py")]);
jevServer = startServer("D:\\ai\\anime-text-filter\\.venv\\Scripts\\python.exe", [path.join(ROOT, "tool", "jev_server.py")]);
process.on("exit", () => { try { ieServer.kill(); jevServer.kill(); } catch (e) {} });
try {
  if (ieServer) console.error("[servers] ie: " + JSON.stringify(await ieServer.ready()));
  console.error("[servers] jev: " + JSON.stringify(await jevServer.ready()));
  if (batchIdx >= 0) {
    const inFile = argv[batchIdx + 1], outFile = argv[batchIdx + 2];
    const lines = fs.readFileSync(inFile, "utf8").split("\n").filter(l => l.trim());
    const out = fs.openSync(outFile, "w");
    let i = 0;
    for (const l of lines) {
      const o = JSON.parse(l);
      i++;
      console.error("[batch] " + i + "/" + lines.length + ": " + o.query);
      let result;
      try { result = await search(o.query, { debug: true }); } catch (e) { result = { query: o.query, error: String((e && e.message) || e) }; }
      result.id = o.id;
      fs.writeSync(out, JSON.stringify(result) + "\n");
    }
    fs.closeSync(out);
    console.error("[batch] done");
  } else {
    const query = argv.find(a => !a.startsWith("--"));
    const r = await search(query, { debug: argv.includes("--debug") });
    console.log(JSON.stringify(r, null, 1));
  }
} finally { ieServer.kill(); jevServer.kill(); }