"""
VoiceForge Orpheus TTS server — expressive engine with emotion tags.

Loads the Orpheus GGUF (via llama.cpp + Metal) and SNAC decoder once, then serves:
  GET  /health           → { "status": "ok" }
  POST /v1/audio/speech  → WAV bytes (24kHz)
  GET  /v1/voices        → supported Orpheus voices

Orpheus has a ~4096-token context and is tuned for short utterances, so long
scripts are split into sentences, generated individually, and concatenated.
Supports inline emotion tags: <laugh> <sigh> <gasp> <chuckle> <cough> <sniffle> <groan> <yawn>

Run:  source venv-orpheus/bin/activate && python orpheus_server.py   (serves :8881)
"""
import io
import os
import re

import numpy as np
import soundfile as sf
import torch
import uvicorn
from fastapi import FastAPI
from fastapi.responses import JSONResponse, Response
from llama_cpp import Llama
from pydantic import BaseModel
from snac import SNAC

HERE = os.path.dirname(os.path.abspath(__file__))
GGUF = os.path.join(HERE, "orpheus-3b-Q4_K_M.gguf")

VOICES = ["tara", "leah", "jess", "leo", "dan", "mia", "zac", "zoe"]

device = "mps" if torch.backends.mps.is_available() else "cpu"

app = FastAPI(title="VoiceForge Orpheus")

print(f"Device: {device}")
print("Loading SNAC decoder…")
snac = SNAC.from_pretrained("hubertsiuzdak/snac_24khz").eval().to(device)
print("Loading Orpheus GGUF (Metal)… first load takes a few seconds")
llm = Llama(model_path=GGUF, n_ctx=4096, n_gpu_layers=-1, verbose=False)
print("Orpheus ready on http://localhost:8881")


class SpeechRequest(BaseModel):
    input: str
    voice: str = "tara"
    response_format: str = "wav"


def split_sentences(text: str) -> list[str]:
    """Split into sentence-sized chunks, keeping emotion tags attached."""
    text = text.strip()
    if not text:
        return []
    parts = re.split(r"(?<=[.!?])\s+", text)
    chunks: list[str] = []
    for p in parts:
        p = p.strip()
        if not p:
            continue
        # merge very short fragments onto the previous chunk for natural flow
        if chunks and len(p) < 25:
            chunks[-1] = chunks[-1] + " " + p
        else:
            chunks.append(p)
    return chunks


def generate_chunk(text: str, voice: str) -> np.ndarray:
    prompt = f"<|audio|>{voice}: {text}<|eot_id|>"
    out = llm(prompt, max_tokens=2000, temperature=0.6, top_p=0.9, repeat_penalty=1.1)
    gen_text = out["choices"][0]["text"]

    matches = re.findall(r"<custom_token_(\d+)>", gen_text)
    raw = [int(n) - 10 for n in matches]
    codes = [c for c in raw if 0 <= c < 7 * 4096]
    if len(codes) < 7:
        return np.zeros(0, dtype=np.float32)

    frames = len(codes) // 7
    c0, c1, c2 = [], [], []
    for j in range(frames):
        f = codes[7 * j : 7 * j + 7]
        c0.append(f[0] % 4096)
        c1.append(f[1] % 4096); c1.append(f[4] % 4096)
        c2.append(f[2] % 4096); c2.append(f[3] % 4096)
        c2.append(f[5] % 4096); c2.append(f[6] % 4096)

    layers = [
        torch.tensor(c0, device=device).unsqueeze(0),
        torch.tensor(c1, device=device).unsqueeze(0),
        torch.tensor(c2, device=device).unsqueeze(0),
    ]
    with torch.inference_mode():
        audio = snac.decode(layers)
    return audio.squeeze().cpu().numpy().astype(np.float32)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/v1/voices")
def voices():
    return {"voices": VOICES}


@app.post("/v1/audio/speech")
def speech(req: SpeechRequest):
    text = req.input.strip()
    if not text:
        return JSONResponse({"error": "input is empty"}, status_code=400)
    voice = req.voice if req.voice in VOICES else "tara"

    chunks = split_sentences(text)
    gap = np.zeros(int(24000 * 0.15), dtype=np.float32)  # 150ms between sentences
    segments: list[np.ndarray] = []
    for chunk in chunks:
        audio = generate_chunk(chunk, voice)
        if audio.size > 0:
            segments.append(audio)
            segments.append(gap)

    if not segments:
        return JSONResponse({"error": "generation produced no audio"}, status_code=500)

    full = np.concatenate(segments)
    buffer = io.BytesIO()
    sf.write(buffer, full, 24000, format="WAV")
    buffer.seek(0)
    return Response(content=buffer.read(), media_type="audio/wav")


if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8881, log_level="info")
