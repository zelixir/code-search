# 无LLM代码检索管道 · 50 查询评测报告

- 数据: eval/queries.jsonl(50 条) / 真值: eval/ground_truth.jsonl / 结果: eval/results.jsonl
- 索引: index/code_index.json(4 模块 / 33 菜单);报告生成时间: 2026-10-23T15:46:03.983Z
- 真值 expectFiles 存在性复核: 50 条全部存在 PASS

## 一、总体指标

| 指标 | 值 |
|---|---|
| Module@1 | 47/50 = 94.0% |
| Menu@1 | 46/50 = 92.0% |
| Menu@4 | 46/50 = 92.0% |
| Hit@5 | 45/50 = 90.0% |
| Hit@10 | 46/50 = 92.0% |
| MRR | 0.7287 |
| degraded 比例 | 0/50 = 0.0% |
| 耗时 ms avg / median / p90 | 3022 / 3516 / 3636 |

## 二、分组指标

| 分组 | 条数 | Module@1 | Menu@1 | Menu@4 | Hit@5 | Hit@10 | MRR | degraded | ms(avg/med/p90) |
|---|---|---|---|---|---|---|---|---|---|
| 总体 | 50 | 94.0% | 92.0% | 92.0% | 90.0% | 92.0% | 0.729 | 0.0% | 3022/3516/3636 |
| a 直白/换说法菜单功能 | 18 | 94.4% | 88.9% | 88.9% | 83.3% | 88.9% | 0.613 | 0.0% | 3560/3581/3745 |
| b 机制细节 | 17 | 100.0% | 100.0% | 100.0% | 100.0% | 100.0% | 0.931 | 0.0% | 2317/2158/3520 |
| c 间接/同义/场景化 | 10 | 90.0% | 80.0% | 80.0% | 80.0% | 80.0% | 0.587 | 0.0% | 3277/3555/3589 |
| d 跨级/复合 | 5 | 80.0% | 100.0% | 100.0% | 100.0% | 100.0% | 0.740 | 0.0% | 2971/3442/3540 |

## 三、逐条明细

| id | 查询 | 期望菜单 | 决策菜单 | Menu@1 | Menu@4 | Hit@5 | 首命中文件(排名) | ms | degraded |
|---|---|---|---|---|---|---|---|---|---|
| q01 | 后台新增用户账号的功能在哪里实现的 | 用户管理 | 用户管理 | ✓ | ✓ | ✓ | ruoyi-common/src/main/java/com/ruoyi/common/core/domain/entity/SysUser.java(1) | 4370 |  |
| q02 | 用户列表按条件筛选和批量删除的前端代码在哪 | 用户管理 | 用户管理 | ✓ | ✓ | ✓ | ruoyi-system/src/main/java/com/ruoyi/system/service/ISysUserService.java(1) | 3658 |  |
| q03 | 想看看某个角色都勾了哪些菜单权限,在哪里改 | 角色管理 | 角色管理 | ✓ | ✓ | ✓ | ruoyi-common/src/main/java/com/ruoyi/common/core/domain/entity/SysRole.java(1) | 3615 |  |
| q04 | 左侧导航栏的菜单项在哪里配置和维护 | 菜单管理 | 菜单管理 | ✓ | ✓ | ✓ | ruoyi-common/src/main/java/com/ruoyi/common/core/domain/entity/SysMenu.java(2) | 3581 |  |
| q05 | 公司组织架构的树形结构在哪里维护 | 部门管理 | 部门管理 | ✓ | ✓ | ✓ | ruoyi-admin/src/main/java/com/ruoyi/web/controller/system/SysDeptController.java(2) | 3628 |  |
| q06 | 人事招聘岗位信息在哪个页面维护 | 岗位管理 | 岗位管理 | ✓ | ✓ | ✓ | ruoyi-admin/src/main/java/com/ruoyi/web/controller/system/SysPostController.java(2) | 3497 |  |
| q07 | 性别、账户状态这些下拉选项的取值在哪里维护 | 字典管理 | 用户管理 | ✗ | ✗ | ✗ | - | 3516 |  |
| q08 | 系统初始密码这类全局参数在哪里配置 | 参数设置 | 参数设置 | ✓ | ✓ | ✓ | ruoyi-admin/src/main/java/com/ruoyi/web/controller/system/SysConfigController.java(5) | 3745 |  |
| q09 | 管理员在后台发布系统公告的功能在哪 | 通知公告 | 通知公告 | ✓ | ✓ | ✓ | ruoyi-system/src/main/java/com/ruoyi/system/domain/SysNotice.java(2) | 3466 |  |
| q10 | 想查谁在什么时间登录过系统,在哪里看 | 登录日志 | 登录日志 | ✓ | ✓ | ✓ | ruoyi-admin/src/main/java/com/ruoyi/web/controller/monitor/SysLogininforController.java(3) | 3569 |  |
| q11 | 管理员要把某个正在在线的账号强制退出,这个功能在哪 | 在线用户 | 用户管理 | ✗ | ✗ | ✗ | - | 3728 |  |
| q12 | 每天凌晨自动清理过期数据的定时任务在哪里配置 | 定时任务 | 定时任务 | ✓ | ✓ | ✓ | ruoyi-quartz/src/main/java/com/ruoyi/quartz/controller/SysJobController.java(1) | 3579 |  |
| q13 | quartz 任务暂停、恢复和立即执行一次在哪里操作 | 定时任务 | 定时任务 | ✓ | ✓ | ✓ | ruoyi-quartz/src/main/java/com/ruoyi/quartz/controller/SysJobController.java(3) | 3579 |  |
| q14 | 数据库连接池 druid 的运行状态在哪里查看 | 数据监控 | 数据监控 | ✓ | ✓ | ✓ | src/views/monitor/druid/index.vue(1) | 2068 |  |
| q15 | 服务器 CPU 和内存的使用情况在哪里监控 | 服务监控 | 服务监控 | ✓ | ✓ | ✓ | ruoyi-framework/src/main/java/com/ruoyi/framework/web/domain/Server.java(1) | 3617 |  |
| q16 | redis 缓存的使用情况在哪里监控展示 | 缓存监控 | 缓存监控 | ✓ | ✓ | ✓ | ruoyi-common/src/main/java/com/ruoyi/common/constant/CacheConstants.java(1) | 3636 |  |
| q17 | 某个缓存名称下键值对的详细内容在哪里查看 | 缓存列表 | 缓存列表 | ✓ | ✓ | ✓ | ruoyi-admin/src/main/java/com/ruoyi/web/controller/monitor/CacheController.java(1) | 3683 |  |
| q18 | 根据数据库表自动生成增删改查代码的功能在哪 | 代码生成 | 代码生成 | ✓ | ✓ | ✗ | ruoyi-generator/src/main/java/com/ruoyi/generator/controller/GenController.java(6) | 3552 |  |
| q19 | 密码连续输错几次账号被锁定的逻辑在哪 | 登录认证 | 登录认证 | ✓ | ✓ | ✓ | ruoyi-framework/src/main/java/com/ruoyi/framework/config/SecurityConfig.java(3) | 3562 |  |
| q20 | 登录时图形验证码的生成和校验流程在哪 | 登录认证 | 登录认证 | ✓ | ✓ | ✓ | ruoyi-framework/src/main/java/com/ruoyi/framework/config/SecurityConfig.java(1) | 3520 |  |
| q21 | token 快过期时是怎么自动续期的 | Token机制 | Token机制 | ✓ | ✓ | ✓ | ruoyi-framework/src/main/java/com/ruoyi/framework/web/service/TokenService.java(1) | 2173 |  |
| q22 | 前端请求头里的 token 在后端怎么解析出当前用户 | Token机制 | Token机制 | ✓ | ✓ | ✓ | ruoyi-framework/src/main/java/com/ruoyi/framework/web/service/TokenService.java(1) | 2220 |  |
| q23 | hasPermi 权限注解在哪里解析和判断 | 权限校验 | 权限校验 | ✓ | ✓ | ✓ | ruoyi-framework/src/main/java/com/ruoyi/framework/web/service/PermissionService.java(1) | 2158 |  |
| q24 | 只能查看本部门及下级部门数据,数据范围的过滤在哪实现 | 数据权限 | 数据权限 | ✓ | ✓ | ✓ | ruoyi-framework/src/main/java/com/ruoyi/framework/aspectj/DataScopeAspect.java(1) | 2166 |  |
| q25 | 防止表单重复提交是怎么实现的 | 防重复提交 | 防重复提交 | ✓ | ✓ | ✓ | ruoyi-common/src/main/java/com/ruoyi/common/annotation/RepeatSubmit.java(1) | 2134 |  |
| q26 | @Log 注解记录操作日志的切面逻辑在哪 | 操作日志切面 | 操作日志切面 | ✓ | ✓ | ✓ | ruoyi-framework/src/main/java/com/ruoyi/framework/aspectj/LogAspect.java(1) | 2099 |  |
| q27 | 列表数据导出成 Excel 文件的实现在哪 | Excel导入导出 | Excel导入导出 | ✓ | ✓ | ✓ | ruoyi-common/src/main/java/com/ruoyi/common/utils/poi/ExcelUtil.java(1) | 2063 |  |
| q28 | 导入 Excel 的数据解析和字段校验在哪 | Excel导入导出 | Excel导入导出 | ✓ | ✓ | ✓ | ruoyi-common/src/main/java/com/ruoyi/common/utils/poi/ExcelUtil.java(1) | 2214 |  |
| q29 | 接口限流注解怎么用,底层限流逻辑在哪 | 限流 | 限流 | ✓ | ✓ | ✓ | ruoyi-common/src/main/java/com/ruoyi/common/annotation/RateLimiter.java(1) | 2231 |  |
| q30 | pageNum 和 pageSize 是怎么传给 PageHelper 的 | 分页 | 分页 | ✓ | ✓ | ✓ | ruoyi-common/src/main/java/com/ruoyi/common/utils/PageUtils.java(1) | 2173 |  |
| q31 | 接口抛异常后统一返回错误提示的处理器在哪 | 全局异常处理 | 全局异常处理 | ✓ | ✓ | ✓ | ruoyi-framework/src/main/java/com/ruoyi/framework/web/exception/GlobalExceptionHandler.java(1) | 2122 |  |
| q32 | 防止提交内容里夹带脚本攻击的过滤器在哪 | XSS过滤 | XSS过滤 | ✓ | ✓ | ✓ | ruoyi-common/src/main/java/com/ruoyi/common/utils/html/EscapeUtil.java(1) | 2142 |  |
| q33 | 错误提示的多语言文案从哪里加载 | 国际化 | 国际化 | ✓ | ✓ | ✓ | ruoyi-framework/src/main/java/com/ruoyi/framework/config/I18nConfig.java(1) | 2141 |  |
| q34 | 文件上传接口在哪,上传的文件怎么落盘的 | 对象存储 | 对象存储 | ✓ | ✓ | ✓ | ruoyi-common/src/main/java/com/ruoyi/common/utils/file/FileUploadUtils.java(1) | 2137 |  |
| q35 | 返回给前端的分页结果 total 总数在哪里组装 | 分页 | 分页 | ✓ | ✓ | ✓ | ruoyi-common/src/main/java/com/ruoyi/common/utils/PageUtils.java(2) | 2128 |  |
| q36 | 员工离职后要停用他的账号,该在哪里操作 | 用户管理 | 用户管理 | ✓ | ✓ | ✓ | ruoyi-common/src/main/java/com/ruoyi/common/core/domain/entity/SysUser.java(1) | 3563 |  |
| q37 | 想让某个方法每天凌晨两点自动执行,该怎么配 | 定时任务 | 定时任务 | ✓ | ✓ | ✓ | ruoyi-quartz/src/main/java/com/ruoyi/quartz/controller/SysJobController.java(3) | 3593 |  |
| q38 | 接口被人疯狂刷,怎么给它加上请求频率限制 | 限流 | 限流 | ✓ | ✓ | ✓ | ruoyi-framework/src/main/java/com/ruoyi/framework/aspectj/RateLimiterAspect.java(1) | 2173 |  |
| q39 | 登录页输入的图形码是在哪里校验的 | 登录认证 | 登录认证 | ✓ | ✓ | ✓ | ruoyi-framework/src/main/java/com/ruoyi/framework/web/service/SysLoginService.java(3) | 3502 |  |
| q40 | 怀疑账号被盗,想看看这个人是否在线并把他踢下线 | 在线用户 | 用户管理 | ✗ | ✗ | ✗ | - | 3578 |  |
| q41 | 分公司账号只能查到自己公司的数据,怎么按部门隔离 | 数据权限 | 数据权限 | ✓ | ✓ | ✓ | ruoyi-framework/src/main/java/com/ruoyi/framework/aspectj/DataScopeAspect.java(1) | 2112 |  |
| q42 | 出了问题想追溯是谁改的数据,在哪里能看到每次操作记录 | 操作日志 | 操作日志 | ✓ | ✓ | ✓ | ruoyi-admin/src/main/java/com/ruoyi/web/controller/monitor/SysOperlogController.java(1) | 3537 |  |
| q43 | 下拉框里正常停用这些状态文字想改,在哪里维护 | 字典管理 | 菜单管理 | ✗ | ✗ | ✗ | - | 3564 |  |
| q44 | 要给所有用户发一条系统通知,在哪个页面发 | 通知公告 | 通知公告 | ✓ | ✓ | ✓ | ruoyi-admin/src/main/java/com/ruoyi/web/controller/system/SysNoticeController.java(1) | 3589 |  |
| q45 | 新加了一张表,不想手写增删改查,怎么快速生成代码 | 代码生成 | 代码生成 | ✓ | ✓ | ✓ | ruoyi-generator/src/main/java/com/ruoyi/generator/controller/GenController.java(5) | 3555 |  |
| q46 | 新增用户的同时给他分配角色,这套流程的代码在哪 | 用户管理 | 用户管理 | ✓ | ✓ | ✓ | ruoyi-admin/src/main/java/com/ruoyi/web/controller/system/SysUserController.java(5) | 3521 |  |
| q47 | 给保存接口同时加上防重复提交和数据权限控制,该怎么做 | 防重复提交 | 防重复提交 | ✓ | ✓ | ✓ | ruoyi-common/src/main/java/com/ruoyi/common/annotation/RepeatSubmit.java(1) | 2224 |  |
| q48 | 列表既要分页又要能导出 Excel,前后端怎么配合 | 分页 | 分页 | ✓ | ✓ | ✓ | ruoyi-common/src/main/java/com/ruoyi/common/core/page/TableSupport.java(1) | 2128 |  |
| q49 | 登录成功后生成 token 并记录登录日志,这个流程在哪 | 登录认证 | 登录认证 | ✓ | ✓ | ✓ | ruoyi-admin/src/main/java/com/ruoyi/web/controller/system/SysLoginController.java(1) | 3442 |  |
| q50 | 定时任务执行失败要有异常处理和执行日志,在哪看 | 定时任务 | 定时任务 | ✓ | ✓ | ✓ | ruoyi-quartz/src/main/java/com/ruoyi/quartz/controller/SysJobController.java(2) | 3540 |  |

## 四、失败案例逐条分析

### q07「性别、账户状态这些下拉选项的取值在哪里维护」

- 期望: 系统管理 / 字典管理;决策: 系统管理 / 用户管理;Module@1=✓ Menu@1=✗ Menu@4=✗ Hit@5=✗ Hit@10=✗ MRR=0.00 hits=10
- extract 关键词: 取值、性别、选项、账户、维护、状态、这些
- moduleScores top3: 系统管理=0, 系统监控=0, 系统工具=0;menuScores top6: 用户管理=0, 角色管理=0, 菜单管理=0, 部门管理=0, 岗位管理=0, 字典管理=0
- 归因: 【菜单短名单环节】期望菜单出现在 menuScores 但未进前4候选(用户管理/角色管理/菜单管理/部门管理),菜单打分不足或被同模块高分菜单挤出。

### q11「管理员要把某个正在在线的账号强制退出,这个功能在哪」

- 期望: 系统监控 / 在线用户;决策: 系统管理 / 用户管理;Module@1=✗ Menu@1=✗ Menu@4=✗ Hit@5=✗ Hit@10=✗ MRR=0.00 hits=10
- extract 关键词: 管理员、账号、在线、强制、某个、退出、功能、正在
- moduleScores top3: 系统监控=10, 系统管理=5.2, 系统工具=0;menuScores top6: 用户管理=4, 角色管理=0, 菜单管理=0, 部门管理=0, 岗位管理=0, 字典管理=0
- 归因: 【模块短名单/决策#1环节】jev决策#1 选了 [系统管理](期望 [系统监控]); moduleScores=系统监控=10, 系统管理=5.2, 系统工具=0。若期望模块打分不在短名单前列,是关键词提取/模块打分环节未命中;若在短名单内,是 jev 决策#1 选择错误。

### q18「根据数据库表自动生成增删改查代码的功能在哪」

- 期望: 系统工具 / 代码生成;决策: 系统工具 / 代码生成;Module@1=✓ Menu@1=✓ Menu@4=✓ Hit@5=✗ Hit@10=✓ MRR=0.17 hits=10
- extract 关键词: 改查、增删、数据库、生成、自动、功能、根据、增删改查代码
- moduleScores top3: 系统工具=6.8, 系统管理=0, 系统监控=0;menuScores top6: 代码生成=6, 表单构建=0, 系统接口=0
- 归因: 【作用域检索环节】菜单正确但 zg 混合检索排序未把核心文件排进前5; top=ruoyi-generator/src/main/java/com/ruoyi/generator/service/IGenTableService.java | ruoyi-generator/src/main/java/com/ruoyi/generator/domain/GenTable.java | ruoyi-generator/src/main/java/com/ruoyi/generator/domain/GenTableColumn.java

### q40「怀疑账号被盗,想看看这个人是否在线并把他踢下线」

- 期望: 系统监控 / 在线用户;决策: 系统管理 / 用户管理;Module@1=✗ Menu@1=✗ Menu@4=✗ Hit@5=✗ Hit@10=✗ MRR=0.00 hits=10
- extract 关键词: 下线、账号、被盗、在线、怀疑、看看、是否
- moduleScores top3: 系统监控=10, 系统管理=5.2, 系统工具=0;menuScores top6: 用户管理=4, 角色管理=0, 菜单管理=0, 部门管理=0, 岗位管理=0, 字典管理=0
- 归因: 【模块短名单/决策#1环节】jev决策#1 选了 [系统管理](期望 [系统监控]); moduleScores=系统监控=10, 系统管理=5.2, 系统工具=0。若期望模块打分不在短名单前列,是关键词提取/模块打分环节未命中;若在短名单内,是 jev 决策#1 选择错误。

### q43「下拉框里正常停用这些状态文字想改,在哪里维护」

- 期望: 系统管理 / 字典管理;决策: 系统管理 / 菜单管理;Module@1=✓ Menu@1=✗ Menu@4=✗ Hit@5=✗ Hit@10=✗ MRR=0.00 hits=10
- extract 关键词: 下拉框、想改、停用、文字、维护、状态、正常、这些
- moduleScores top3: 系统管理=0, 系统监控=0, 系统工具=0;menuScores top6: 用户管理=0, 角色管理=0, 菜单管理=0, 部门管理=0, 岗位管理=0, 字典管理=0
- 归因: 【菜单短名单环节】期望菜单出现在 menuScores 但未进前4候选(用户管理/角色管理/菜单管理/部门管理),菜单打分不足或被同模块高分菜单挤出。

### q49「登录成功后生成 token 并记录登录日志,这个流程在哪」

- 期望: 平台机制 / 登录认证;决策: 系统管理 / 登录认证;Module@1=✗ Menu@1=✓ Menu@4=✓ Hit@5=✓ Hit@10=✓ MRR=1.00 hits=10
- extract 关键词: token、登录日志、登录、生成、记录、成功
- moduleScores top3: 系统管理=17.2, 平台机制=10.8, 系统工具=6.8;menuScores top6: 登录日志=19, Token机制=8.5, 登录认证=6, 操作日志=2.5, 操作日志切面=2.5, 用户管理=0
- 归因: 【模块短名单/决策#1环节】jev决策#1 选了 [系统管理](期望 [平台机制]); moduleScores=系统管理=17.2, 平台机制=10.8, 系统工具=6.8。若期望模块打分不在短名单前列,是关键词提取/模块打分环节未命中;若在短名单内,是 jev 决策#1 选择错误。

## 五、备注

- Hit@k 判定: hit.file 与 expectFiles 做后缀匹配(归一化大小写与路径分隔符,忽略 RuoYi-Vue/RuoYi-Vue3 仓库前缀)。
- Menu@4 判定: expectMenu 属于 jevMenu.candidates(缺 candidates 时回退 menuScores 前4)。
- ms p90 取排序后第 ceil(0.9n) 个值。
- 失败归因为规则自动判定,按 提取→短名单→决策→作用域 四个环节定位。
