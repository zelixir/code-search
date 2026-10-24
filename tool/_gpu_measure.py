# -*- coding: utf-8 -*-
import json, sys, time
sys.stdout.reconfigure(encoding="utf-8", errors="replace")
import torch
from transformers import AutoProcessor, Qwen3VLForConditionalGeneration
BASE = r"D:\\ai\\anime-text-filter\\models\\visual-jev-4b\\Qwen3-VL-4B-Instruct"
t0 = time.time()
processor = AutoProcessor.from_pretrained(BASE)
processor.tokenizer.padding_side = "left"
model = Qwen3VLForConditionalGeneration.from_pretrained(BASE, torch_dtype=torch.bfloat16,
    attn_implementation="sdpa", device_map="cuda:0", low_cpu_mem_usage=True)
model.eval()
load_s = round(time.time() - t0, 1)
torch.cuda.synchronize()
mem_weights = torch.cuda.memory_allocated() / 2**30
mem_reserved = torch.cuda.memory_reserved() / 2**30
tok = processor.tokenizer
LETTERS = [chr(ord("A") + i) for i in range(26)]
PREFIX = f"<|im_start|>system\nYou are a decision model. You answer each question by choosing exactly one of the given options. You never explain.<|im_end|>\n<|im_start|>user\n"
def run_batch(reqs):
    texts = []
    for q, opt_text in reqs:
        rows = ["\n\nQuestion: " + q, "Options:", opt_text, "Reply with the single letter of the correct option."]
        texts.append(PREFIX + "\n".join(rows) + "<|im_end|>\n<|im_start|>assistant\nAnswer:")
    enc = processor(text=texts, padding=True, return_tensors="pt")
    enc = {k: v.to("cuda:0") for k, v in enc.items()}
    t1 = time.time()
    with torch.inference_mode():
        model(**enc, use_cache=False)
    torch.cuda.synchronize()
    return int((time.time() - t1) * 1000), enc["input_ids"].shape
out = {"load_s": load_s, "vram_weights_gb": round(mem_weights, 2), "vram_reserved_gb": round(mem_reserved, 2)}
torch.cuda.reset_peak_memory_stats()
# 场景1: 单题
msv, shp = run_batch([("查询Q", "A. yes B. no")])
torch.cuda.synchronize()
out["single_ms"], out["single_shape"] = msv, list(shp)
out["peak_after_single"] = round(torch.cuda.max_memory_allocated() / 2**30, 2)
# 场景2: 菜单 batch 33 x ~130tok
reqs2 = [("一个代码检索查询为: 测试查询%d。候选菜单: 某菜单%d (alias%d)。这个菜单是否相关?" % (i, i, i), "A. yes B. no") for i in range(33)]
msv, shp = run_batch(reqs2)
torch.cuda.synchronize()
out["menu33_ms"], out["menu33_shape"] = msv, list(shp)
out["peak_after_menu33"] = round(torch.cuda.max_memory_allocated() / 2**30, 2)
# 场景3: 文件 batch 12 x 摘录60行(~500tok)
reqs3 = [("Code search query: test query %d\nCandidate file: File%d.java\n" % (i, i) + "// code line\n" * 60 + "Does this file contain the logic?", "A. relevant B. not relevant") for i in range(12)]
msv, shp = run_batch(reqs3)
torch.cuda.synchronize()
out["file12_ms"], out["file12_shape"] = msv, list(shp)
out["peak_after_file12"] = round(torch.cuda.max_memory_allocated() / 2**30, 2)
# 场景4: 大 batch 42 x ~800tok(无zg实验的最坏情况)
reqs4 = [("Code search query: test %d\nCandidate segment\n" % i + "// code line\n" * 120 + "Does this segment contain the logic?", "A. relevant B. not relevant") for i in range(42)]
msv, shp = run_batch(reqs4)
torch.cuda.synchronize()
out["big42_ms"], out["big42_shape"] = msv, list(shp)
out["peak_after_big42"] = round(torch.cuda.max_memory_allocated() / 2**30, 2)
out["vram_reserved_final"] = round(torch.cuda.memory_reserved() / 2**30, 2)
print(json.dumps(out, ensure_ascii=False, indent=1))
