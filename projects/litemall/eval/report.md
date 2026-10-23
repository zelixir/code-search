# litemall 无LLM代码检索索引 构造报告

- 日期: 2026-10-23
- 仓库: https://gitee.com/linlinjava/litemall (master, --depth 1) → `PROJ/litemall`
- PROJ: `D:/ai/code-search-litemall`

## 产物
| 产物 | 路径 | 规模 |
|---|---|---|
| 两级索引 | index/code_index.json | 9 模块 / 41 菜单 |
| 查询集 | eval/queries.jsonl | 50 条 |
| 真值集 | eval/ground_truth.jsonl | 50 条 |
| zg 索引 | litemall/.zvec-grep/ | 749 文件 / 13,898 实体 / 覆盖率 100% |

## 代码量(与 zg 索引同口径 java/xml/sql/vue/js)
- 合计 761 文件 / 190528 行
- .js: 264 文件 / 37098 行
- .vue: 114 文件 / 17096 行
- .xml: 47 文件 / 18515 行
- .java: 333 文件 / 116617 行
- .sql: 3 文件 / 1202 行

## 菜单来源
**b) 前端路由文件** `litemall-admin/src/router/index.js`(asyncRoutes 菜单树)。
路由 title 为 i18n key(app.menu.*),中文菜单名取自 `litemall-admin/src/locales/zh-Hans.js`。
与后端 30 个 Admin*Controller(@RequestMapping /admin/*)、views 57 个页面、api 24 个 js 逐一印证;
路由 meta.perms(如 `GET /admin/order/list`)与控制器注解一致。

## 索引结构
- 9 模块: 仪表盘 / 用户管理 / 商场管理 / 商品管理 / 推广管理 / 系统管理 / 配置管理 / 统计报表 / 个人中心
- 41 菜单(含 1 个平台机制伪菜单"登录认证": AdminAuthController+Shiro 三件套+Kaptcha,beFiles 实存)
- 每菜单: fe(view/dir/api 全实存) + beFiles 3~10 个(controller→adminService→db service→domain→mapper xml,
  自动从 import 提取,处理了 `db.service.*` 通配符 import 的用法反推)+ seeds + 别名≥4(最少 4,平均 5.3)
- 路径全部相对 PROJ 根、以 `litemall/` 开头,逐个 fs.existsSync 校验

## 覆盖率与校验结果
- fe 覆盖: 41/41(view/dir/api 全存在)
- be 覆盖: 41/41(beFiles 3~10 个且全部实存,共 280 个文件引用)
- 查询分布: a) 直白/换说法 18(q01-q18,覆盖 18 个不同菜单) b) 机制细节 17(q19-q35,覆盖 15 个菜单)
  c) 间接/场景化 10(q36-q45) d) 跨级复合 5(q46-q50);合计覆盖 30/41 菜单
- 真值校验: 50/50 条的 expectFiles(3~6 个/条)逐个 fs.existsSync 通过;expectMenu/expectModule 与索引一致

## 异常与妥协
1. 首次生成时路径漏拼仓库层/ extras 未并入 beFiles / AdminOrderService 使用 `import ...db.service.*` 通配符
   导致 service 提取为空,均已修复(通配符按字段用法反推类名并校验存在)。
2. litemall 菜单无 DB 菜单表(菜单静态在前端路由),故选途径 (b);perms 为 litemall 特有的 HTTP 动词串格式。
3. 仪表盘/个人中心/行政区域等菜单路由无 perms 字段,索引中 perms 记为 null,permPrefix 仍给出。
4. 团购规则/活动、专题三页、优惠券详情等 hidden 子路由页也纳入索引(真实页面+真实接口),保证菜单数与可检索性。
5. 短信/支付回调/物流等机制属于 litemall-core 或 litemall-wx-api(跨端),真值文件按最直接回答选取,
   不强行塞进菜单 beFiles;两级索引靠别名与机制菜单(登录认证)兜底路由。
6. zg 索引一次性建在仓库根(-t java -t xml -t sql -t vue -t js),749 文件 8 秒完成,无失败无截断。
