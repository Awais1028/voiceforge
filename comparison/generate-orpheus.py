"""Generate speech with Orpheus (GGUF via llama.cpp) + SNAC decoder.
Non-streaming full decode — simplest reliable path for the comparison test.

Usage: python generate-orpheus.py "<text with optional emotion tags>" output.wav [voice]
"""
import sys
import time
import os
import re

import numpy as np
import soundfile as sf
import torch
from llama_cpp import Llama
from snac import SNAC

HERE = os.path.dirname(os.path.abspath(__file__))
GGUF = os.path.join(HERE, "..", "tts-server", "orpheus-3b-Q4_K_M.gguf")

TEXT = sys.argv[1] if len(sys.argv) > 1 else "Hello, this is Orpheus."
OUT = sys.argv[2] if len(sys.argv) > 2 else "orpheus_out.wav"
VOICE = sys.argv[3] if len(sys.argv) > 3 else "tara"

device = "mps" if torch.backends.mps.is_available() else "cpu"
print(f"Device: {device}")

print("Loading SNAC decoder…")
snac = SNAC.from_pretrained("hubertsiuzdak/snac_24khz").eval().to(device)

print("Loading Orpheus GGUF (Metal)…")
llm = Llama(model_path=GGUF, n_ctx=4096, n_gpu_layers=-1, verbose=False)

prompt = f"<|audio|>{VOICE}: {TEXT}<|eot_id|>"
print(f"Prompt: {prompt}")
print("Generating tokens…")

t0 = time.time()
out = llm(prompt, max_tokens=2000, temperature=0.6, top_p=0.9, repeat_penalty=1.1)
gen_text = out["choices"][0]["text"]
gen_time = time.time() - t0
print(f"Token generation: {gen_time:.1f}s")

# parse <custom_token_N>; value = N - 10. Control tokens are negative (dropped).
# Each real audio token encodes position (value // 4096) and code (value % 4096).
matches = re.findall(r"<custom_token_(\d+)>", gen_text)
raw = [int(n) - 10 for n in matches]
codes = [c for c in raw if 0 <= c < 7 * 4096]  # drop control/end markers
print(f"Audio tokens found: {len(matches)} ({len(codes)} valid after dropping control)")
if len(codes) < 7:
    print("ERROR: too few audio tokens — raw output head:")
    print(gen_text[:500])
    sys.exit(1)

frames = len(codes) // 7
codes_0, codes_1, codes_2 = [], [], []
for j in range(frames):
    f = codes[7 * j : 7 * j + 7]
    codes_0.append(f[0] % 4096)
    codes_1.append(f[1] % 4096); codes_1.append(f[4] % 4096)
    codes_2.append(f[2] % 4096); codes_2.append(f[3] % 4096)
    codes_2.append(f[5] % 4096); codes_2.append(f[6] % 4096)

layers = [
    torch.tensor(codes_0, device=device).unsqueeze(0),
    torch.tensor(codes_1, device=device).unsqueeze(0),
    torch.tensor(codes_2, device=device).unsqueeze(0),
]

print("Decoding with SNAC…")
with torch.inference_mode():
    audio = snac.decode(layers)

audio_np = audio.squeeze().cpu().numpy().astype(np.float32)
sf.write(OUT, audio_np, 24000)
dur = len(audio_np) / 24000
print(f"Wrote {OUT}: {dur:.1f}s of audio, generated in {gen_time:.1f}s  ({gen_time/dur:.1f}x realtime)")
