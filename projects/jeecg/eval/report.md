# JeecgBoot 无LLM代码检索 · 两级索引与 50 查询构造报告

- 项目根: `D:/ai/code-search-jeecg` (下称 PROJ);报告生成时间: 2026-10-23T15:59:59.739Z
- 后端: jeecg-boot v3.9.5 (gitee --depth 1, 内含 maven 多模块)
- 前端: jeecg-boot 仓库内置的 `jeecgboot-vue3` v3.9.5 (见下「异常与妥协」第 1 条)

## 一、数据量

| 仓库 | 代码文件数 | 代码行数 |
|---|---|---|
| jeecg-boot 后端 (java/xml/sql) | 1,145 | 166,419 |
| jeecgboot-vue3 前端 (vue/ts/js) | 1,694 | 271,885 |
| 合计 | ~2,839 | ~438,304 |

## 二、菜单来源: 方式 (a) 菜单表 INSERT SQL

- 来源文件: `jeecg-boot/jeecg-boot/db/jeecgboot-mysql-5.7.sql` (6.4 MB)
- 解析: 562 条 `INSERT INTO sys_permission` 单行语句, 按列序 (id, parent_id, name, url, component, is_route, component_name, redirect, menu_type, perms, ...) 逐条 tokenize;
  menu_type 0=目录(模块)、1=菜单、2=按钮。目录→菜单两级成树, 按钮级 perms 作为 aliases 素材。
- 交叉印证: component 列 ↔ `jeecgboot-vue3/src/views/<component>.vue` 逐个 existsSync 校验; 菜单功能 ↔ 后端 Controller/Service/Entity 文件名逐个人工映射并校验。全部 43 个菜单 view 存在。

## 三、索引规模与覆盖率

- 模块 7 个 / 菜单 43 个 (`index/code_index.json`):

| 模块 | path | 菜单数 | 菜单 |
|---|---|---|---|
| 主页 | dashboard | 2 | 首页、工作台 |
| 系统管理 | system | 14 | 用户管理、角色管理、菜单管理、部门管理、数据字典、通知公告、多租户管理、分类字典、职务级别、用户组管理、白名单管理、第三方配置、通讯录、我的部门 |
| 系统监控 | monitor | 8 | 网关路由、定时任务、数据源管理、日志管理、数据日志、性能监控、Redis监控、在线用户 |
| 消息中心 | message | 2 | 消息模板、我的消息 |
| 低代码开发 | online | 5 | Online表单开发、Online报表配置、系统校验规则、系统编码规则、APP版本管理 |
| AI应用平台 | airag | 5 | AI知识库、AI模型配置、AI聊天、AI应用管理、MCP配置 |
| 平台机制 | core | 7 | 登录认证、JWT鉴权机制、多租户数据隔离、字典翻译机制、Excel导入导出、全局异常处理、文件上传 |

- fe/be 覆盖率: **view 43/43, api(≥1 个 .api.ts) 43/43, beFiles(≥3 个) 43/43, 每菜单 aliases 4~9 个**
- 索引引用路径存在性校验: **275/275 全部 PASS** (fs.existsSync 逐个)

## 四、查询与真值

- `eval/queries.jsonl`: 50 条 (a 直白/换说法 18, b 机制细节 17, c 间接/场景化 10, d 跨级复合 5)
- a 组覆盖 18 个不同菜单, b 组覆盖 12 个菜单; 全部 50 条对应 33 个不同菜单
- `eval/ground_truth.jsonl`: 50 条; expectFiles 共 224 个路径 (每条 3~6 个), **逐个 fs.existsSync 校验 50/50 行全部 PASS**
- expectModule/expectMenu 均取自索引内真实模块/菜单名

## 五、zg 索引

- 后端: `jeecg-boot/` 根: `zg index -t java -t xml -t sql --embedding local/potion-code-16m-v2` → 1152 files / 9697 entities / 16s, 成功
- 前端: `jeecg-boot/jeecgboot-vue3/` 根: `zg index -t vue -t js --embedding local/potion-code-16m-v2` → 见下方重试结果

## 六、异常与妥协

1. **官方独立前端仓库已停更**: gitee `jeecg/jeecgboot-vue3` master 停在 v3.7.0 (2024-06), 无 `super/airag`、`super/online`、`openapi` 视图, 与后端 3.9.5 菜单 SQL 不匹配。改用**后端仓库内置的 jeecgboot-vue3 v3.9.5 副本**作为前端源 (与菜单 SQL 完全同版本); 独立仓库克隆保留在 PROJ 根仅作对照, 未参与索引。因此 fe 路径以 `jeecg-boot/jeecgboot-vue3/...` 开头。
2. **Online 低代码设计器后端不在开源仓**: Online表单开发/Online报表配置 两菜单的后端 (cgform/cgreport 引擎) 为闭源/独立发布, 开源仓内仅有 CgformEnum、OnlCgformDemoController、jeecg-system-api 的 IOnlineBaseExtApi(含 cloud fallback/factory)。这两个菜单的 beFiles 按文件名模式扫描映射(伪菜单规则), 已在 note 注明。
3. **org.jeecg.common.util.RedisUtil 等类来自外部 jeecg-boot-common 依赖 jar**, 源码不在仓内; 在线用户/APP版本管理 菜单的 beFiles 改用仓内同类职责文件 (JwtUtil/oConvertUtils)。
4. 数据可视化/统计报表/我的租户 3 个模块多为外链积木报表或与系统管理重复的租户视图, 未收录 (避免伪菜单); 组件示例/导航示例为纯演示页, 未收录。
5. 首次并行跑前后端 zg 索引时前端撞到父级 home 写锁 (ZVEC_GREP.ENGINE.LOCK.BUSY), BE 完成后重试成功。
6. 本任务未运行检索评测 (禁跑 D:/ai/code-search/tool/search.mjs, 评测由 eval-builder 统一执行); 本报告仅覆盖构造与存在性校验。
