"""Debug Orpheus token output — inspect raw generation and id ranges."""
import os, re
from llama_cpp import Llama

HERE = os.path.dirname(os.path.abspath(__file__))
GGUF = os.path.join(HERE, "..", "tts-server", "orpheus-3b-Q4_K_M.gguf")

llm = Llama(model_path=GGUF, n_ctx=2048, n_gpu_layers=-1, verbose=False)
prompt = "<|audio|>tara: Hello there, this is a test.<|eot_id|>"
out = llm(prompt, max_tokens=400, temperature=0.6, top_p=0.9, repeat_penalty=1.1)
text = out["choices"][0]["text"]

print("=== RAW TEXT HEAD (first 400 chars) ===")
print(repr(text[:400]))
print()

matches = re.findall(r"<custom_token_(\d+)>", text)
print(f"=== custom_token count: {len(matches)} ===")
print("first 14 raw numbers:", matches[:14])
print()

# compute ids with the offset and report range / out-of-bounds
ids = [int(n) - 10 - ((i % 7) * 4096) for i, n in enumerate(matches)]
oob = [x for x in ids if x < 0 or x > 4095]
print(f"computed ids — min={min(ids)}, max={max(ids)}, out-of-range={len(oob)}/{len(ids)}")
print("first 14 ids:", ids[:14])
print()

# also try WITHOUT the index offset (alternate decode variant)
ids2 = [int(n) - 10 for n in matches]
print("alt (no index offset) first 14:", ids2[:14], "min", min(ids2), "max", max(ids2))
