# 评测报告: ruoyi

| 指标 | 值 |
|---|---|
| Module@1 | 47/50 = 94.0% |
| Menu@1 | 50/50 = 100.0% |
| Menu@4 | 50/50 = 100.0% |
| Hit@5 | 50/50 = 100.0% |
| Hit@10 | 50/50 = 100.0% |
| MRR | 0.863 |
| degraded | 0/50 |
| 端到端 ms avg/p50/p90 | 1369/1503/1570 |
| 信息提取 ms avg | 368 |
| jev 决策 ms avg | 143 |
| zg 精筛 ms avg | 857 |

## 逐条明细

| id | 查询 | 期望菜单 | 决策菜单 | Menu@1 | Hit@5 | 首命中 | ms |
|---|---|---|---|---|---|---|---|
| q01 | 后台新增用户账号的功能在哪里实现的 | 用户管理 | 用户管理 | Y | Y | ruoyi-admin/src/main/java/com/ruoyi/web/controller/system/Sy | 2095 |
| q02 | 用户列表按条件筛选和批量删除的前端代码在哪 | 用户管理 | 用户管理 | Y | Y | ruoyi-system/src/main/java/com/ruoyi/system/service/ISysUser | 1532 |
| q03 | 想看看某个角色都勾了哪些菜单权限,在哪里改 | 角色管理 | 角色管理 | Y | Y | ruoyi-admin/src/main/java/com/ruoyi/web/controller/system/Sy | 1534 |
| q04 | 左侧导航栏的菜单项在哪里配置和维护 | 菜单管理 | 菜单管理 | Y | Y | ruoyi-common/src/main/java/com/ruoyi/common/core/domain/enti | 1570 |
| q05 | 公司组织架构的树形结构在哪里维护 | 部门管理 | 部门管理 | Y | Y | ruoyi-admin/src/main/java/com/ruoyi/web/controller/system/Sy | 1552 |
| q06 | 人事招聘岗位信息在哪个页面维护 | 岗位管理 | 岗位管理 | Y | Y | ruoyi-admin/src/main/java/com/ruoyi/web/controller/system/Sy | 1536 |
| q07 | 性别、账户状态这些下拉选项的取值在哪里维护 | 字典管理 | 字典管理 | Y | Y | ruoyi-common/src/main/java/com/ruoyi/common/core/domain/enti | 1530 |
| q08 | 系统初始密码这类全局参数在哪里配置 | 参数设置 | 参数设置 | Y | Y | ruoyi-admin/src/main/java/com/ruoyi/web/controller/system/Sy | 1525 |
| q09 | 管理员在后台发布系统公告的功能在哪 | 通知公告 | 通知公告 | Y | Y | ruoyi-admin/src/main/java/com/ruoyi/web/controller/system/Sy | 1517 |
| q10 | 想查谁在什么时间登录过系统,在哪里看 | 登录日志 | 登录日志 | Y | Y | ruoyi-admin/src/main/java/com/ruoyi/web/controller/monitor/S | 1510 |
| q11 | 管理员要把某个正在在线的账号强制退出,这个功能在哪 | 在线用户 | 在线用户 | Y | Y | ruoyi-admin/src/main/java/com/ruoyi/web/controller/monitor/S | 1549 |
| q12 | 每天凌晨自动清理过期数据的定时任务在哪里配置 | 定时任务 | 定时任务 | Y | Y | ruoyi-quartz/src/main/java/com/ruoyi/quartz/controller/SysJo | 1497 |
| q13 | quartz 任务暂停、恢复和立即执行一次在哪里操作 | 定时任务 | 定时任务 | Y | Y | ruoyi-quartz/src/main/java/com/ruoyi/quartz/util/AbstractQua | 1576 |
| q14 | 数据库连接池 druid 的运行状态在哪里查看 | 数据监控 | 数据监控 | Y | Y | src/views/monitor/druid/index.vue | 1116 |
| q15 | 服务器 CPU 和内存的使用情况在哪里监控 | 服务监控 | 服务监控 | Y | Y | ruoyi-framework/src/main/java/com/ruoyi/framework/web/domain | 1590 |
| q16 | redis 缓存的使用情况在哪里监控展示 | 缓存监控 | 缓存监控 | Y | Y | ruoyi-admin/src/main/java/com/ruoyi/web/controller/monitor/C | 1598 |
| q17 | 某个缓存名称下键值对的详细内容在哪里查看 | 缓存列表 | 缓存列表 | Y | Y | ruoyi-admin/src/main/java/com/ruoyi/web/controller/monitor/C | 1525 |
| q18 | 根据数据库表自动生成增删改查代码的功能在哪 | 代码生成 | 代码生成 | Y | Y | ruoyi-generator/src/main/java/com/ruoyi/generator/controller | 1595 |
| q19 | 密码连续输错几次账号被锁定的逻辑在哪 | 登录认证 | 登录认证 | Y | Y | ruoyi-framework/src/main/java/com/ruoyi/framework/web/servic | 1537 |
| q20 | 登录时图形验证码的生成和校验流程在哪 | 登录认证 | 登录认证 | Y | Y | ruoyi-framework/src/main/java/com/ruoyi/framework/web/servic | 1507 |
| q21 | token 快过期时是怎么自动续期的 | Token机制 | Token机制 | Y | Y | ruoyi-framework/src/main/java/com/ruoyi/framework/web/servic | 1109 |
| q22 | 前端请求头里的 token 在后端怎么解析出当前用户 | Token机制 | Token机制 | Y | Y | ruoyi-framework/src/main/java/com/ruoyi/framework/web/servic | 1128 |
| q23 | hasPermi 权限注解在哪里解析和判断 | 权限校验 | 权限校验 | Y | Y | ruoyi-framework/src/main/java/com/ruoyi/framework/web/servic | 1126 |
| q24 | 只能查看本部门及下级部门数据,数据范围的过滤在哪实现 | 数据权限 | 数据权限 | Y | Y | ruoyi-framework/src/main/java/com/ruoyi/framework/aspectj/Da | 1104 |
| q25 | 防止表单重复提交是怎么实现的 | 防重复提交 | 防重复提交 | Y | Y | ruoyi-framework/src/main/java/com/ruoyi/framework/intercepto | 1083 |
| q26 | @Log 注解记录操作日志的切面逻辑在哪 | 操作日志切面 | 操作日志切面 | Y | Y | ruoyi-framework/src/main/java/com/ruoyi/framework/aspectj/Lo | 1126 |
| q27 | 列表数据导出成 Excel 文件的实现在哪 | Excel导入导出 | Excel导入导出 | Y | Y | ruoyi-common/src/main/java/com/ruoyi/common/utils/poi/ExcelU | 986 |
| q28 | 导入 Excel 的数据解析和字段校验在哪 | Excel导入导出 | Excel导入导出 | Y | Y | ruoyi-common/src/main/java/com/ruoyi/common/utils/poi/ExcelU | 1098 |
| q29 | 接口限流注解怎么用,底层限流逻辑在哪 | 限流 | 限流 | Y | Y | ruoyi-common/src/main/java/com/ruoyi/common/annotation/RateL | 1075 |
| q30 | pageNum 和 pageSize 是怎么传给 PageHelper 的 | 分页 | 分页 | Y | Y | ruoyi-common/src/main/java/com/ruoyi/common/utils/PageUtils. | 1078 |
| q31 | 接口抛异常后统一返回错误提示的处理器在哪 | 全局异常处理 | 全局异常处理 | Y | Y | ruoyi-framework/src/main/java/com/ruoyi/framework/web/except | 1064 |
| q32 | 防止提交内容里夹带脚本攻击的过滤器在哪 | XSS过滤 | XSS过滤 | Y | Y | ruoyi-common/src/main/java/com/ruoyi/common/utils/html/Escap | 1100 |
| q33 | 错误提示的多语言文案从哪里加载 | 国际化 | 国际化 | Y | Y | ruoyi-framework/src/main/java/com/ruoyi/framework/config/I18 | 1108 |
| q34 | 文件上传接口在哪,上传的文件怎么落盘的 | 对象存储 | 对象存储 | Y | Y | ruoyi-common/src/main/java/com/ruoyi/common/utils/file/FileU | 1114 |
| q35 | 返回给前端的分页结果 total 总数在哪里组装 | 分页 | 分页 | Y | Y | ruoyi-common/src/main/java/com/ruoyi/common/utils/PageUtils. | 1113 |
| q36 | 员工离职后要停用他的账号,该在哪里操作 | 用户管理 | 用户管理 | Y | Y | ruoyi-common/src/main/java/com/ruoyi/common/core/domain/enti | 1498 |
| q37 | 想让某个方法每天凌晨两点自动执行,该怎么配 | 定时任务 | 定时任务 | Y | Y | ruoyi-quartz/src/main/java/com/ruoyi/quartz/controller/SysJo | 1544 |
| q38 | 接口被人疯狂刷,怎么给它加上请求频率限制 | 限流 | 限流 | Y | Y | ruoyi-framework/src/main/java/com/ruoyi/framework/aspectj/Ra | 1168 |
| q39 | 登录页输入的图形码是在哪里校验的 | 登录认证 | 登录认证 | Y | Y | ruoyi-framework/src/main/java/com/ruoyi/framework/web/servic | 1422 |
| q40 | 怀疑账号被盗,想看看这个人是否在线并把他踢下线 | 在线用户 | 在线用户 | Y | Y | ruoyi-admin/src/main/java/com/ruoyi/web/controller/monitor/S | 1503 |
| q41 | 分公司账号只能查到自己公司的数据,怎么按部门隔离 | 数据权限 | 数据权限 | Y | Y | ruoyi-framework/src/main/java/com/ruoyi/framework/aspectj/Da | 1098 |
| q42 | 出了问题想追溯是谁改的数据,在哪里能看到每次操作记录 | 操作日志 | 操作日志 | Y | Y | ruoyi-admin/src/main/java/com/ruoyi/web/controller/monitor/S | 1503 |
| q43 | 下拉框里正常停用这些状态文字想改,在哪里维护 | 字典管理 | 字典管理 | Y | Y | ruoyi-admin/src/main/java/com/ruoyi/web/controller/system/Sy | 1553 |
| q44 | 要给所有用户发一条系统通知,在哪个页面发 | 通知公告 | 通知公告 | Y | Y | ruoyi-admin/src/main/java/com/ruoyi/web/controller/system/Sy | 1527 |
| q45 | 新加了一张表,不想手写增删改查,怎么快速生成代码 | 代码生成 | 代码生成 | Y | Y | ruoyi-generator/src/main/java/com/ruoyi/generator/controller | 1545 |
| q46 | 新增用户的同时给他分配角色,这套流程的代码在哪 | 用户管理 | 用户管理 | Y | Y | ruoyi-admin/src/main/java/com/ruoyi/web/controller/system/Sy | 1401 |
| q47 | 给保存接口同时加上防重复提交和数据权限控制,该怎么做 | 防重复提交 | 防重复提交 | Y | Y | ruoyi-framework/src/main/java/com/ruoyi/framework/intercepto | 1105 |
| q48 | 列表既要分页又要能导出 Excel,前后端怎么配合 | 分页 | 分页 | Y | Y | ruoyi-common/src/main/java/com/ruoyi/common/core/page/TableS | 1103 |
| q49 | 登录成功后生成 token 并记录登录日志,这个流程在哪 | 登录认证 | 登录认证 | Y | Y | ruoyi-framework/src/main/java/com/ruoyi/framework/web/servic | 1530 |
| q50 | 定时任务执行失败要有异常处理和执行日志,在哪看 | 定时任务 | 定时任务 | Y | Y | ruoyi-quartz/src/main/java/com/ruoyi/quartz/util/AbstractQua | 1540 |

## 失败条目
