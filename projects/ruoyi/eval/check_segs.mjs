#!/usr/bin/env node
// 校验 ground_truth.jsonl 的 expectSegs:
//  1) start/end 在文件真实行数范围内;
//  2) start 行附近(±3 行)能检索到 symbol 名(等价 rg -F);
//  3) 整文件级段(start==1 && end==最后一个非空行)豁免 symbol 检查。
// 用法: node check_segs.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url)); // projects/ruoyi/eval
const repoRoot = path.resolve(here, '..');                  // projects/ruoyi
const gtPath = path.join(here, 'ground_truth.jsonl');

const WINDOW = 3; // ±3 行
const lastNonEmpty = lines => {
  for (let i = lines.length - 1; i >= 0; i--) if (lines[i].trim() !== '') return i + 1;
  return lines.length;
};

let totalEntries = 0, entriesWithSegs = 0;
let totalSegs = 0, passSegs = 0, symbolSegs = 0, fileLevelSegs = 0;
let totalLen = 0;
const failures = [];

const lines = fs.readFileSync(gtPath, 'utf8').split(/\r?\n/).filter(l => l.trim());
for (const line of lines) {
  const entry = JSON.parse(line);
  totalEntries++;
  const segs = entry.expectSegs || [];
  if (segs.length) entriesWithSegs++;
  for (const seg of segs) {
    totalSegs++;
    const abs = path.join(repoRoot, seg.file);
    const label = `${entry.id} ${seg.file}#${seg.symbol}[${seg.start}-${seg.end}]`;
    if (!fs.existsSync(abs)) { failures.push(label + ' -> 文件不存在'); continue; }
    const src = fs.readFileSync(abs, 'utf8').split(/\r?\n/);
    const total = src.length;
    const isFileLevel = seg.start === 1 && seg.end === lastNonEmpty(src);
    if (isFileLevel) fileLevelSegs++; else symbolSegs++;
    if (!(Number.isInteger(seg.start) && Number.isInteger(seg.end) && seg.start >= 1 && seg.end <= total && seg.start <= seg.end)) {
      failures.push(label + ` -> 行号越界(文件共 ${total} 行)`);
      continue;
    }
    totalLen += seg.end - seg.start + 1;
    if (isFileLevel) { passSegs++; continue; }
    const lo = Math.max(1, seg.start - WINDOW), hi = Math.min(total, seg.start + WINDOW);
    const windowText = src.slice(lo - 1, hi).join('\n');
    if (!windowText.includes(seg.symbol)) {
      failures.push(label + ` -> ±${WINDOW} 行内未检索到符号`);
      continue;
    }
    passSegs++;
  }
}

console.log('条目总数:', totalEntries);
console.log('含 expectSegs 条目:', entriesWithSegs);
console.log('段总数:', totalSegs, '(符号级:', symbolSegs, ', 整文件级:', fileLevelSegs + ')');
console.log('平均段长(行):', totalSegs ? (totalLen / totalSegs).toFixed(1) : 'n/a');
console.log('校验通过:', passSegs + '/' + totalSegs, '=', totalSegs ? (100 * passSegs / totalSegs).toFixed(1) + '%' : 'n/a');
if (failures.length) {
  console.log('失败明细:');
  for (const f of failures) console.log('  -', f);
  process.exit(1);
}
