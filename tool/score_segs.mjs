#!/usr/bin/env bun
// 段级评分: bun tool/score_segs.mjs <PROJ> <results.jsonl>
import fs from "node:fs";
import path from "node:path";
const PROJ = path.resolve(process.argv[2]);
const RFILE = process.argv[3] || "results.jsonl";
const gt = fs.readFileSync(path.join(PROJ, "eval", "ground_truth.jsonl"), "utf8").split(/\r?\n/).filter(Boolean).map(l => JSON.parse(l));
const rows = fs.readFileSync(path.join(PROJ, "eval", RFILE), "utf8").split(/\r?\n/).filter(Boolean).map(l => JSON.parse(l));
const byId = new Map(rows.map(r => [r.id, r]));
const normPath = p => String(p || "").replace(/\\/g, "/").toLowerCase();
const strip = p => normPath(p).replace(/^repos\//, "").replace(/^[^/]+\//, "");
const fmatch = (hFile, sFile) => { const g = strip(sFile); const h = normPath(hFile); return h === g || h.endsWith("/" + g) || g.endsWith("/" + h); };
const overlap = (h, s) => h.start <= s.end && s.start <= h.end;
const hasSym = (h, sym) => (h.code || []).some(c => c.l && c.l.includes(sym)) || (h.text || "").includes(sym);
let n = 0, f5 = 0, s5 = 0, srr = 0, deg = 0, msSum = 0;
const fails = [];
for (const g of gt) {
  const r = byId.get(g.id);
  if (!r || r.error) continue;
  n++;
  const hits = (r.hits || []).map(h => Object.assign({}, h, { start: h.start, end: h.end }));
  const segs = g.expectSegs || g.expectFiles.map(f => ({ file: f, symbol: "", start: 1, end: 1e9 }));
  let segFirst = -1, fileFirst = -1;
  hits.forEach((h, i) => {
    if (fileFirst < 0 && segs.some(s => fmatch(h.file, s.file))) fileFirst = i;
    if (segFirst < 0 && segs.some(s => fmatch(h.file, s.file) && (overlap(h, s) || (s.symbol && hasSym(h, s.symbol))))) segFirst = i;
  });
  if (fileFirst >= 0 && fileFirst < 5) f5++;
  if (segFirst >= 0 && segFirst < 5) s5++;
  if (segFirst >= 0) srr += 1 / (segFirst + 1); else fails.push(g.id + " 「" + g.query.slice(0, 24) + "」 期望段: " + segs.map(s => s.symbol + "@" + s.file.split("/").pop()).join(","));
  if (r.degraded) deg++; msSum += r.ms || 0;
}
console.log("n=" + n + "  文件Hit@5=" + (100 * f5 / n).toFixed(1) + "%  段Hit@5=" + (100 * s5 / n).toFixed(1) + "%  段MRR=" + (srr / n).toFixed(3) + "  degraded=" + deg + "  avgMs=" + Math.round(msSum / n));
if (fails.length) console.log("段未命中: " + fails.join("; "));