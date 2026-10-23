# -*- coding: utf-8 -*-
"""Jev decision server: Qwen3-VL-4B (+/- LoRA) letter-logits decisions, text-only.

Protocol (JSON lines on stdin -> stdout):
  req: {"id": "...", "question": "...", "options": ["optA", ...], "context": "optional"}
  res: {"id": "...", "choice": <int>, "probs": [...], "ms": <int>}
"""
import json
import math
import sys
import time

import torch
from transformers import AutoProcessor, Qwen3VLForConditionalGeneration

BASE = r"D:\ai\anime-text-filter\models\visual-jev-4b\Qwen3-VL-4B-Instruct"
ADAPTER = r"D:\ai\anime-text-filter\models\visual-jev-4b\visual-jev-4b-answer-sft"
LETTERS = [chr(ord("A") + i) for i in range(26)]
SYSTEM = ("You are a decision model. You answer each question by choosing exactly "
          "one of the given options. You never explain.")


def main():
    # Windows 管道默认 GBK, 强制 UTF-8
    sys.stdin.reconfigure(encoding="utf-8", errors="replace")
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    use_adapter = "--adapter" in sys.argv
    t0 = time.time()
    processor = AutoProcessor.from_pretrained(BASE)
    processor.tokenizer.padding_side = "left"
    model = Qwen3VLForConditionalGeneration.from_pretrained(
        BASE, torch_dtype=torch.bfloat16, attn_implementation="sdpa",
        device_map="cuda:0", low_cpu_mem_usage=True)
    if use_adapter:
        from peft import PeftModel
        model = PeftModel.from_pretrained(model, ADAPTER)
    model.eval()
    tok = processor.tokenizer
    opt_ids = []
    for L in LETTERS:
        ids = tok(f" {L}", add_special_tokens=False)["input_ids"]
        assert len(ids) == 1, (L, ids)
        opt_ids.append(ids[0])
    print(json.dumps({"ready": True, "adapter": use_adapter,
                      "load_s": round(time.time() - t0, 1)}), flush=True)

    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        try:
            req = json.loads(line)
        except Exception as e:
            print(json.dumps({"error": "bad json", "detail": str(e)}), flush=True)
            continue
        t1 = time.time()
        try:
            q = req["question"]
            options = req["options"]
            ctx = (req.get("context") or "").strip()
            prefix = (f"<|im_start|>system\n{SYSTEM}<|im_end|>\n<|im_start|>user\n"
                      + (f"{ctx}\n" if ctx else ""))
            rows = ["\n\nQuestion: " + q.strip(), "Options:"]
            for i, o in enumerate(options):
                rows.append(f"{LETTERS[i]}. {o}")
            rows.append("Reply with the single letter of the correct option.")
            text = prefix + "\n".join(rows) + "<|im_end|>\n<|im_start|>assistant\nAnswer:"
            enc = processor(text=[text], padding=True, return_tensors="pt")
            enc = {k: v.to("cuda:0") for k, v in enc.items()}
            with torch.inference_mode():
                out = model(**enc, use_cache=False)
            logits = out.logits[:, -1, :].float()[0]
            n = len(options)
            scores = [float(logits[opt_ids[i]].item()) for i in range(n)]
            best = max(range(n), key=lambda i: scores[i])
            mx = max(scores)
            exps = [math.exp(s - mx) for s in scores]
            tot = sum(exps)
            probs = [round(e / tot, 4) for e in exps]
            ranked = sorted(range(n), key=lambda i: -scores[i])
            margin = round(scores[ranked[0]] - scores[ranked[1]], 3) if n > 1 else 0.0
            print(json.dumps({"id": req.get("id"), "choice": best, "margin": margin,
                              "probs": probs, "ms": int((time.time() - t1) * 1000)},
                             ensure_ascii=False), flush=True)
        except Exception as e:
            print(json.dumps({"id": req.get("id"), "error": str(e)}, flush=True))


if __name__ == "__main__":
    main()
