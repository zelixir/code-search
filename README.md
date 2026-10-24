# code-search — 无 LLM 代码检索工具

自然语言查询 → 多步定位 → 返回相关代码段。**全程不依赖生成式 LLM**:
信息提取(jieba/UIE)→ 两级索引短名单 → **Jev 决策模型**(Qwen3-VL-4B 字母 logits 选择题)选模块、选菜单 → zvec-grep 在菜单作用域内混合精筛。

实验报告与方法论:**[REPORT.md](REPORT.md)**(含 15 条踩坑经验、跨项目评测数据)。

## 方案架构

```
NL 查询 ─→ [信息提取 ~320ms] ─→ [模块短名单→jev决策 ~60ms] ─→ [菜单短名单→jev决策 ~60ms]
        ─→ [zg 作用域混合精筛 ~2.4s] ─→ 代码段(文件:行号+代码, BE×6 + FE×4)
```

骨架是**业务模块→菜单两级索引**(每个菜单映射前端 view/api 与后端 controller/service/mapper 文件),
索引一次构建离线维护;另有"平台机制伪菜单"承接不在菜单表里的基础设施查询(鉴权/数据权限/防重复提交/Excel/限流…)。

## 仓库结构

```
tool/                       工具本体
  search.mjs                CLI 管道(--project <proj> --batch q.jsonl out.jsonl)
  pipeline_lib.mjs          管道核心库(web 与 CLI 共用)
  webserver.mjs             Web 服务(API + 静态页)
  jev_server.py             Jev 决策服务器(字母 logits 读出, JSON 行协议)
  ie_server.py              信息提取服务器(UIE + jieba, JSON 行协议)
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
- Python 3.11 两个 venv(见 REPORT.md §4):
  - **jev 环境**: torch(cu128)+ transformers 4.57+ peft;本地模型 `Qwen3-VL-4B-Instruct`(LoRA 可选)
  - **关键词环境**: 只需 `pip install jieba`(纯 python, 无 paddle;UIE 已按消融移除, 见 REPORT §12.2.1a)
- GPU: 4B bf16 需 ~8GB 空闲显存
- 路径约定:`tool/pipeline_lib.mjs` 顶部 `IE_PY/JEV_PY` 指向两个 venv 的 python 与模型路径,按需修改

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

v3 管道(IE 恢复 + 全菜单 en 种子 + 三路融合,embedding = zg 内置 potion-code-16m-v2):

| 指标 | 值 |
|---|---|
| 菜单定位 Menu@1 | **100%** |
| 文件 Hit@5 | **100%** |
| **代码段 Hit@5**(150 个符号级真值段) | **96%** |
| 段 MRR | 0.784 |
| MRR | 0.863 |
| 端到端耗时 | avg 1.37s(zg server 常驻;决策 ~110ms · 精筛占大头) |

评测工具:`tool/score_generic.mjs`(文件级)、`tool/score_segs.mjs`(段级);
改写型探针集:projects/ruoyi/eval/probe_cn.jsonl。段级真值:150 个符号段(eval/ground_truth.jsonl 的 expectSegs)。

其他四个项目(mall/jeecg/litemall/yudao)的对比数据见 REPORT.md §9(那些为 v1 管道实测;
其索引尚未做 en 种子与段级真值升级,属索引维护活,方法同 RuoYi)。
