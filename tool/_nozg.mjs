#!/usr/bin/env bun
// 无zg路线: ①索引作用域文件 ②jev文件batch判定取Top3 ③词法切块 ④jev段batch判定排序
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
const PY_ENV = { USERNAME: "zengjirui", USERPROFILE: "C:/Users/zengjirui", TEMP: "C:/Users/zengjirui/AppData/Local/Temp", TMP: "C:/Users/zengjirui/AppData/Local/Temp", SYSTEMROOT: "C:/Windows", SystemRoot: "C:/Windows", PATH: "C:/Windows/System32;C:/Windows;", COMPUTERNAME: "PC", PYTHONIOENCODING: "utf-8" };
const p = spawn("D:/ai/anime-text-filter/.venv/Scripts/python.exe", ["D:/ai/code-search/tool/jev_server.py"], { stdio: ["pipe", "pipe", "pipe"], env: PY_ENV });
let jbuf = ""; p.stdout.on("data", d => jbuf += d.toString());
const waitLine = ms => new Promise((res, rej) => { const t0 = Date.now(); const iv = setInterval(() => { const nl = jbuf.indexOf("\n"); if (nl >= 0) { clearInterval(iv); res(JSON.parse(jbuf.slice(0, nl))); jbuf = jbuf.slice(nl + 1); } else if (Date.now() - t0 > ms) { clearInterval(iv); rej(new Error("timeout")); } }, 100); });
await waitLine(300000);
const askBatch = async reqs => { p.stdin.write(JSON.stringify({ batch: reqs }) + "\n"); const r = await waitLine(180000); if (r.error) throw new Error(r.error); return r.results; };
const INDEX = JSON.parse(fs.readFileSync("D:/ai/code-search-repo/projects/ruoyi/index/code_index.json", "utf8"));
const allMenus = INDEX.modules.flatMap(m => m.menus);
const byName = Object.fromEntries(allMenus.map(m => [m.name, m]));
const REPO = "D:/ai/code-search-repo/projects/ruoyi/repos/";
function absOf(f) { const stripped = f.replace(/^repos\//, ""); return REPO + stripped; }
function extractChunks(absPath) {
  let text = "";
  try { text = fs.readFileSync(absPath, "utf8"); } catch (e) { return []; }
  const lines = text.split(/\r?\n/);
  const chunks = [];
  if (absPath.endsWith(".java")) {
    let start = -1, depth = 0;
    for (let i = 0; i < lines.length; i++) {
      const l = lines[i];
      if (start < 0 && /(^|\s)(public|private|protected)[\w<>\[\],\s]*\(/.test(l)) { start = i; depth = 0; }
      if (start >= 0) {
        depth += (l.match(/{/g) || []).length - (l.match(/}/g) || []).length;
        if (depth <= 0 && i >= start) { chunks.push({ start: start + 1, end: i + 1, text: lines.slice(start, i + 1).join("\n") }); start = -1; }
        if (chunks.length && chunks[chunks.length - 1].text.length > 5000) chunks[chunks.length - 1].text = chunks[chunks.length - 1].text.slice(0, 5000);
      }
    }
  }
  if (!chunks.length) for (let i = 0; i < lines.length; i += 60) chunks.push({ start: i + 1, end: Math.min(i + 60, lines.length), text: lines.slice(i, i + 60).join("\n") });
  return chunks.slice(0, 18).map(c => ({ ...c, text: c.text.slice(0, 2800) }));
}
function norm(x) { return x.replace(/\\/g, "/").toLowerCase(); }
// 探针: id, q, menu(管道v3实选), file(期望, repos/前缀), symbol, line(运行时rg)
const { execSync } = await import("node:child_process");
const NODE = "C:/Program Files/nodejs/node.exe";
const ZG = "C:/Users/zengjirui/AppData/Roaming/npm/node_modules/@zvec/zvec-grep/dist/cli/index.js";
const probes = [
  ["p01", "密码连续输错几次后锁定账号的逻辑在哪", "登录认证", "repos/RuoYi-Vue/ruoyi-framework/src/main/java/com/ruoyi/framework/web/service/SysPasswordService.java", "validate"],
  ["p02", "防止表单重复提交是怎么实现的", "防重复提交", "repos/RuoYi-Vue/ruoyi-framework/src/main/java/com/ruoyi/framework/interceptor/impl/SameUrlDataInterceptor.java", "SameUrlDataInterceptor"],
  ["p03", "列表数据怎么导出成 Excel 文件", "Excel导入导出", "repos/RuoYi-Vue/ruoyi-common/src/main/java/com/ruoyi/common/utils/poi/ExcelUtil.java", "ExcelUtil"],
  ["p04", "token 过期后怎么自动刷新", "Token机制", "repos/RuoYi-Vue/ruoyi-framework/src/main/java/com/ruoyi/framework/web/service/TokenService.java", "refreshToken"],
  ["p05", "只能看本部门和下级部门的数据,这个过滤在哪做", "数据权限", "repos/RuoYi-Vue/ruoyi-framework/src/main/java/com/ruoyi/framework/aspectj/DataScopeAspect.java", "DataScopeAspect"],
  ["p06", "定时任务的调度触发在哪里实现", "定时任务", "repos/RuoYi-Vue/ruoyi-quartz/src/main/java/com/ruoyi/quartz/util/AbstractQuartzJob.java", "AbstractQuartzJob"],
  ["p07", "操作日志是怎么自动记录下来的", "操作日志", "repos/RuoYi-Vue/ruoyi-framework/src/main/java/com/ruoyi/framework/aspectj/LogAspect.java", "LogAspect"],
  ["p08", "接口访问频率超限会被限制吗,在哪实现", "限流", "repos/RuoYi-Vue/ruoyi-framework/src/main/java/com/ruoyi/framework/aspectj/RateLimiterAspect.java", "RateLimiterAspect"],
  ["p09", "全局的异常都到哪里去了", "全局异常处理", "repos/RuoYi-Vue/ruoyi-framework/src/main/java/com/ruoyi/framework/web/exception/GlobalExceptionHandler.java", "GlobalExceptionHandler"],
  ["p10", "验证码图片是怎么生成和校验的", "登录认证", "repos/RuoYi-Vue/ruoyi-admin/src/main/java/com/ruoyi/web/controller/system/SysLoginController.java", "getCode"],
  ["p11", "文件上传存储到哪里,在哪处理", "对象存储", "repos/RuoYi-Vue/ruoyi-admin/src/main/java/com/ruoyi/web/controller/common/CommonController.java", "CommonController"],
  ["p12", "参数在数据库里配置,启动后会加载到哪里", "参数设置", "repos/RuoYi-Vue/ruoyi-system/src/main/java/com/ruoyi/system/service/impl/SysConfigServiceImpl.java", "SysConfigServiceImpl"],
].map(([id, q, menu, file, symbol]) => ({ id, q, menu, file, symbol }));
for (const pr of probes) {
  const abs = absOf(pr.file);
  const r = spawnSync(NODE, [ZG, "query", "--rg", "-n", "-e", pr.symbol, abs], { encoding: "utf8", timeout: 60000, env: PY_ENV, maxBuffer: 16*1024*1024 });
  const m = (r.stdout || "").match(/(?:\s|:)(\d+):/); pr.line = m ? +m[1] : 0;
}
let segTop5 = 0, fileTop3 = 0;
const rows = [];
for (const pr of probes) {
  const t0 = Date.now();
  const menu = byName[pr.menu];
  // ① 候选文件 = 索引作用域(与zg路线同源)
  const cands = [].concat(menu.beFiles || []);
  const fe = menu.fe || {};
  for (const f of [].concat(fe.view ? [fe.view] : [], fe.api || [], fe.dir ? [fe.dir + "/**"] : [])) {
    if (f.endsWith("/**")) {
      const base = REPO + f.replace(/^repos\//, "").slice(0, -3);
      try { for (const e of fs.readdirSync(base, { recursive: true })) { const rp = (base + "/" + e).replace(/\\/g, "/"); try { if (fs.statSync(rp).isFile()) cands.push(f.slice(0, -3) + "/" + e); } catch (e2) {} } } catch (e) {}
    } else cands.push(f);
  }
  // ② 文件 batch 判定 → Top3
  const fbatch = cands.map(f => {
    let ex = ""; try { ex = fs.readFileSync(absOf(f), "utf8").slice(0, 2800); } catch (e) {}
    return { id: f, question: "Code search query: \"" + pr.q + "\"\nCandidate file: " + f.replace(/^repos\//, "") + "\n" + ex + "\nDoes this file contain the logic the query asks for?", options: ["relevant", "not relevant"] };
  });
  const fres = await askBatch(fbatch);
  const franked = fres.map(x => ({ file: x.id, m: x.choice === 0 ? x.margin : -x.margin })).sort((a, b) => b.m - a.m).slice(0, 3);
  const topFiles = franked.map(x => x.file);
  fileTop3 += topFiles.some(f => norm(absOf(f)) === norm(absOf(pr.file))) ? 1 : 0;
  // ③ Top3 文件词法切块
  const segBatch = [];
  for (const f of topFiles) for (const c of extractChunks(absOf(f))) segBatch.push({ id: f + "#" + c.start, question: "Code search query: \"" + pr.q + "\"\nCandidate segment in " + f.replace(/^repos\//, "") + " (lines " + c.start + "-" + c.end + ")\n" + c.text + "\nDoes this segment contain the logic the query asks for?", options: ["relevant", "not relevant"], file: f, start: c.start, end: c.end });
  const cap = segBatch.slice(0, 42);
  const sres = cap.length ? await askBatch(cap) : [];
  const sranked = sres.map((x, i) => ({ ...cap[i], m: x.choice === 0 ? x.margin : -x.margin })).sort((a, b) => b.m - a.m);
  const si = sranked.findIndex(s => norm(absOf(s.file)) === norm(absOf(pr.file)) && s.start <= pr.line && pr.line <= s.end + 30);
  if (si >= 0 && si < 5) segTop5++;
  rows.push(pr.id + " [" + pr.q.slice(0, 12) + "] 菜单=" + pr.menu + " 文件Top3=" + (topFiles.some(f => norm(absOf(f)) === norm(absOf(pr.file))) ? "✓" : "✗") + " 段Top5=" + (si < 0 ? "✗" : "第" + (si + 1)) + " 段数=" + segBatch.length + " " + (Date.now() - t0) + "ms");
}
console.log(rows.join("\n"));
console.log("\n无zg路线: 文件Top3=" + fileTop3 + "/12  段Top5=" + segTop5 + "/12");
p.kill();