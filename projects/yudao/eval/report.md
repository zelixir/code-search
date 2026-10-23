# 芋道 ruoyi-vue-pro 无LLM代码检索索引 — 构造报告

- 生成时间: 2026-10-23T16:04:35.530Z
- 项目根: D:/ai/code-search-yudao (PROJ)

## 仓库与代码量
| 仓库 | 来源 | 文件数 | 行数(源码) |
|---|---|---|---|
| ruoyi-vue-pro (后端 SpringBoot) | gitee zhijiantianya/ruoyi-vue-pro --depth 1 (master) | 7620 (.java/.xml/.sql) | 776404 |
| yudao-ui-admin-vue3 (前端 Vue3) | gitee yudaocode/yudao-ui-admin-vue3 --depth 1 (master) | 2874 (.vue/.ts/.js) | 457137 |

## 菜单来源
**a) 菜单表 INSERT SQL**: 后端 `ruoyi-vue-pro/sql/mysql/ruoyi-vue-pro.sql` 的 `system_menu` INSERT,自写元组解析器
(共解析 2544 行,位字面量 b'0'/b'1' 已适配,deleted=b0 过滤)。解析后与前端 `src/views/<component>.vue`、
后端 `controller/admin/**` 逐菜单互相印证。

## 索引规模与覆盖
- 模块 11 个: 系统管理 / 基础设施 / 工作流程 / 会员中心 / 商城系统 / 支付管理 / CRM 系统 / ERP 系统 / AI 大模型 / MP 公众号管理 / 平台机制
- 菜单共 50 个 (真实菜单 45 + 平台机制伪菜单 5),全部取自前两级目录→菜单,商城取到三级重点业务菜单
- fe.view 校验: 50/50 存在 (伪菜单无 view 记 ok)
- fe.api 校验: 真实菜单 45/45 全部有 api 文件且存在 (从 view 目录递归解析 @/api 导入得出)
- beFiles 校验: 50/50 个菜单 ≥3 个且全部 fs.existsSync 通过 (controller/serviceImpl/mapper/DO,查不到时以 service 接口/convert/VO 补位)
- aliases: 50/50 ≥4 个

## 评测基准
- queries.jsonl: 50 条,分布 a 直白 18 / b 机制 17 / c 场景间接 10 / d 跨级复合 5
- ground_truth.jsonl: 50 条,expectFiles 全部逐个 fs.existsSync 校验: 290/290 通过,每条 3~6 个,50/50 条完全合格
- 覆盖 39 个不同菜单;同一菜单多条查询问法已做区分(直白 vs 机制 vs 场景)

## zg 索引
- 后端: `zg index -t java -t xml -t sql --embedding local/potion-code-16m-v2` → 7595 文件 / 37521 实体,100% 覆盖
- 前端: `zg index -t vue -t js --embedding local/potion-code-16m-v2` → 1957 文件 / 11902 实体,100% 覆盖

## 异常与妥协
1. 前端仓库在 gitee 的 zhijiantianya 账号下返回 Unauthorize,实际公开地址是 gitee.com/yudaocode/yudao-ui-admin-vue3,已用该地址克隆。
2. 该 master 分支含大量扩展业务域(EAM/WMS/MES/OA/HRM/FMS/PMS/CMS/IM/IoT 等数百菜单),按任务要求只收录核心业务域代表菜单,未贪全。
3. 平台机制伪菜单(登录认证/Token/数据权限/多租户/全局异常)的 beFiles 来自 framework starter 文件名模式扫描,均为真实存在文件。
4. BPM 流程模型/实例由 Flowable 托管,无 Mapper/DO,以 Service/Convert/VO 真实文件补位至 ≥3。
5.个别命名差异已手工映射: 用户管理后端为 AdminUser*(非 User*)、后端日志目录 logger 与前端目录 apiAccessLog 不一致、字典 api 在 dict.data.ts/dict.type.ts。
6. 构建中间产物(菜单原始 JSON 等)在 PROJ/logs/ 下,交付物为 index/code_index.json、eval/queries.jsonl、eval/ground_truth.jsonl 及本报告。
