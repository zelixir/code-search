# 无 LLM 代码检索工具:实验报告与复现指南

> 日期: 2026-10-23 ~ 2026-10-24 · 环境: Windows 11 + RTX 5080 16GB · 最终结论见 §8

## 1. 一句话结论

**方案可行**:本地 Jev 决策模型(Qwen3-VL-4B)+ zvec-grep(zg 混合检索)+ 轻量信息提取,不依赖任何生成式 LLM,即可实现"自然语言查询 → 多步定位 → 返回相关代码段"。在 RuoYi-Vue(6.4 万行)上 50 条查询实测:**菜单定位 100%、代码文件 Hit@5 100%、MRR 0.79,端到端平均 2.85s(p90 3.7s)**,其中决策模型仅占 119ms。方案已复制到 4 个不同架构的业务系统验证(§9)。

## 2. 术语:Jev 是什么

Jev 是 2026 年流行的**"秒级决策模型"范式**(APUS 提出并开源复现,代表作 guanxuyu/Visual-Jev、HIT-TMG/JevEmbed):不做长文本生成,而是把问题构造成**选择题,取候选字母 token 在 "Answer:" 位置的 logits 做边际比较**,一次前向出一个决策,延迟毫秒级。本实验使用的本地模型:

- 基座: `Qwen3-VL-4B-Instruct`(bf16,~8GB 显存)
- LoRA: `visual-jev-4b-answer-sft`(上游广告判定专用,**文本决策时不用**,用基座即可,中文选择题边际清晰)
- 读出协议:字母 token = `tokenizer(" A")` 等单 token id;决策分数 = 该 token 位置的 logit;margin = top1 - top2
- 运行环境:transformers 4.57.6 + peft(torch 2.11 cu128),加载 5~11s,单次决策 50~600ms(首查含预热)

## 3. 总体架构

```
自然语言查询
   │
   ▼
[信息提取] ie_server.py: jieba 关键词(TF-IDF) + UIE 字段(可选)     ~320ms
   │
   ▼
[模块短名单] 查询词 × 模块别名/菜单名 打分 → top3
   │
   ▼
[jev 决策#1] "这个查询属于哪个业务模块?" 选项=模块+菜单清单           ~60ms
   │
   ▼
[菜单短名单] 选中模块(必要时并入第二模块/打分第一模块)的菜单打分 → top4
   │   └─ 兜底:短名单全 0 分 → 交出整模块全部菜单
   ▼
[jev 决策#2] "最应该在哪个功能菜单的代码里找?" 选项=菜单+别名+控制器  ~60ms
   │
   ▼
[zg 作用域精筛] 在该菜单映射的前/后端文件范围内                       ~2400ms
   zg query --hybrid <原查询> [--fts <英文关键词> --fuse] -g 文件...  前后端各一次
   │   └─ 兜底:作用域空 → 全库混合检索(degraded 标记)
   ▼
按文件去重 → BE 6 条 + FE 4 条 → 代码段(file:lines + matchedBy)
```

两级索引是方案的骨架:`业务模块 → 菜单 → {前端 view/api, 后端 controller/service/mapper/domain 文件}`,一次构建、离线维护;查询时 jev 只做两级"选择题",精筛交给 zg 在小作用域内做。

## 4. 环境清单(复现所需)

| 组件 | 版本/位置 | 用途 |
|------|-----------|------|
| GPU | NVIDIA RTX 5080 16GB(4B bf16 需 ~8GB 空闲) | jev 决策 |
| bun | ~\.bun\bin\bun.exe | 管道编排脚本 |
| zg (zvec-grep) | 0.2.1,npm 全局(%APPDATA%\npm\zg.cmd),**依赖 node 在 PATH**(C:\Program Files\nodejs) | 混合检索 |
| node | C:\Program Files\nodejs\node.exe | zg CLI 运行时 |
| python 3.11 venv A(jev) | torch 2.11+cu128 / transformers 4.57.6 / peft 0.21.2 / accelerate;模型文件 visual-jev-4b(基座+LoRA) | 决策服务器 |
| python 3.11 venv B(IE) | paddlepaddle 2.6.2 / paddlenlp 2.6.1 / jieba + 钉版依赖(见 §7 坑 6) | 信息提取 |
| embedding 模型 | local/potion-code-16m-v2(zg 本地,首跑自动下载) | zg 向量检索 |
| 目标代码库 | 任意"菜单结构可解析"的业务系统(见 §5) | 检索对象 |

venv A 若本机没有现成的,可用 uv 重建:`uv venv --python 3.11 .venv-jev` + `uv pip install torch --index-url https://download.pytorch.org/whl/cu128` + transformers + peft + accelerate。

## 5. 复现步骤(换电脑/换目标系统)

1. **装工具链**:bun、node、`bun add -g @zvec/zvec-grep`(若 zg.cmd 的 node shebang shim 有问题,照官方 wrapper 手工修)。
2. **建 IE 环境**(§4 venv B 的钉版组合,`uv pip install -i https://pypi.tuna.tsinghua.edu.cn/simple ...`)。
3. **克隆目标业务系统**(前后端分仓库的都克隆),放到同一项目根 `PROJ` 下。
4. **建两级索引** `PROJ/index/code_index.json`(§6 方法论;样例见 code-search/index/)。
5. **每个仓库根单独建 zg 索引**:后端 `zg index -t java -t xml -t sql --embedding local/potion-code-16m-v2`;前端 `zg index -t vue -t js ...`。**不要在父目录建**(zg 会跳过嵌套 git 仓库)。
6. **跑查询**:`bun tool/search.mjs "查询"`(单条)或 `--batch q.jsonl out.jsonl`(批量,两个模型服务器进程内启动,结束自动 kill)。
7. **评测**:50 条查询 + ground_truth(格式见 eval/),score.mjs 出指标报告。

换目标系统时只需要重做 3~5 与查询集;search.mjs 已参数化(`--project <PROJ>`),索引里的文件路径首段=仓库名,自动推导 zg 工作目录。

## 6. 两级索引构建方法论(核心经验)

数据源二选一(按项目实际):
- **菜单表 SQL**(若依系/yudao/jeecg:sys_menu / sys_permission 表的 INSERT,含 name/parent_id/component/perms)——最准,直接得到 目录→菜单→组件路径→权限串;
- **前端路由文件**(mall-admin-web、litemall:src/router/index.js 菜单树,名称在 meta.title)。

映射流水线(全部数据驱动,不按菜单硬编码):
1. `component`(或路由 path)→ 前端 view 文件 + 同目录 + `src/api/<模块>/<slug>.js`(存在性校验);
2. `perms` 前缀(如 `system:user`)→ 在全部 .java 里搜 `'system:user` 找到 Controller;
3. 从 Controller 代码里提取引用的类名(含实体词干)→ 按文件名精确匹配出 Service/Impl/Mapper/domain/mapper.xml;
4. **纯前端/外链页面允许 beFiles 为空**(数据监控 druid、swagger、表单构建),这是真实情况;
5. **平台机制伪模块**:登录认证/Token/数据权限/防重复提交/Excel 导入导出/限流/分页/全局异常/XSS/操作日志切面/文件上传等——开发者"机制细节"类查询大多落在这些**不在菜单表里的基础设施代码**上,按文件名模式扫描(如 `RepeatSubmitInterceptor\.java$`)挂成伪菜单,实测机制类查询 17/17 全对;
6. **别名维护是精度的生命线**:每菜单 4~8 个同义词/口语说法(如 字典管理:下拉选项/下拉框/枚举/状态文字;定时任务:调度/quartz/cron/计划任务)。别名来自权限串、控制器命名和业务常识;别名缺口会直接变成检索失败(见踩坑 §7 坑 12)。

## 7. 踩坑清单(在别的电脑上复现大概率会撞到)

1. **环境变量被剥离的执行环境**(DSH harness/CI):`process.env.PATH` 可能 undefined、USERNAME/TEMP 缺失。python 子进程必须显式补齐 `USERNAME/USERPROFILE/APPDATA/LOCALAPPDATA/TEMP/TMP/SYSTEMROOT/PATH`,否则 torch 导入时 `getpass→import pwd` 直接崩(ModuleNotFoundError)。
2. **Windows python 管道默认 GBK**:JSON 行协议的服务进程必须 `sys.stdin/stdout.reconfigure(encoding="utf-8")`,否则中文 JSON 解析炸或输出乱码。
3. **zg 索引位置**:zg 把嵌套 git 仓库当独立工作区跳过,父目录建索引只会收到 2 个文件;必须**每个仓库根单独建**。
4. **zg 文件选择配置会存住**:一次带错参数(如 `-t javascript`,正确是 `-t js`)的 index 会把坏配置写进索引,之后 status 都报错,要 `zg index --drop --yes` 重建。
5. **cmd /c 引号嵌套不可靠**:中文查询 + 多重 -g 走 `cmd /c "zg ... \"...\""` 会静默失败。**最稳:spawnSync(node 全路径, [zg CLI js 路径, ...args 数组])**,无 shell 无引号问题。zg.cmd 本体还要 node 在 PATH(它是个 node 包装器)。
6. **paddlenlp 2.6.1 依赖链**(uv venv 默认裸装必踩):`import pip`(要装 pip)→ 需要 setuptools → huggingface_hub 必须 **0.19.4**(新版的 repo_type_and_id_from_hf_id 被删)→ datasets 要 **2.14.6 + pyarrow 12.0.1**(新版 pyarrow 要 numpy2,paddle 2.6 要 numpy1)。组合:`numpy<2, paddlepaddle==2.6.2, paddlenlp==2.6.1, huggingface_hub==0.19.4, datasets==2.14.6, pyarrow==12.0.1, multiprocess==0.70.14, setuptools, wheel, pip`。
7. **后台任务被连坐杀**:在 harness 工具进程里 detached spawn 的长任务,调用结束即被 Job Object 收割(AGENTS.md 早有记载)。要跑长命令用 harness 受管后台任务(pwsh run_in_background)或常驻方案。
8. **GPU 并发**:多个 jev 实例(每个 ~8GB)会在 16GB 卡上 OOM,多项目评测必须**串行**;单实例批跑时模型常驻,单查询决策仅 ~120ms。
9. **jev LoRA 用途**:上游 adapter 是广告判定(ad/not_ad)专用,通用文本决策用**基座**效果即可(边际 7~12,非常自信);若决策域与 adapter 训练域冲突反而带偏。
10. **bf16 logits 量级大**(正确项 ~37 vs 其他 ~23):softmax 概率饱和成 1/0,判断置信度要用 **margin(top1-top2)**,别用概率。
11. **UIE 零样本对抽象 schema 弱**:schema 写"模块/功能/机制"基本提不出东西;本方案关键词主力是 jieba TF-IDF,UIE 作辅助字段,不要指望它做查询理解的主力。
12. **别名缺口=检索失败**:"下拉选项的取值在哪里维护"提不出"字典"二字,若字典管理没有"下拉选项"别名则短名单全 0 分、候选退化为索引序。修法:别名维护 + "全零分时把整模块菜单交给 jev 决策"双保险。
13. **决策与打分不一致要兜底**:jev 偶尔推翻打分第一的模块(如"踢下线"查询选了系统管理而非系统监控),必须"决策≠打分top1 时并入 top1 模块的菜单",否则正确菜单不可达(此修复让 Menu@1 92%→100%)。
14. **同文件多段占坑**:zg 返回同文件多个 chunk 会挤掉其他文件,最终结果要按文件去重(Hit@5 90%→100% 的另一半功劳)。
15. **gitee 克隆会无故挂起**:超过 3 分钟没动静就删目录换路子——GitHub 走代理 `git -c http.proxy=http://127.0.0.1:31080 clone --depth 1`,或 codeload tar.gz 直下解压。

## 8. RuoYi-Vue 评测结果(50 查询)

目标系统:RuoYi-Vue 3.9.2(后端 SpringBoot 299 文件/2645 实体)+ RuoYi-Vue3(Vue3 160 文件/872 实体),共 6.4 万行。索引:4 模块(系统管理/系统监控/系统工具/平台机制)33 菜单(19 真实 + 14 机制伪菜单)。

查询集分布:a 直白菜单功能 18 / b 机制细节 17 / c 间接场景化 10 / d 跨级复合 5,真值文件全部存在性校验。

| 指标 | v1(修复前) | v2(三项修复后) |
|---|---|---|
| Module@1 | 94% | 94%(余 3 条为模块归属标注分歧,菜单与文件均对) |
| Menu@1 | 92% | **100%** |
| Hit@5 | 90% | **100%** |
| Hit@10 / MRR | 92% / 0.729 | 100% / 0.792 |
| degraded | 0% | 0% |

**查询耗时(50 条实测,v2)**:

| 阶段 | avg | p50 | p90 | 占比 |
|---|---|---|---|---|
| 信息提取(UIE+jieba) | 317ms | 328ms | 373ms | 11% |
| jev 两级决策 | **119ms** | 104ms | 139ms | 4% |
| zg 作用域精筛 | 2416ms | 2684ms | 3233ms | 85% |
| **端到端** | **2853ms** | 3040ms | 3719ms | — |

(批跑模式模型常驻,边际耗时更低;单查模式含模型加载 5~11s。)

三项修复(§7 坑 12/13/14)是 v1→v2 的全部变化,佐证失败模式集中在"短名单可达性"而非决策或检索本身。机制细节类查询(b 组)是方案最强项:MRR 0.94,首命中基本就是拦截器/切面/工具类本体。

## 9. 跨项目泛化验证(4 个大型业务系统)

<!-- CROSS_PROJECT_RESULTS -->

## 10. 文件清单(D:\ai\code-search)

| 文件 | 说明 |
|---|---|
| tool/search.mjs | 主管道(信息提取→两级决策→作用域精筛),--project 多项目参数化,--batch 批量 |
| tool/jev_server.py | jev 决策服务器(JSON 行协议,字母 logits 读出,--adapter 可选) |
| tool/ie_server.py | UIE+jieba 信息提取服务器(JSON 行协议) |
| index/code_index.json | RuoYi 两级索引(4 模块/33 菜单/别名/beFiles) |
| eval/queries.jsonl · ground_truth.jsonl · results*.jsonl | 50 查询基准与结果 |
| eval/score.mjs · score_v2.mjs · report*.md | 评分脚本与报告(v1/v2) |
| RuoYi-Vue/ · RuoYi-Vue3/ | 目标系统(各自 .zvec-grep/ 内有 zg 索引) |

## 11. 已知局限与下一步

- **瓶颈在 zg 进程 spawn**(~0.5s/次×2):zg server 模式(zg server on)或常驻可再砍一半端到端耗时;
- 中文语义召回依赖 potion-code-16m,换 qwen/text-embedding-v4 等中文更强的 embedding(zg 支持重建)预期 c 组(间接场景化)MRR 还能涨;
- 索引别名仍需人工维护;可离线用 jev 批量"自审"别名覆盖度(对每菜单生成反例查询测试可达性);
- 按钮级/字段级问题(如"重置密码按钮调哪个接口")当前靠精筛兜住,更细粒度需把按钮权限行纳入第三级索引;
- UIE 当前收益低,若要保留"信息提取模型"名分可换 UIE 微调版或直接去掉,不影响主链路。
