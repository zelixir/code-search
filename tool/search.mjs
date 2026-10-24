#!/usr/bin/env bun
// CLI: bun tool/search.mjs --project <PROJ> "查询" [--debug] | --batch q.jsonl out.jsonl
import { initServers, shutdownServers, search } from "./pipeline_lib.mjs";
import fs from "node:fs";
import path from "node:path";
const argv = process.argv.slice(2);
const pi = argv.indexOf("--project");
const PROJ = pi >= 0 ? path.resolve(argv[pi + 1]) : path.resolve(import.meta.dir, "..");
const clean = argv.filter((a, i) => !(pi >= 0 && i === pi + 1));
const batchIdx = clean.indexOf("--batch");
console.error("[cli] PROJ=" + PROJ);
await initServers(m => console.error(m), { ie: false });
process.on("exit", () => shutdownServers());
try {
  if (batchIdx >= 0) {
    const inFile = clean[batchIdx + 1], outFile = clean[batchIdx + 2];
    const rows = fs.readFileSync(inFile, "utf8").split(/\r?\n/).filter(Boolean).map(l => JSON.parse(l));
    const out = fs.openSync(outFile, "w");
    let i = 0;
    for (const o of rows) {
      i++; console.error("[batch] " + i + "/" + rows.length + ": " + o.query);
      let r; try { r = await search(o.query, { proj: PROJ }); } catch (e) { r = { query: o.query, error: String(e.message || e) }; }
      r.id = o.id;
      fs.writeSync(out, JSON.stringify(r) + "\n");
    }
    fs.closeSync(out);
  } else {
    const query = clean.find(a => !a.startsWith("--"));
    const r = await search(query, { proj: PROJ });
    console.log(JSON.stringify(r, null, 1));
  }
} finally { shutdownServers(); }