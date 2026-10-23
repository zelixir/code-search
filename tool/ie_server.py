# -*- coding: utf-8 -*-
"""UIE 信息提取服务器. 协议(JSON lines):
  req: {"id": "...", "query": "..."}
  res: {"id": "...", "fields": {"模块": [...], "功能": [...], "机制": [...]}, "keywords": [...], "ms": N}
"""
import json
import sys
import time

sys.stdin.reconfigure(encoding="utf-8", errors="replace")
sys.stdout.reconfigure(encoding="utf-8", errors="replace")
sys.stderr.reconfigure(encoding="utf-8", errors="replace")

from paddlenlp import Taskflow

SCHEMA = ["模块", "功能", "机制"]
ie = Taskflow("information_extraction", model="uie-base", schema=SCHEMA)

import jieba
import jieba.analyse
jieba.setLogLevel(60)
for w in ["若依", "ruoyi", "代码段", "定时任务", "数据权限", "操作日志", "登录日志", "验证码",
          "缓存监控", "在线用户", "字典管理", "参数设置", "通知公告", "岗位管理", "部门管理",
          "角色管理", "用户管理", "菜单管理", "代码生成", "表单构建", "系统接口", "服务监控",
          "强退", "导入", "导出", "重置", "调度", "脏话"]:
    jieba.add_word(w)
STOP = {"的", "了", "是", "在", "我", "有", "和", "就", "不", "人", "都", "一个", "怎么",
        "如何", "什么", "哪个", "哪些", "这个", "实现", "机制", "细节", "流程", "查询",
        "代码", "请", "找出", "相关", "使用", "进行", "可以", "支持", "时候", "哪里",
        "为什么", "怎样", "怎样", "逻辑", "方式", "方法", "详细", "具体", "位置", "哪里"}


def extract(query):
    t0 = time.time()
    r = ie(query)
    fields = {}
    for item in (r if isinstance(r, list) else [r]):
        for k, spans in item.items():
            fields[k] = [s["text"] for s in spans]
    kws = [w for w, _ in jieba.analyse.extract_tags(query, topK=12, withWeight=True)
           if w not in STOP and len(w) >= 2]
    return {"fields": fields, "keywords": kws, "ms": int((time.time() - t0) * 1000)}


print(json.dumps({"ready": True}), flush=True)
for line in sys.stdin:
    line = line.strip()
    if not line:
        continue
    try:
        req = json.loads(line)
        out = extract(req["query"])
        out["id"] = req.get("id")
        print(json.dumps(out, ensure_ascii=False), flush=True)
    except Exception as e:
        print(json.dumps({"error": str(e)}, ensure_ascii=False), flush=True)
