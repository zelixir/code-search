// web 服务: bun tool/webserver.mjs [--port 8642] [--conf tool/web/projects.json]
import fs from "node:fs";
import path from "node:path";
import { initServers, shutdownServers, searchQueued, loadIndex } from "./pipeline_lib.mjs";

const args = process.argv.slice(2);
const port = +(args.includes("--port") ? args[args.indexOf("--port") + 1] : 8642);
const confPath = path.resolve(args.includes("--conf") ? args[args.indexOf("--conf") + 1] : path.join(import.meta.dir, "web", "projects.json"));
const CONF = JSON.parse(fs.readFileSync(confPath, "utf8"));
const REPO_ROOT = path.resolve(path.dirname(confPath), "..", "..");  // conf 在 tool/web/ 下, 仓库根为上两级
const PROJECTS = {};
for (const [id, p] of Object.entries(CONF.projects || {})) {
  const dir = path.isAbsolute(p.dir) ? path.resolve(p.dir) : path.join(REPO_ROOT, p.dir);
  if (fs.existsSync(path.join(dir, "index", "code_index.json"))) {
    try {
      const idx = loadIndex(dir);
      PROJECTS[id] = { id, name: p.name || id, dir,
        modules: idx.modules.map(m => ({ name: m.name, menuCount: m.menus.length, menus: m.menus.map(x => x.name) })),
        menuTotal: idx.modules.reduce((a, m) => a + m.menus.length, 0) };
    } catch (e) { console.error("[conf] 跳过 " + id + ": " + e.message); }
  } else console.error("[conf] 跳过 " + id + ": 无索引");
}
console.log("[web] 项目:", Object.keys(PROJECTS).join(", "));

let serversReady = false;
async function ensureServers() {
  if (!serversReady) {
    console.log("[web] 启动 ie/jev 服务器(首次 ~15s)...");
    await initServers(m => console.log(m));
    serversReady = true;
  }
}

const HTML = fs.readFileSync(path.join(import.meta.dir, "web", "index.html"));
const server = Bun.serve({
  port,
  async fetch(req) {
    const url = new URL(req.url);
    try {
      if (url.pathname === "/" || url.pathname === "/index.html") return new Response(HTML, { headers: { "content-type": "text/html; charset=utf-8" } });
      if (url.pathname === "/api/projects") return Response.json({ projects: Object.values(PROJECTS) });
      if (url.pathname === "/api/health") return Response.json({ ok: true, servers: serversReady });
      if (url.pathname === "/api/search" && req.method === "POST") {
        const body = await req.json();
        const q = String(body.query || "").trim();
        const proj = PROJECTS[body.project];
        if (!q) return Response.json({ error: "查询为空" }, { status: 400 });
        if (!proj) return Response.json({ error: "未知项目: " + body.project }, { status: 400 });
        await ensureServers();
        const t0 = Date.now();
        const r = await searchQueued(q, { proj: proj.dir });
        console.log("[search] " + proj.id + " 「" + q + "」 " + r.ms + "ms hits=" + r.hits.length + " menu=" + r.steps.jevMenu.choice);
        return Response.json(r);
      }
      return new Response("not found", { status: 404 });
    } catch (e) {
      console.error("[web] 错误:", e);
      return Response.json({ error: String((e && e.message) || e) }, { status: 500 });
    }
  },
});
console.log("[web] listening http://127.0.0.1:" + port);
process.on("SIGINT", () => { shutdownServers(); process.exit(0); });
process.on("exit", () => shutdownServers());