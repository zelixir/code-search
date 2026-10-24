# 评测报告: ruoyi

| 指标 | 值 |
|---|---|
| Module@1 | 29/50 = 58.0% |
| Menu@1 | 11/50 = 22.0% |
| Menu@4 | 49/50 = 98.0% |
| Hit@5 | 35/50 = 70.0% |
| Hit@10 | 44/50 = 88.0% |
| MRR | 0.463 |
| degraded | 0/50 |
| 端到端 ms avg/p50/p90 | 1048/1010/1052 |
| 信息提取 ms avg | 0 |
| jev 决策 ms avg | 0 |
| zg 精筛 ms avg | 1048 |

## 逐条明细

| id | 查询 | 期望菜单 | 决策菜单 | Menu@1 | Hit@5 | 首命中 | ms |
|---|---|---|---|---|---|---|---|
| q01 | 后台新增用户账号的功能在哪里实现的 | 用户管理 | 角色管理 | N | N | src/views/system/user/index.vue | 2591 |
| q02 | 用户列表按条件筛选和批量删除的前端代码在哪 | 用户管理 | 用户管理 | Y | Y | ruoyi-system/src/main/java/com/ruoyi/system/service/ISysUser | 1753 |
| q03 | 想看看某个角色都勾了哪些菜单权限,在哪里改 | 角色管理 | 权限校验 | N | N | - | 1448 |
| q04 | 左侧导航栏的菜单项在哪里配置和维护 | 菜单管理 | 角色管理 | N | N | ruoyi-common/src/main/java/com/ruoyi/common/core/domain/enti | 1003 |
| q05 | 公司组织架构的树形结构在哪里维护 | 部门管理 | 数据权限 | N | N | ruoyi-admin/src/main/java/com/ruoyi/web/controller/system/Sy | 1014 |
| q06 | 人事招聘岗位信息在哪个页面维护 | 岗位管理 | 岗位管理 | Y | Y | ruoyi-admin/src/main/java/com/ruoyi/web/controller/system/Sy | 1007 |
| q07 | 性别、账户状态这些下拉选项的取值在哪里维护 | 字典管理 | 用户管理 | N | N | src/views/system/dict/index.vue | 1013 |
| q08 | 系统初始密码这类全局参数在哪里配置 | 参数设置 | 权限校验 | N | Y | ruoyi-admin/src/main/java/com/ruoyi/web/controller/system/Sy | 993 |
| q09 | 管理员在后台发布系统公告的功能在哪 | 通知公告 | 通知公告 | Y | Y | ruoyi-admin/src/main/java/com/ruoyi/web/controller/system/Sy | 1005 |
| q10 | 想查谁在什么时间登录过系统,在哪里看 | 登录日志 | 操作日志切面 | N | N | src/views/monitor/logininfor/index.vue | 999 |
| q11 | 管理员要把某个正在在线的账号强制退出,这个功能在哪 | 在线用户 | 用户管理 | N | Y | ruoyi-framework/src/main/java/com/ruoyi/framework/web/servic | 1014 |
| q12 | 每天凌晨自动清理过期数据的定时任务在哪里配置 | 定时任务 | 数据监控 | N | Y | ruoyi-quartz/src/main/java/com/ruoyi/quartz/controller/SysJo | 1003 |
| q13 | quartz 任务暂停、恢复和立即执行一次在哪里操作 | 定时任务 | 全局异常处理 | N | Y | ruoyi-quartz/src/main/java/com/ruoyi/quartz/util/AbstractQua | 1008 |
| q14 | 数据库连接池 druid 的运行状态在哪里查看 | 数据监控 | 服务监控 | N | N | - | 986 |
| q15 | 服务器 CPU 和内存的使用情况在哪里监控 | 服务监控 | 数据监控 | N | Y | ruoyi-framework/src/main/java/com/ruoyi/framework/web/domain | 996 |
| q16 | redis 缓存的使用情况在哪里监控展示 | 缓存监控 | 缓存监控 | Y | Y | ruoyi-common/src/main/java/com/ruoyi/common/constant/CacheCo | 992 |
| q17 | 某个缓存名称下键值对的详细内容在哪里查看 | 缓存列表 | 缓存监控 | N | Y | ruoyi-admin/src/main/java/com/ruoyi/web/controller/monitor/C | 981 |
| q18 | 根据数据库表自动生成增删改查代码的功能在哪 | 代码生成 | Excel导入导出 | N | Y | ruoyi-generator/src/main/java/com/ruoyi/generator/controller | 1013 |
| q19 | 密码连续输错几次账号被锁定的逻辑在哪 | 登录认证 | 用户管理 | N | Y | ruoyi-framework/src/main/java/com/ruoyi/framework/web/servic | 1021 |
| q20 | 登录时图形验证码的生成和校验流程在哪 | 登录认证 | 登录认证 | Y | Y | ruoyi-framework/src/main/java/com/ruoyi/framework/web/servic | 1020 |
| q21 | token 快过期时是怎么自动续期的 | Token机制 | Token机制 | Y | Y | ruoyi-framework/src/main/java/com/ruoyi/framework/web/servic | 1045 |
| q22 | 前端请求头里的 token 在后端怎么解析出当前用户 | Token机制 | Token机制 | Y | Y | ruoyi-framework/src/main/java/com/ruoyi/framework/web/servic | 1009 |
| q23 | hasPermi 权限注解在哪里解析和判断 | 权限校验 | 角色管理 | N | Y | ruoyi-framework/src/main/java/com/ruoyi/framework/web/servic | 1018 |
| q24 | 只能查看本部门及下级部门数据,数据范围的过滤在哪实现 | 数据权限 | 权限校验 | N | Y | ruoyi-framework/src/main/java/com/ruoyi/framework/aspectj/Da | 1007 |
| q25 | 防止表单重复提交是怎么实现的 | 防重复提交 | 表单构建 | N | Y | ruoyi-common/src/main/java/com/ruoyi/common/annotation/Repea | 978 |
| q26 | @Log 注解记录操作日志的切面逻辑在哪 | 操作日志切面 | 用户管理 | N | Y | ruoyi-framework/src/main/java/com/ruoyi/framework/aspectj/Lo | 1004 |
| q27 | 列表数据导出成 Excel 文件的实现在哪 | Excel导入导出 | Excel导入导出 | Y | Y | ruoyi-common/src/main/java/com/ruoyi/common/utils/poi/ExcelU | 1004 |
| q28 | 导入 Excel 的数据解析和字段校验在哪 | Excel导入导出 | 系统接口 | N | Y | ruoyi-common/src/main/java/com/ruoyi/common/utils/poi/ExcelU | 991 |
| q29 | 接口限流注解怎么用,底层限流逻辑在哪 | 限流 | 权限校验 | N | N | - | 682 |
| q30 | pageNum 和 pageSize 是怎么传给 PageHelper 的 | 分页 | 系统接口 | N | N | ruoyi-common/src/main/java/com/ruoyi/common/core/page/PageDo | 989 |
| q31 | 接口抛异常后统一返回错误提示的处理器在哪 | 全局异常处理 | 代码生成 | N | N | ruoyi-framework/src/main/java/com/ruoyi/framework/web/except | 1008 |
| q32 | 防止提交内容里夹带脚本攻击的过滤器在哪 | XSS过滤 | 防重复提交 | N | N | ruoyi-common/src/main/java/com/ruoyi/common/utils/html/Escap | 685 |
| q33 | 错误提示的多语言文案从哪里加载 | 国际化 | 字典管理 | N | Y | ruoyi-framework/src/main/java/com/ruoyi/framework/config/I18 | 1014 |
| q34 | 文件上传接口在哪,上传的文件怎么落盘的 | 对象存储 | 对象存储 | Y | Y | ruoyi-common/src/main/java/com/ruoyi/common/utils/file/FileU | 1052 |
| q35 | 返回给前端的分页结果 total 总数在哪里组装 | 分页 | 缓存列表 | N | Y | ruoyi-common/src/main/java/com/ruoyi/common/utils/PageUtils. | 1053 |
| q36 | 员工离职后要停用他的账号,该在哪里操作 | 用户管理 | 用户管理 | Y | Y | ruoyi-common/src/main/java/com/ruoyi/common/core/domain/enti | 1055 |
| q37 | 想让某个方法每天凌晨两点自动执行,该怎么配 | 定时任务 | 代码生成 | N | N | ruoyi-quartz/src/main/java/com/ruoyi/quartz/util/JobInvokeUt | 1035 |
| q38 | 接口被人疯狂刷,怎么给它加上请求频率限制 | 限流 | Token机制 | N | Y | ruoyi-common/src/main/java/com/ruoyi/common/core/redis/Redis | 688 |
| q39 | 登录页输入的图形码是在哪里校验的 | 登录认证 | 权限校验 | N | N | src/views/login.vue | 1045 |
| q40 | 怀疑账号被盗,想看看这个人是否在线并把他踢下线 | 在线用户 | 登录认证 | N | Y | ruoyi-framework/src/main/java/com/ruoyi/framework/web/servic | 1052 |
| q41 | 分公司账号只能查到自己公司的数据,怎么按部门隔离 | 数据权限 | 权限校验 | N | Y | ruoyi-framework/src/main/java/com/ruoyi/framework/aspectj/Da | 1007 |
| q42 | 出了问题想追溯是谁改的数据,在哪里能看到每次操作记录 | 操作日志 | 操作日志切面 | N | Y | ruoyi-admin/src/main/java/com/ruoyi/web/controller/monitor/S | 1015 |
| q43 | 下拉框里正常停用这些状态文字想改,在哪里维护 | 字典管理 | 参数设置 | N | N | - | 1010 |
| q44 | 要给所有用户发一条系统通知,在哪个页面发 | 通知公告 | 用户管理 | N | N | - | 1012 |
| q45 | 新加了一张表,不想手写增删改查,怎么快速生成代码 | 代码生成 | 表单构建 | N | Y | ruoyi-generator/src/main/java/com/ruoyi/generator/controller | 1015 |
| q46 | 新增用户的同时给他分配角色,这套流程的代码在哪 | 用户管理 | 角色管理 | N | Y | ruoyi-admin/src/main/java/com/ruoyi/web/controller/system/Sy | 1010 |
| q47 | 给保存接口同时加上防重复提交和数据权限控制,该怎么做 | 防重复提交 | 数据权限 | N | Y | ruoyi-framework/src/main/java/com/ruoyi/framework/aspectj/Da | 998 |
| q48 | 列表既要分页又要能导出 Excel,前后端怎么配合 | 分页 | 分页 | Y | Y | ruoyi-common/src/main/java/com/ruoyi/common/utils/poi/ExcelU | 1018 |
| q49 | 登录成功后生成 token 并记录登录日志,这个流程在哪 | 登录认证 | 用户管理 | N | Y | ruoyi-framework/src/main/java/com/ruoyi/framework/web/servic | 1022 |
| q50 | 定时任务执行失败要有异常处理和执行日志,在哪看 | 定时任务 | 全局异常处理 | N | Y | ruoyi-quartz/src/main/java/com/ruoyi/quartz/util/AbstractQua | 1024 |

## 失败条目

- q01 「后台新增用户账号的功能在哪里实现的」 期望=用户管理 决策=角色管理 hit5=false
- q03 「想看看某个角色都勾了哪些菜单权限,在哪里改」 期望=角色管理 决策=权限校验 hit5=false
- q04 「左侧导航栏的菜单项在哪里配置和维护」 期望=菜单管理 决策=角色管理 hit5=false
- q05 「公司组织架构的树形结构在哪里维护」 期望=部门管理 决策=数据权限 hit5=false
- q07 「性别、账户状态这些下拉选项的取值在哪里维护」 期望=字典管理 决策=用户管理 hit5=false
- q08 「系统初始密码这类全局参数在哪里配置」 期望=参数设置 决策=权限校验 hit5=true
- q10 「想查谁在什么时间登录过系统,在哪里看」 期望=登录日志 决策=操作日志切面 hit5=false
- q11 「管理员要把某个正在在线的账号强制退出,这个功能在哪」 期望=在线用户 决策=用户管理 hit5=true
- q12 「每天凌晨自动清理过期数据的定时任务在哪里配置」 期望=定时任务 决策=数据监控 hit5=true
- q13 「quartz 任务暂停、恢复和立即执行一次在哪里操作」 期望=定时任务 决策=全局异常处理 hit5=true
- q14 「数据库连接池 druid 的运行状态在哪里查看」 期望=数据监控 决策=服务监控 hit5=false
- q15 「服务器 CPU 和内存的使用情况在哪里监控」 期望=服务监控 决策=数据监控 hit5=true
- q17 「某个缓存名称下键值对的详细内容在哪里查看」 期望=缓存列表 决策=缓存监控 hit5=true
- q18 「根据数据库表自动生成增删改查代码的功能在哪」 期望=代码生成 决策=Excel导入导出 hit5=true
- q19 「密码连续输错几次账号被锁定的逻辑在哪」 期望=登录认证 决策=用户管理 hit5=true
- q23 「hasPermi 权限注解在哪里解析和判断」 期望=权限校验 决策=角色管理 hit5=true
- q24 「只能查看本部门及下级部门数据,数据范围的过滤在哪实现」 期望=数据权限 决策=权限校验 hit5=true
- q25 「防止表单重复提交是怎么实现的」 期望=防重复提交 决策=表单构建 hit5=true
- q26 「@Log 注解记录操作日志的切面逻辑在哪」 期望=操作日志切面 决策=用户管理 hit5=true
- q28 「导入 Excel 的数据解析和字段校验在哪」 期望=Excel导入导出 决策=系统接口 hit5=true
- q29 「接口限流注解怎么用,底层限流逻辑在哪」 期望=限流 决策=权限校验 hit5=false
- q30 「pageNum 和 pageSize 是怎么传给 PageHelper 的」 期望=分页 决策=系统接口 hit5=false
- q31 「接口抛异常后统一返回错误提示的处理器在哪」 期望=全局异常处理 决策=代码生成 hit5=false
- q32 「防止提交内容里夹带脚本攻击的过滤器在哪」 期望=XSS过滤 决策=防重复提交 hit5=false
- q33 「错误提示的多语言文案从哪里加载」 期望=国际化 决策=字典管理 hit5=true
- q35 「返回给前端的分页结果 total 总数在哪里组装」 期望=分页 决策=缓存列表 hit5=true
- q37 「想让某个方法每天凌晨两点自动执行,该怎么配」 期望=定时任务 决策=代码生成 hit5=false
- q38 「接口被人疯狂刷,怎么给它加上请求频率限制」 期望=限流 决策=Token机制 hit5=true
- q39 「登录页输入的图形码是在哪里校验的」 期望=登录认证 决策=权限校验 hit5=false
- q40 「怀疑账号被盗,想看看这个人是否在线并把他踢下线」 期望=在线用户 决策=登录认证 hit5=true
- q41 「分公司账号只能查到自己公司的数据,怎么按部门隔离」 期望=数据权限 决策=权限校验 hit5=true
- q42 「出了问题想追溯是谁改的数据,在哪里能看到每次操作记录」 期望=操作日志 决策=操作日志切面 hit5=true
- q43 「下拉框里正常停用这些状态文字想改,在哪里维护」 期望=字典管理 决策=参数设置 hit5=false
- q44 「要给所有用户发一条系统通知,在哪个页面发」 期望=通知公告 决策=用户管理 hit5=false
- q45 「新加了一张表,不想手写增删改查,怎么快速生成代码」 期望=代码生成 决策=表单构建 hit5=true
- q46 「新增用户的同时给他分配角色,这套流程的代码在哪」 期望=用户管理 决策=角色管理 hit5=true
- q47 「给保存接口同时加上防重复提交和数据权限控制,该怎么做」 期望=防重复提交 决策=数据权限 hit5=true
- q49 「登录成功后生成 token 并记录登录日志,这个流程在哪」 期望=登录认证 决策=用户管理 hit5=true
- q50 「定时任务执行失败要有异常处理和执行日志,在哪看」 期望=定时任务 决策=全局异常处理 hit5=true