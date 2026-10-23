#!/usr/bin/env bun
// 通用评测评分: bun tool/score_generic.mjs <PROJ> [results.jsonl 文件名, 默认 results.jsonl]
import fs from "node:fs";
import path from "node:path";
const PROJ = path.resolve(process.argv[2]);
const RFILE = process.argv[3] || "results.jsonl";
const EVAL = path.join(PROJ, "eval");
const idx = JSON.parse(fs.readFileSync(path.join(PROJ, "index", "code_index.json"), "utf8"));
const rd = f => fs.readFileSync(path.join(EVAL, f), "utf8").split(/\r?\n/).filter(Boolean).map(l => JSON.parse(l));
const gt = rd("ground_truth.jsonl");
const results = new Map(rd(RFILE).map(r => [r.id, r]));
const menuModule = new Map(idx.modules.flatMap(m => m.menus.map(x => [x.name, m.name])));
const normPath = p => String(p || "").replace(/\\/g, "/").replace(/^\.\//, "").toLowerCase();
const stripRepo = p => normPath(p).replace(/^[^/]+\//, "");
const hitMatch = (hf, files) => files.some(f => { const g = stripRepo(f); const h = normPath(hf); return h === g || h.endsWith("/" + g) || g.endsWith("/" + h); });
const pct = (a, b) => b ? (100 * a / b).toFixed(1) + "%" : "-";
const stat = a => { const s = [...a].sort((x, y) => x - y); return (avg => avg)( (a.reduce((x, y) => x + y, 0) / a.length).toFixed(0) ) + "/" + s[Math.floor(s.length / 2)] + "/" + s[Math.ceil(s.length * 0.9) - 1]; };

const rows = [];
for (const g of gt) {
  const r = results.get(g.id);
  if (!r) { rows.push({ id: g.id, query: g.query, miss: "无结果" }); continue; }
  const menuOk = r.steps?.jevMenu?.choice === g.expectMenu;
  const menu4 = menuOk || (r.steps?.jevMenu?.candidates || []).includes(g.expectMenu);
  const modOk = r.steps?.jevModule?.choice === (g.expectModule || menuModule.get(g.expectMenu));
  const hits = (r.hits || []).map(h => h.file);
  let rr = 0;
  hits.forEach((f, i) => { if (!rr && hitMatch(f, g.expectFiles)) rr = 1 / (i + 1); });
  const first = hits.findIndex(f => hitMatch(f, g.expectFiles));
  rows.push({ id: g.id, query: g.query, expectMenu: g.expectMenu, gotMenu: r.steps?.jevMenu?.choice, menuOk, menu4, modOk,
    hit5: first >= 0 && first < 5, hit10: first >= 0 && first < 10, rr, ms: r.ms || 0, degraded: !!r.degraded,
    msIE: r.steps?.extract?.ms ?? 0, msJev: (r.steps?.jevModule?.ms ?? 0) + (r.steps?.jevMenu?.ms ?? 0),
    msZg: (r.ms || 0) - (r.steps?.extract?.ms ?? 0) - ((r.steps?.jevModule?.ms ?? 0) + (r.steps?.jevMenu?.ms ?? 0)),
    firstFile: first >= 0 ? hits[first] : "-" });
}
const agg = f => rows.filter(r => r[f] !== undefined);
const n = rows.filter(r => r.menuOk !== undefined).length;
const M = f => rows.filter(r => r[f]).length;
const mrr = rows.reduce((a, r) => a + (r.rr || 0), 0) / (n || 1);
const avgMs = k => { const a = rows.map(r => r[k] || 0); return (a.reduce((x, y) => x + y, 0) / (a.length || 1)).toFixed(0); };
const md = [];
md.push("# 评测报告: " + path.basename(PROJ));
md.push("");
md.push("| 指标 | 值 |"); md.push("|---|---|");
md.push("| Module@1 | " + M("modOk") + "/" + n + " = " + pct(M("modOk"), n) + " |");
md.push("| Menu@1 | " + M("menuOk") + "/" + n + " = " + pct(M("menuOk"), n) + " |");
md.push("| Menu@4 | " + M("menu4") + "/" + n + " = " + pct(M("menu4"), n) + " |");
md.push("| Hit@5 | " + M("hit5") + "/" + n + " = " + pct(M("hit5"), n) + " |");
md.push("| Hit@10 | " + M("hit10") + "/" + n + " = " + pct(M("hit10"), n) + " |");
md.push("| MRR | " + mrr.toFixed(3) + " |");
md.push("| degraded | " + M("degraded") + "/" + n + " |");
md.push("| 端到端 ms avg/p50/p90 | " + stat(rows.map(r => r.ms || 0)) + " |");
md.push("| 信息提取 ms avg | " + avgMs("msIE") + " |");
md.push("| jev 决策 ms avg | " + avgMs("msJev") + " |");
md.push("| zg 精筛 ms avg | " + avgMs("msZg") + " |");
md.push("");
md.push("## 逐条明细"); md.push("");
md.push("| id | 查询 | 期望菜单 | 决策菜单 | Menu@1 | Hit@5 | 首命中 | ms |"); md.push("|---|---|---|---|---|---|---|---|");
for (const r of rows) md.push(`| ${r.id} | ${r.query} | ${r.expectMenu || "-"} | ${r.gotMenu || "-"} | ${r.menuOk ? "Y" : "N"} | ${r.hit5 ? "Y" : "N"} | ${String(r.firstFile || "-").slice(0, 60)} | ${r.ms || "-"} |`);
md.push("");
md.push("## 失败条目"); md.push("");
for (const r of rows.filter(r => r.menuOk !== undefined && (!r.menuOk || !r.hit5))) md.push("- " + r.id + " 「" + r.query + "」 期望=" + r.expectMenu + " 决策=" + r.gotMenu + " hit5=" + r.hit5);
fs.writeFileSync(path.join(EVAL, "eval_report.md"), md.join("\n"), "utf8");
console.log(md.slice(2, 12).join("\n"));
console.log("eval_report.md written");