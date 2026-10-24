# code-search — 无 LLM 代码检索工具

自然语言查询 → 多步定位 → 返回相关代码段。**全程不依赖生成式 LLM**:
信息提取(jieba/UIE)→ 两级索引短名单 → **Jev 决策模型**(Qwen3-VL-4B 字母 logits 选择题)选模块、选菜单 → zvec-grep 在菜单作用域内混合精筛。

实验报告与方法论:**[REPORT.md](REPORT.md)**(含 15 条踩坑经验、跨项目评测数据)。

## 方案架构(v5 · 判断题范式)

```
中文 NL 查询
  │
  ├─① 菜单批量判断: 全部菜单各一道"yes/no"判断题, 一个 batch 一次前向   ~0.6s
  │     → 按带符号 margin 排序取 Top1; Top1 领先不足(差<1)或置信<8 时取 Top2 两菜单并集
  ├─② zg 作用域三路融合精筛(该菜单映射的前后端文件, ~10 个)             ~0.3~1s
  │     --hybrid <中文原查> --vector/--fts <菜单en种子词> --fuse
  ├─③ 文件批量判断: 作用域内每个文件(文件名+前60行摘录)各一道判断题, 一个 batch ~0.5s
  │     → relevant 文件按 margin 排前, not relevant 沉底
  └─④ 重试循环 ≤3 轮: 若③全部 not relevant
        → 把"已检查菜单X未找到相关代码"写回①的判断题, 排除已试菜单, 重新一轮
  │
  ▼
代码段(文件:行号 + 代码预览, 按判定相关性排序)
```

- **一切皆判断题**:不生成文本。菜单级(33 个一次前向 ~0.6s)与文件级(~12 个 ~0.5s)都是
  独立 yes/no 判断,margin(两选项 logit 差)天然给出置信排序;
- **无 IE / 无 jieba / 无打分器**:路由完全由 jev 的批量判断承担,管道最小化;
- **en 种子词仍必要**:中文机制查询 → 英文标识符代码的跨语言鸿沟由⑥的三路融合弥补;
- **循环是兜底**:v3 时代打分门卫的职责,现在由"重选菜单 + 排除已试"的循环承担(≤3 轮);
- **embedding 用 zg 内置的 `local/potion-code-16m-v2`**;可选 qwen3-embedding-0.6b(见 REPORT §12)。

### 检索实例(真实运行数据,每步标注输入与输出)

查询输入:**「密码连续输错几次账号被锁定的逻辑在哪」**(RuoYi 项目)

**① 菜单批量判断(一个 batch 前向,~0.6s)**
- 输入:33 个菜单各一道判断题,如 `一个代码检索查询为: 密码连续输错几次账号被锁定的逻辑在哪。候选菜单: 登录认证 (password retry lock login captcha register)。这个菜单的代码是否包含该查询所需的逻辑? A. yes B. no`
- 输出(margin 降序 Top4):`登录认证(+8.5) · 用户管理(-3) · 权限校验(-4) · 全局异常处理(-4.1)`
  → 其余 29 个菜单全为负分拒绝;**Top1 = 登录认证**

**② zg 作用域三路融合精筛(~0.4s)**
- 输入:实际命令 `zg query --hybrid "密码连续输错…" --vector "password retry lock login captcha register" --fts "password retry lock login captcha register" --fuse --limit 6 -g <登录认证作用域 6 个后端文件>`
- 输出:`SysLoginService.java:36-176` 第 1(login 主流程,调用 validate 并捕获锁定异常)、`SecurityConfig`、`SysRegisterService` 等 BE 命中

**③ 文件批量判断(一个 batch 前向,~0.5s)**
- 输入:作用域内每个文件(文件名 + 前 60 行摘录)一道判断题,如 `Candidate file: SysLoginService.java ... Does this file contain the logic the query asks for? A. relevant B. not relevant`
- 输出:`SysLoginService relevant(+5.4) · SysRegisterService not(-9.8) · SecurityConfig not(-6.4)…`
  → relevant 文件排前,not relevant 沉底

端到端 **~2.0s**(模型常驻;两个 batch 前向 ~1.2s + zg ~0.4s),零降级,1 轮即命中。

### 检索实例(真实运行数据,每步标注输入与输出)

查询输入:**「密码连续输错几次账号被锁定的逻辑在哪」**(RuoYi 项目)

**① 关键词提取(jieba,6ms)**
- 输入:`密码连续输错几次账号被锁定的逻辑在哪`
- 输出:关键词 `[输错, 账号, 密码, 锁定, 几次, 连续]`

**② 模块短名单打分**
- 输入:①的关键词 + 查询原文,对照 4 个模块及其下属菜单的别名表
- 输出(得分):`系统管理=10.4 · 平台机制=5.2 · 系统监控=0 · 系统工具=0` → 候选 `[系统管理, 平台机制, 系统监控]`

**③ jev 决策#1(选模块,61ms 模型常驻)**
- 输入(实际 prompt,截取):`Question: 一个代码检索查询为: 密码连续输错几次账号被锁定的逻辑在哪。这个查询最属于哪个业务模块? Options: A. 系统管理(用户管理、角色管理、菜单管理…) B. 平台机制(登录认证、Token机制、数据权限…) C. 系统监控(在线用户、定时任务…)`
- 处理:一次前向,取 "Answer:" 位置上 ` A`/` B`/` C` 三个字母 token 的 logits,最大者为答案
- 输出:**平台机制**(margin 5.1)——注意它推翻了②的打分 Top1"系统管理";兜底规则立即把"系统管理"的菜单并入下一步候选池(否则"登录认证"根本进不了候选)

**④ 菜单短名单打分**
- 输入:平台机制 ∪ 系统管理的全部菜单 × 同一套打分器
- 输出(得分):`用户管理=10.5 · 登录认证=6.5 · Token机制=0 · 权限校验=0` → 候选 `[用户管理, 登录认证, Token机制, 权限校验]`

**⑤ jev 决策#2(选菜单,41ms 模型常驻)**
- 输入(实际 prompt,截取):`Question: …这个查询最应该在哪个功能菜单的代码里找? Options: A. 用户管理: 用户/账号/员工/密码/重置密码 | 涉及 SysUserController B. 登录认证: password retry lock login captcha register | 涉及 SysLoginController C. Token机制: …`(选项文本=菜单名+别名+英文种子词+控制器名,这是 jev 能对上"密码锁定→登录认证"的关键)
- 输出:**登录认证**(margin 11.9)

**⑥ zg 作用域三路融合精筛(~0.9s)**
- 输入(实际命令,作用域文件由两级索引给出):
```
zg query --hybrid "密码连续输错几次账号被锁定的逻辑在哪" \
  --vector "password retry lock login captcha register" \
  --fts "password retry lock login captcha register" --fuse --limit 6 \
  -g …/SysLoginController.java -g …/SecurityConfig.java -g …/SysLoginService.java \
  -g …/SysRegisterService.java -g …/CaptchaController.java -g …/SysPasswordService.java
```
  作用域共 6 个后端文件 + 4 个前端文件(login.vue / user.js / register.vue / login.js),总共 10 个文件
- 输出(融合排序,节选):

| # | 仓 | 文件:行段 | 说明 |
|---|---|---|---|
| 1 | BE | `SysLoginService.java:36-176` | login 主流程,调用 validate 并捕获锁定异常 |
| 4 | BE | **`SysPasswordService.java:21-86`** | **validate():重试计数 ≥ maxRetryCount 即抛 UserPasswordRetryLimitExceedException——就是它** |
| 1 | FE | `login.vue:107-141` | 前端登录页 |

端到端 ~1.2s(模型常驻;首查含加载 2~3s),零降级。两个关键点:第③步 jev 推翻打分,但兜底保证"登录认证"仍在候选;第⑥步若去掉 en 种子词的 vector/fts 通道,SysPasswordService 在这种纯英文标识符文件里检索不到。

## 仓库结构

```
tool/                       工具本体
  search.mjs                CLI 管道(--project <proj> --batch q.jsonl out.jsonl)
  pipeline_lib.mjs          管道核心库(web 与 CLI 共用)
  webserver.mjs             Web 服务(API + 静态页)
  jev_server.py             Jev 决策服务器(字母 logits 读出, JSON 行协议)
  ie_server.py              (已退役)早期 UIE+jieba 提取服务器, 运行时不再使用
  score_generic.mjs         通用评测评分器
  web/index.html            WebUI(单文件, 无框架)
  web/projects.json         项目注册表(名称→PROJ 目录)
projects/<name>/            每个目标系统一个项目
  index/code_index.json     两级索引(模块→菜单→前后端文件映射)
  eval/queries.jsonl        50 条自然语言查询基准
  eval/ground_truth.jsonl   真值标注(expectMenu/expectFiles)
  eval/results.jsonl        批量评测结果
  eval/eval_report.md       指标报告
  repos/<Repo>              目标系统源码(git submodule)
REPORT.md                   实验报告
```

## 内置项目

| 项目 | 领域 | 规模 | 索引 | 说明 |
|---|---|---|---|---|
| ruoyi | 若依 RuoYi-Vue 后台管理框架 | 6.4 万行 | 4 模块/33 菜单 | 基准项目,评测最完整 |
| mall | macrozheng/mall 电商中后台 | 21.5 万行 | 6 模块/34 菜单 | Vue3+TS 前端 |
| jeecg | JeecgBoot 低代码平台 | 43.8 万行 | 7 模块/43 菜单 | 菜单来自 sys_permission SQL |
| litemall | linlinjava/litemall 小商城 | 19 万行 | 9 模块/41 菜单 | 前后端同仓 |
| yudao | 芋道 ruoyi-vue-pro 多业务域 | 123 万行 | 11 模块/50 菜单 | ERP/CRM/支付/商城/AI |

## 快速开始

### 0. 依赖(Windows)

- bun(管道/web)、node(zg 运行时)、git
- `bun add -g @zvec/zvec-grep`(zg 0.2.1+,确认 `zg --version` 可用)
- Python 3.11 一个 venv(见 REPORT.md §4):
  - **jev 环境(唯一运行时依赖)**: torch(cu128)+ transformers 4.57+ peft;本地模型 `Qwen3-VL-4B-Instruct`(LoRA 可选)
  - (UIE/jieba 已从运行时移除;复现早期实验才需要 paddle 钉版组合, 见 REPORT §12.2.1a)
- GPU: 4B bf16 需 ~8GB 空闲显存
- 路径约定:`tool/pipeline_lib.mjs` 顶部 `JEV_PY` 指向 jev venv 的 python 与模型路径,按需修改

### 1. 拉取代码与目标系统(submodule)

```bash
git clone git@github.com:zelixir/code-search.git
cd code-search
git submodule update --init --recursive   # 拉全部目标系统源码
```

### 2. 建 zg 索引(每个目标仓库根目录一次)

```bash
# 后端仓库
cd projects/ruoyi/repos/RuoYi-Vue && zg index -t java -t xml -t sql --embedding local/potion-code-16m-v2
# 前端仓库
cd ../RuoYi-Vue3 && zg index -t vue -t js --embedding local/potion-code-16m-v2
```
注意:索引必须建在**仓库根**;类型名是 `js` 不是 `javascript`;TS 项目加 `-t typescript`。

### 3. 命令行查询

```bash
cd <任意目录>
bun tool/search.mjs --project projects/ruoyi "用户忘记密码后如何重置?"
# 批量评测
bun tool/search.mjs --project projects/mall --batch projects/mall/eval/queries.jsonl out.jsonl
bun tool/score_generic.mjs projects/mall
```

### 4. WebUI

```bash
bun tool/webserver.mjs --port 8642     # 首次请求时加载模型 ~15s
# 打开 http://127.0.0.1:8642  选择项目 → 输入查询 → 查看决策过程与代码段
```
项目注册表在 `tool/web/projects.json`,把自己的系统加进去即可。

### 5. 接入你自己的业务系统

1. 克隆你的前后端仓库到 `projects/<name>/repos/`;
2. 写 `projects/<name>/index/code_index.json`(两级索引,格式参考现有项目;菜单来源二选一:菜单表 SQL 或前端路由文件;**每菜单配 4~8 个别名**,这是定位精度的关键);
3. 仓库根建 zg 索引(步骤 2);
4. 写 50 条查询 + 真值(参考 eval/ 现有格式),`--batch` 跑评测看指标。

## 评测基线(RuoYi,50 查询 + 12 条改写型探针,RTX 5080)

v5.1 管道(判断题 batch 范式,无 IE/jieba/打分器,embedding = zg 内置 potion-code-16m-v2):

| 指标 | 值 |
|---|---|
| 菜单定位 Menu@1(单菜单承诺口径) | 86% |
| 文件 Hit@5 | **98%** |
| **代码段 Hit@5**(150 个符号级真值段) | **94%** |
| 段 MRR | 0.752 |
| MRR | 0.867 |
| 端到端耗时 | avg 1.65s(菜单 batch ~0.6s + zg ~0.5s + 文件 batch ~0.5s) |

(v3 两级选择题管道:Menu@1 100% / Hit@5 100% / 段 96% / MRR 0.863 / 1.37s,结果保留于 git 历史
results_v3.jsonl。v5.1 用"条件 Top2 并集"把终态指标追平到 2pp 以内,代价是路由 Top1 口径 86% 与
+0.3s;两类精度口径的差异见 REPORT §12.2.2b。)

评测工具:`tool/score_generic.mjs`(文件级)、`tool/score_segs.mjs`(段级);
改写型探针集:projects/ruoyi/eval/probe_cn.jsonl。段级真值:150 个符号段(eval/ground_truth.jsonl 的 expectSegs)。

其他四个项目(mall/jeecg/litemall/yudao)的对比数据见 REPORT.md §9(那些为 v1 管道实测;
其索引尚未做 en 种子与段级真值升级,属索引维护活,方法同 RuoYi)。
