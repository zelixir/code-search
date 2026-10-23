# mall 业务模块→菜单 两级索引构造报告

- 构造时间: 2026-10-23 (Asia/Shanghai)
- 项目根: D:/ai/code-search-mall (下称 PROJ)

## 仓库与代码量

| 仓库 | 来源 | commit | 文件数 | 行数 |
|---|---|---|---|---|
| mall/ (后端, SpringBoot 多模块: admin/portal/search/mbg/common/security) | gitee --depth 1 | dcaa93b | 717 | ~172,572 |
| mall-admin-web/ (前端) | gitee --depth 1 | c7b5024 | 359 | ~41,514 |

## 菜单来源

**(b) 前端路由文件**: `mall-admin-web/src/router/index.ts` 的 asyncRouterMap 单页路由树(module: pms/oms/sms/ums, 名称在 meta.title, hidden 路由也在树中)。
注意: 该仓库已重写为 **Vue3 + TypeScript + Pinia**,任务提示中的 index.js 实际为 index.ts,前端接口目录为 src/apis/*.ts(非 src/api/*.js)。
解析后与后端 `mall/mall-admin/.../controller/*Controller.java` 的 @RequestMapping 逐一交叉印证(31 个 controller 的 base mapping 全部核对),view/api/beFiles 逐个 fs.existsSync 校验通过。

## 索引规模与覆盖

- **模块 6 个**: 商品管理(pms)/订单管理(oms)/营销管理(sms)/权限管理(ums)/首页(home)/平台机制(platform)
- **菜单 34 个**: pms=6, oms=7, sms=10, ums=6, home=1, platform=4(≥25 达标;部分按钮级/隐藏路由如 添加商品、订单详情、订单发货、秒杀场次、秒杀商品、退货详情、优惠券领取详情、角色权限分配、资源分类 提升为菜单)
- **fe 覆盖 32/34**(动态权限校验、全局异常为纯后端伪菜单 fe.view=null);**be 覆盖 33/34**(仅"首页"为纯前端静态页,beFiles=[])
- 唯一被引用文件 250 个,全部存在;每菜单 aliases ≥6 条
- perms 字段: mall 无 RuoYi 式 perms 串,采用其权限模型的 **URL 资源模式**(如 /product/**),permPrefix 按模块自拟(pms:product 风格)
- 伪菜单 4 个(platform 模块, virtual:true): 登录认证/动态权限校验/全局异常与统一返回/文件上传,beFiles 由文件名模式扫描得出(JWT、DynamicSecurity*、GlobalExceptionHandler、Oss/Minio 等,位于 mall-security 与 mall-common 模块)

## 基准查询 (eval/queries.jsonl + ground_truth.jsonl, 50 条)

- 分布: a 直白/换说法 18 条(覆盖 18 个菜单) | b 机制细节 17 条 | c 间接/场景化 10 条 | d 跨级复合 5 条
- expectFiles 3~6 条/查询,50×全部 fs.existsSync 校验通过;expectMenu/expectModule 与索引逐条比对全部命中(覆盖 33 个菜单)

## zg 索引 (各仓库根目录, 默认 env)

- mall: `zg index -t java -t xml -t sql --embedding local/potion-code-16m-v2` → 564/564 files, entities 15,605
- mall-admin-web: `zg index -t vue -t js --embedding local/potion-code-16m-v2` → 147/147 files, entities 1,711

## 异常与妥协

1. 前端仓库已重构为 TS(`src/apis/*.ts`),zg 按任务指定 `-t js` 建索引(未加 -t ts,.ts 文件不入索引),已如实按指定命令执行。
2. 收货地址库(OmsCompanyAddressController)前端无独立菜单,归入订单详情/退货详情的 fe.api。
3. CmsPrefrenceArea/CmsSubject/UmsMemberLevel 3 个 controller 仅被商品详情弹窗引用,未提升为菜单。
4. "首页"菜单后端为空(home/index.vue 为静态 echarts 演示页)。
5. 克隆全程 gitee 直连成功,未走代理。
